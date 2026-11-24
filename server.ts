import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from both current working directory and server file directory (supports Hostinger / Passenger / VPS)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

// Parse optional CLI flags (e.g., `tsx server.ts --port 3000 --host 0.0.0.0`)
function getCliArg(names: string[]): string | undefined {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    for (const name of names) {
      if (arg === name && argv[i + 1]) return argv[i + 1];
      if (arg.startsWith(`${name}=`)) return arg.slice(name.length + 1);
    }
  }
  return undefined;
}

const cliPortRaw = getCliArg(['--port', '-p']);
const cliPort = cliPortRaw ? parseInt(cliPortRaw, 10) : NaN;
const HOST = getCliArg(['--host', '-H']) || '0.0.0.0';

// Priority: explicit --port flag > PORT env (avoiding 8080 Nginx proxy port in AI Studio dev) > 3000
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : NaN;
const PORT =
  Number.isFinite(cliPort) && cliPort > 0
    ? cliPort
    : !IS_PROD && envPort === 8080
    ? 3000
    : Number.isFinite(envPort) && envPort > 0
    ? envPort
    : 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '45mb' }));

// Configurable Gemini models, fallback chain & timeout
const TEXT_MODEL = (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim();
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-4-hydrogen')
  .split(',')
  .map((m) => m.trim())
  .filter((m) => m && m !== TEXT_MODEL);
const MODEL_CHAIN = Array.from(new Set([TEXT_MODEL, ...FALLBACK_MODELS]));
const TRANSCRIBE_MODEL = (process.env.GEMINI_TRANSCRIBE_MODEL || 'gemini-3.5-transcribe').trim();
const GEMINI_TIMEOUT_MS = Math.max(
  5000,
  Math.min(120000, parseInt(process.env.GEMINI_TIMEOUT_MS || '25000', 10) || 25000)
);

// Optional persistent disk storage outside ephemeral Hostinger hbuilds/versions/<id>/ directory.
// Disabled by default (only enabled when ENABLE_DISK_STORAGE=true or DATA_DIR is explicitly configured).
function resolvePersistentPaths(): { enabled: boolean; dataDir: string; backupDir: string } {
  const explicitlyEnabled =
    process.env.ENABLE_DISK_STORAGE === 'true' || Boolean((process.env.DATA_DIR || '').trim());
  if (!explicitlyEnabled) {
    return { enabled: false, dataDir: '', backupDir: '' };
  }

  let baseRoot: string;
  if ((process.env.DATA_DIR || '').trim()) {
    baseRoot = path.resolve(process.env.DATA_DIR!.trim());
    return {
      enabled: true,
      dataDir: baseRoot,
      backupDir: path.join(path.dirname(baseRoot), 'respaldos'),
    };
  }

  // Auto-detect Hostinger hbuilds path (e.g. /home/uXXXX/domains/site.com/hbuilds/versions/123)
  const normalizedDir = __dirname.replace(/\\/g, '/');
  const hbuildsIdx = normalizedDir.indexOf('/hbuilds/');
  if (hbuildsIdx > 0) {
    baseRoot = normalizedDir.slice(0, hbuildsIdx);
  } else {
    baseRoot = path.resolve(__dirname, '..');
  }

  return {
    enabled: true,
    dataDir: path.join(baseRoot, 'datos'),
    backupDir: path.join(baseRoot, 'respaldos'),
  };
}

const STORAGE_PATHS = resolvePersistentPaths();

function initPersistentStorageIfEnabled() {
  if (!STORAGE_PATHS.enabled) return;
  try {
    fs.mkdirSync(STORAGE_PATHS.dataDir, { recursive: true });
    fs.mkdirSync(STORAGE_PATHS.backupDir, { recursive: true });
    const stateFile = path.join(STORAGE_PATHS.dataDir, 'estado.json');
    if (fs.existsSync(stateFile)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(STORAGE_PATHS.backupDir, `startup-backup-${stamp}.json`);
      fs.copyFileSync(stateFile, backupFile);
    }
  } catch (err) {
    console.warn('No se pudo inicializar almacenamiento persistente en disco:', err);
  }
}

initPersistentStorageIfEnabled();

// ============================================================
// Server-Side Authentication (scrypt hashing + session tokens)
// ============================================================
interface StoredCredential {
  username: string;
  displayName?: string;
  salt: string;
  hash: string;
  createdAt: string;
}

interface SessionRecord {
  username: string;
  displayName?: string;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = 'msc_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_SIGNING_SECRET =
  (process.env.SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');

const activeSessions = new Map<string, SessionRecord>();
let claimedCredential: StoredCredential | null = null;

function hashPasswordScrypt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function timingSafeCompareStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getEnvCredentials(): { username: string; password: string } | null {
  const username = (process.env.APP_LOGIN_USER || '').trim();
  const password = (process.env.APP_LOGIN_PASSWORD || '').trim();
  if (!username || !password) return null;
  return { username, password };
}

function getAuthStorePath(): string | null {
  if (!STORAGE_PATHS.enabled || !STORAGE_PATHS.dataDir) return null;
  const resolved = path.resolve(STORAGE_PATHS.dataDir, 'auth-credentials.json');
  const baseWithSep = path.resolve(STORAGE_PATHS.dataDir) + path.sep;
  if (!resolved.startsWith(baseWithSep)) return null;
  return resolved;
}

function loadClaimedCredentialFromDisk() {
  const filePath = getAuthStorePath();
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (
      parsed &&
      typeof parsed.username === 'string' &&
      typeof parsed.salt === 'string' &&
      typeof parsed.hash === 'string'
    ) {
      claimedCredential = parsed as StoredCredential;
    }
  } catch (err) {
    console.warn('No se pudieron cargar credenciales guardadas en disco:', err);
  }
}

function saveClaimedCredentialToDisk(cred: StoredCredential) {
  const filePath = getAuthStorePath();
  if (!filePath) return;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(cred, null, 2), { mode: 0o600 });
  } catch (err) {
    console.warn('No se pudieron guardar credenciales en disco:', err);
  }
}

loadClaimedCredentialFromDisk();

function isAuthConfigured(): boolean {
  return Boolean(getEnvCredentials() || claimedCredential);
}

function signSessionId(sessionId: string): string {
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_SECRET).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedToken(token: string | undefined): SessionRecord | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const sessionId = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(sessionId)
    .digest('hex');
  if (!timingSafeCompareStr(sig, expectedSig)) return null;
  const rec = activeSessions.get(sessionId);
  if (!rec) return null;
  if (Date.now() > rec.expiresAt) {
    activeSessions.delete(sessionId);
    return null;
  }
  return rec;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function extractRequestToken(req: Request): { token?: string; viaCookie: boolean } {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return { token: bearer, viaCookie: false };
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE_NAME]) {
    return { token: cookies[SESSION_COOKIE_NAME], viaCookie: true };
  }
  return { token: undefined, viaCookie: false };
}

function isRequestHttps(req: Request): boolean {
  const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return req.secure || proto.includes('https');
}

function buildSessionCookie(token: string, req: Request, maxAgeSec: number): string {
  const secure = isRequestHttps(req);
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) {
    attrs.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attrs.push('SameSite=Lax');
  }
  return attrs.join('; ');
}

function issueSession(res: Response, req: Request, username: string, displayName?: string): string {
  const sessionId = crypto.randomBytes(24).toString('hex');
  activeSessions.set(sessionId, {
    username,
    displayName: displayName || username,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  const signedToken = signSessionId(sessionId);
  res.setHeader(
    'Set-Cookie',
    buildSessionCookie(signedToken, req, Math.floor(SESSION_TTL_MS / 1000))
  );
  return signedToken;
}

function verifyCsrfForCookieMutation(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  if (req.headers['x-requested-with']) return true;
  const origin = req.headers.origin;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function requireAuthenticatedSession(req: Request, res: Response, next: NextFunction) {
  const { token, viaCookie } = extractRequestToken(req);
  const session = verifySignedToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'Sesión requerida. Inicia sesión con tu usuario y contraseña.',
    });
  }
  if (viaCookie && !verifyCsrfForCookieMutation(req)) {
    return res.status(403).json({
      error: 'Origen no autorizado para esta operación.',
    });
  }
  return next();
}

app.get('/api/auth/status', (req: Request, res: Response) => {
  const envCreds = getEnvCredentials();
  const { token } = extractRequestToken(req);
  const session = verifySignedToken(token);
  return res.json({
    configured: isAuthConfigured(),
    authenticated: Boolean(session),
    username: session?.username || null,
    displayName: session?.displayName || claimedCredential?.displayName || session?.username || null,
    managedByEnv: Boolean(envCreds),
  });
});

app.post('/api/auth/setup', (req: Request, res: Response) => {
  if (isAuthConfigured()) {
    return res.status(409).json({
      error: 'El acceso ya fue configurado. Inicia sesión con tu usuario y contraseña.',
    });
  }
  const username = String(req.body?.username || '').trim();
  const rawDisplayName = String(req.body?.displayName || '').trim();
  const displayName = (rawDisplayName || username).slice(0, 80);
  const password = String(req.body?.password || '');

  if (username.length < 3 || username.length > 64) {
    return res.status(400).json({ error: 'El usuario debe tener entre 3 y 64 caracteres.' });
  }
  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasswordScrypt(password, salt);
  claimedCredential = {
    username,
    displayName,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  saveClaimedCredentialToDisk(claimedCredential);

  const token = issueSession(res, req, username, displayName);
  return res.status(201).json({
    authenticated: true,
    username,
    displayName,
    token,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'Ingresa tu usuario y contraseña.' });
  }

  const envCreds = getEnvCredentials();
  if (envCreds) {
    const userOk = timingSafeCompareStr(username.toLowerCase(), envCreds.username.toLowerCase());
    const passOk = timingSafeCompareStr(password, envCreds.password);
    if (!userOk || !passOk) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    const envDisplayName = (process.env.APP_LOGIN_NAME || '').trim() || envCreds.username;
    const token = issueSession(res, req, envCreds.username, envDisplayName);
    return res.json({
      authenticated: true,
      username: envCreds.username,
      displayName: envDisplayName,
      token,
    });
  }

  if (!claimedCredential) {
    return res.status(409).json({
      error: 'Aún no has creado tus credenciales iniciales. Configura tu usuario y contraseña primero.',
    });
  }

  const userOk = timingSafeCompareStr(username.toLowerCase(), claimedCredential.username.toLowerCase());
  const computedHash = hashPasswordScrypt(password, claimedCredential.salt);
  const passOk = timingSafeCompareStr(computedHash, claimedCredential.hash);

  if (!userOk || !passOk) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const resolvedDisplayName = claimedCredential.displayName || claimedCredential.username;
  const token = issueSession(res, req, claimedCredential.username, resolvedDisplayName);
  return res.json({
    authenticated: true,
    username: claimedCredential.username,
    displayName: resolvedDisplayName,
    token,
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const { token } = extractRequestToken(req);
  if (token) {
    const dotIdx = token.indexOf('.');
    if (dotIdx > 0) {
      activeSessions.delete(token.slice(0, dotIdx));
    }
  }
  res.setHeader('Set-Cookie', buildSessionCookie('', req, 0));
  return res.json({ authenticated: false });
});

// Protect AI & internal data API routes behind verified session
app.use('/api/gemini', requireAuthenticatedSession);
app.use('/api/emotions', requireAuthenticatedSession);

function getApiKey(): string {
  const raw = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!raw || raw === 'MY_GEMINI_API_KEY') return '';
  return raw;
}

let cachedKey = '';
let cachedClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedKey = key;
    cachedClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

function parseJsonSafe<T = Record<string, any>>(rawText?: string | null): T {
  const cleaned = (rawText || '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}') as T;
}

function getThinkingConfigForModel(model: string) {
  return model.startsWith('gemini-4-')
    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
    : {};
}

function isRetryableModelError(error: any): boolean {
  const status = Number(error?.status || error?.statusCode) || 0;
  const msg = String(error?.message || '');
  return (
    status === 404 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /TIMEOUT|ETIMEDOUT|ECONNRESET|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED|NOT_FOUND|AbortError/i.test(msg)
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err: any = new Error(`Timeout tras ${Math.round(ms / 1000)}s esperando respuesta de ${label}.`);
      err.status = 504;
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function generateWithFallback(
  client: GoogleGenAI,
  request: {
    contents: any;
    config?: Record<string, any>;
  }
) {
  let lastError: any = null;
  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    try {
      const mergedConfig = {
        ...(request.config || {}),
        ...getThinkingConfigForModel(model),
      };
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: request.contents,
          config: mergedConfig,
        }),
        GEMINI_TIMEOUT_MS,
        model
      );
      return { response, usedModel: model };
    } catch (err: any) {
      lastError = err;
      const hasNext = i < MODEL_CHAIN.length - 1;
      if (hasNext && isRetryableModelError(err)) {
        console.warn(`[Gemini] Modelo ${model} falló (${err?.status || err?.message}). Intentando respaldo: ${MODEL_CHAIN[i + 1]}`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de Gemini.');
}

function sendGeminiError(res: Response, routeName: string, error: any) {
  console.error(`Error in ${routeName}:`, error);
  const status = Number(error?.status || error?.statusCode) || 500;
  const rawMsg = String(error?.message || 'Error procesando solicitud con Gemini IA');
  let friendly = rawMsg;
  if (status === 504 || /Timeout/i.test(rawMsg)) {
    friendly = `El proveedor de IA tardó demasiado en responder (${Math.round(GEMINI_TIMEOUT_MS / 1000)}s). Intenta de nuevo en unos segundos o configura un modelo más rápido en GEMINI_MODEL.`;
  } else if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(rawMsg)) {
    friendly = 'La clave GEMINI_API_KEY configurada en el servidor no es válida. Verifica la clave en las variables de entorno del servidor.';
  } else if (status === 403 || /PERMISSION_DENIED/i.test(rawMsg)) {
    friendly = 'Permiso denegado por la API de Gemini (403). Verifica que tu clave GEMINI_API_KEY tenga permisos activos.';
  } else if (status === 404 || /NOT_FOUND/i.test(rawMsg)) {
    friendly = `Modelo de Gemini no disponible (${MODEL_CHAIN.join(', ')}). Ajusta GEMINI_MODEL / GEMINI_FALLBACK_MODELS en tu archivo .env.`;
  } else if (status === 429 || /RESOURCE_EXHAUSTED/i.test(rawMsg)) {
    friendly = 'Límite de cuota de la API de Gemini alcanzado (429). Espera unos segundos o verifica la facturación de tu clave API.';
  } else if (status === 503 || /UNAVAILABLE|high demand/i.test(rawMsg)) {
    friendly = 'El modelo de Gemini está temporalmente saturado (503). Intenta nuevamente en unos segundos.';
  }
  return res.status(status >= 400 && status < 600 ? status : 500).json({ error: friendly, details: rawMsg });
}

function requireAiClient(res: Response): GoogleGenAI | null {
  const client = getAiClient();
  if (!client) {
    res.status(503).json({
      error:
        'GEMINI_API_KEY no está configurada en el servidor Node.js. Configura la variable de entorno GEMINI_API_KEY y reinicia el servidor.',
    });
    return null;
  }
  return client;
}

function normalizeAudioMimeType(rawMime?: string): string {
  const base = String(rawMime || 'audio/webm')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (!base || base === 'application/octet-stream') return 'audio/mpeg';
  if (base === 'audio/x-m4a' || base === 'audio/m4a' || base === 'audio/mp4a-latm') return 'audio/mp4';
  if (base === 'audio/x-wav' || base === 'audio/wave') return 'audio/wav';
  if (base === 'audio/mp3' || base === 'audio/x-mpeg-3' || base === 'audio/mpeg3') return 'audio/mpeg';
  if (base === 'video/webm') return 'audio/webm';
  if (base === 'video/mp4') return 'audio/mp4';
  return base;
}

// Helper to transcribe audio buffer (base64) with normalized MIME type, timeout & full fallback chain
async function transcribeAudioBase64(client: GoogleGenAI, base64Data: string, mimeType: string): Promise<string> {
  const cleanMime = normalizeAudioMimeType(mimeType);
  const cleanBase64 = String(base64Data || '').replace(/^data:[^;]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('El archivo de audio está vacío.');
  }

  const transcribeChain = Array.from(
    new Set([TRANSCRIBE_MODEL, 'gemini-4-hydrogen', ...MODEL_CHAIN])
  );
  let lastError: any = null;

  for (let i = 0; i < transcribeChain.length; i++) {
    const model = transcribeChain[i];
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: cleanBase64,
                },
              },
              {
                text: 'Transcribe con máxima fidelidad en español todo lo que se dice en este audio. Devuelve únicamente la transcripción limpia y clara.',
              },
            ],
          },
          config: getThinkingConfigForModel(model),
        }),
        Math.max(GEMINI_TIMEOUT_MS, 55000),
        model
      );
      const text = (response.text || '').trim();
      if (text) return text;
      lastError = new Error(`El modelo ${model} devolvió una transcripción vacía.`);
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.status || err?.statusCode) || 0;
      const hasNext = i < transcribeChain.length - 1;
      if (hasNext && (isRetryableModelError(err) || status === 400)) {
        console.warn(`[Gemini Audio] ${model} falló (${err?.status || err?.message}), probando ${transcribeChain[i + 1]}`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('No se pudo transcribir el audio.');
}

// Strategic AI Advisor Endpoint
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { prompt, context, pillarData, tone = 'directo' } = req.body || {};

    const systemInstruction = `Eres el Asistente Estratégico Ejecutivo de "MI SEGUNDO CEREBRO 4.0".
Tu propósito es asesorar al usuario en su crecimiento integral: ESPIRITUAL + EMOCIONAL + FÍSICO + INTELECTUAL + FINANCIERO = MEJOR VERSIÓN.
Integra de manera armónica y original tres filosofías:
1. Isra García: Alto rendimiento, disciplina inquebrantable, experimentos vitales, autoconocimiento pragmático.
2. Jürgen Klaric: Persuasión ética, visión comercial estratégica, entendimiento de la psicología humana y escalamiento empresarial.
3. Diego Dreyfus: Introspección cruda, responsabilidad individual total, cuestionamiento constructivo, erradicar excusas y vivir con autenticidad.

REGLAS CRÍTICAS:
- NUNCA te limites a halagar o felicitar pasivamente. Cuestiona con firmeza y elegancia constructiva.
- Si el usuario tiene demasiadas tareas pendientes, ayúdalo a filtrar las 3 verdaderamente críticas (regla 80/20).
- Si detectas que descuida su salud o descanso por trabajar en exceso, señálale la alerta de balance.
- Tono solicitado: ${tone}.
- Responde en español, de forma concisa, con viñetas claras y accionables.`;

    const mergedContext = context || (pillarData ? { pillarData } : {});
    const userMessage = `Contexto del usuario actual:\n${JSON.stringify(mergedContext, null, 2)}\n\nPregunta / Situación:\n${prompt || 'Analiza mi estado actual.'}`;

    const { response, usedModel } = await generateWithFallback(client, {
      contents: userMessage,
      config: { systemInstruction },
    });

    return res.json({ response: response.text || 'Sin respuesta generada.', model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/advisor', error);
  }
});

// Daily Motivation & Mindset Endpoint
app.post('/api/gemini/motivation', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { moment = 'activacion', pillarSummary, tone = 'directo' } = req.body || {};

    const systemInstruction = `Eres el Mentor de Mentalidad & Motivación de "MI SEGUNDO CEREBRO 4.0".
Genera un mensaje de mentalidad conciso, impactante y con criterio para el momento: "${String(moment).toUpperCase()}".
Momentos:
- ACTIVACION: Al iniciar el día. Enérgico, enfocado en intención, 3 prioridades y congruencia personal.
- ENFOQUE: A mitad de jornada. Reenfoque estratégico, eliminación de ruido, ejecución implacable.
- REFLEXION: Al cerrar la noche. Rendición de cuentas, autoevaluación honesta, gratitud y descanso regenerador.
Tono seleccionado: ${tone}.
No uses clichés vacíos de autoayuda. Haz que cada palabra inspire responsabilidad y acción inmediata.`;

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Resumen de estado del usuario:\n${JSON.stringify(pillarSummary || {}, null, 2)}`,
      config: { systemInstruction },
    });

    return res.json({ message: response.text || 'Enfócate en tus 3 prioridades críticas hoy.', model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/motivation', error);
  }
});

// Wisdom Library & Capsule Endpoint
app.post('/api/gemini/wisdom', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { bookTitle, author, chapter, excerpt, pageRef } = req.body || {};

    const systemInstruction = `Eres el Analista Intelectual de "MI SEGUNDO CEREBRO 4.0".
A partir del texto o referencia de libro aportado por el usuario, extrae y sintetiza una Cápsula Diaria de Sabiduría en formato JSON estructurado:
{
  "bookTitle": "string",
  "author": "string",
  "chapter": "string",
  "coreIdea": "string",
  "quote": "cita textual breve con fidelidad",
  "pageRef": "Pág. X o Ref",
  "aiInterpretation": "análisis profundo del concepto",
  "personalApplication": "cómo aplicarlo al crecimiento personal y 5 pilares",
  "businessApplication": "cómo aplicarlo al ecosistema empresarial y toma de decisiones",
  "practicalAction": "acción concreta de hoy (menos de 20 palabras)"
}
Respeta los derechos de autor: no reproduzcas capítulos completos, únicamente extractos breves de análisis.`;

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Libro: ${bookTitle || 'Sin título'}, Autor: ${author || 'Desconocido'}, Capítulo/Página: ${chapter || pageRef || 'General'}\nContenido / Extracto:\n${excerpt || 'Resumen y principios fundamentales'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = parseJsonSafe<Record<string, any>>(response.text);
    if (pageRef && !parsed.pageRef) parsed.pageRef = pageRef;
    return res.json({ capsule: parsed, model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/wisdom', error);
  }
});

// Executive Meeting Minutes & Audio Transcription Endpoint (Dirección & Estrategia + NoteLLM compatible)
app.post('/api/gemini/meeting-minutes', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { audioBase64, mimeType, rawNotes, businessName, scopeContext } = req.body || {};

    let transcript = (rawNotes || '').trim();
    if (audioBase64) {
      const transcribed = await transcribeAudioBase64(client, audioBase64, mimeType || 'audio/webm');
      transcript = transcript ? `${transcribed}\n\nNotas adicionales:\n${transcript}` : transcribed;
    }

    if (!transcript) {
      return res.status(400).json({ error: 'Se requiere un archivo de audio o notas de reunión.' });
    }

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Ámbito: ${scopeContext || 'Empresarial'}\nContexto / Empresa: ${businessName || 'General'}\n\nTranscripción / Notas:\n${transcript}`,
      config: {
        systemInstruction:
          'Eres el Secretario Ejecutivo y Mentor Estratégico de "MI SEGUNDO CEREBRO 4.0". Analiza la transcripción o notas (puede ser una reunión empresarial o una mentoría/reflexión personal o exportación de NotebookLM) y extrae un acta estructurada, precisa y accionable en español.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título breve de la reunión, mentoría o decisión' },
            context: { type: Type.STRING, description: 'Contexto, problema o tema central tratado' },
            decision: { type: Type.STRING, description: 'Resolución, aprendizaje práctico o acuerdo principal' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 3 a 6 puntos importantes, compromisos o hallazgos clave',
            },
            expectedOutcome: { type: Type.STRING, description: 'Impacto o transformación esperada tras aplicar el acta' },
          },
          required: ['title', 'context', 'decision', 'keyPoints', 'expectedOutcome'],
        },
      },
    });

    const parsed = parseJsonSafe<Record<string, any>>(response.text);
    const normalizedMinutes = {
      title: String(parsed.title || 'Acta de Reunión / Nota de Voz').trim(),
      context: String(parsed.context || '').trim(),
      decision: String(parsed.decision || parsed.context || transcript.slice(0, 280)).trim(),
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map((kp: any) => String(kp).trim()).filter(Boolean)
        : [],
      expectedOutcome: String(parsed.expectedOutcome || '').trim(),
    };

    return res.json({
      transcript,
      minutes: normalizedMinutes,
      model: usedModel,
    });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/meeting-minutes', error);
  }
});

// Personal Experiment Coach Endpoint (Isra García + Diego Dreyfus comparison & coaching)
app.post('/api/gemini/experiment-coach', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { experiment, linkedNotes = [], question } = req.body || {};
    if (!experiment) {
      return res.status(400).json({ error: 'Faltan datos del experimento.' });
    }

    const logs = Array.isArray(experiment.logs) ? experiment.logs : [];

    const systemInstruction = `Eres el Mentor de Experimentos Personales de "MI SEGUNDO CEREBRO 4.0", combinando la filosofía pragmática de incomodidad y alto rendimiento de Isra García con la introspección cruda y coherencia radical de Diego Dreyfus.
TU MISIÓN:
1. Comparar la evolución cronológica real entre los primeros registros (línea base) y los últimos registros del experimento (variables numéricas, checklists y notas mentales/alimentarias).
2. Señalar con total honestidad dónde hay progreso real y dónde hay estancamiento o autoengaño.
3. Si hay notas de mentorías vinculadas, conectarlas directamente con el experimento.
4. Entregar 3 ajustes tácticos concretos para los próximos días.
Responde en español, directo, sin clichés suaves, con viñetas claras.`;

    const promptPayload = `Experimento: ${experiment.title}
Inspiración: ${experiment.inspiration}
Hipótesis: ${experiment.hypothesis}
Propósito: ${experiment.purpose}
Duración objetivo: ${experiment.durationDays} días
Campos definidos: ${JSON.stringify(experiment.fields)}
Registros cronológicos (${logs.length}): ${JSON.stringify(logs)}
Notas/Mentorías vinculadas: ${JSON.stringify(linkedNotes)}
Pregunta específica del usuario: ${question || 'Compara mis registros desde el día 1 hasta hoy y dime qué debo ajustar para elevar mis resultados.'}`;

    const { response, usedModel } = await generateWithFallback(client, {
      contents: promptPayload,
      config: { systemInstruction },
    });

    return res.json({ feedback: response.text || 'Sin retroalimentación generada.', model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/experiment-coach', error);
  }
});

// Convert pasted template or list of steps into a structured PersonalExperiment
app.post('/api/gemini/experiment-from-template', async (req: Request, res: Response) => {
  try {
    const { templateText = '', customTitle = '' } = req.body || {};
    const raw = String(templateText).trim();
    if (!raw) {
      return res.status(400).json({ error: 'Se requiere el texto de la plantilla o lista de pasos.' });
    }

    const client = requireAiClient(res);
    if (!client) return;

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `${customTitle ? `Título sugerido por usuario: ${customTitle}\n` : ''}Plantilla / Lista de pasos enviada por el usuario:\n"""\n${raw}\n"""`,
      config: {
        systemInstruction: `Eres el Arquitecto de Experimentos Personales de "MI SEGUNDO CEREBRO 4.0".
El usuario te entrega una plantilla, rutina, checklist o lista de pasos que desea experimentar.
Debes transformarla en un experimento personal completo, práctico y medible en español.
Reglas:
- "pillar" debe ser exactamente uno de: "espiritual" | "emocional" | "fisico" | "intelectual" | "financiero".
- "inspirationColor" debe ser exactamente uno de: "fuchsia" | "indigo" | "emerald" | "amber" | "rose" | "cyan".
- "durationDays" entre 7 y 90 según el texto (21 por defecto).
- "dailySubtasks": extrae entre 3 y 8 pasos concretos y accionables del texto del usuario (limpios, concisos).
- "fields": genera entre 3 y 6 campos de medición diarios. Usa tipos exactos: "percent_10", "timer_minutes", "number", "checkbox", "text". Incluye al menos un "percent_10", un campo cuantitativo o checkbox acorde a los pasos, y un campo "text" para reflexión/observación.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            inspiration: { type: Type.STRING },
            inspirationColor: { type: Type.STRING },
            pillar: { type: Type.STRING },
            goalDescription: { type: Type.STRING },
            hypothesis: { type: Type.STRING },
            purpose: { type: Type.STRING },
            durationDays: { type: Type.NUMBER },
            dailySubtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  placeholder: { type: Type.STRING },
                },
                required: ['label', 'type'],
              },
            },
          },
          required: [
            'title',
            'inspiration',
            'inspirationColor',
            'pillar',
            'goalDescription',
            'hypothesis',
            'purpose',
            'durationDays',
            'dailySubtasks',
            'fields',
          ],
        },
      },
    });

    const parsed = parseJsonSafe<Record<string, any>>(response.text);
    const validPillars = ['espiritual', 'emocional', 'fisico', 'intelectual', 'financiero'];
    const validColors = ['fuchsia', 'indigo', 'emerald', 'amber', 'rose', 'cyan'];
    const validTypes = ['text', 'number', 'checkbox', 'percent_10', 'timer_minutes'];

    const normalized = {
      title: String(parsed.title || customTitle || 'Experimento Personalizado').trim(),
      inspiration: String(parsed.inspiration || 'Coach IA').trim(),
      inspirationColor: validColors.includes(parsed.inspirationColor) ? parsed.inspirationColor : 'fuchsia',
      pillar: validPillars.includes(parsed.pillar) ? parsed.pillar : 'fisico',
      goalDescription: String(parsed.goalDescription || '').trim(),
      hypothesis: String(parsed.hypothesis || '').trim(),
      purpose: String(parsed.purpose || '').trim(),
      durationDays: Math.max(3, Math.min(365, Number(parsed.durationDays) || 21)),
      dailySubtasks: Array.isArray(parsed.dailySubtasks)
        ? parsed.dailySubtasks.map((s: any) => String(s).trim()).filter(Boolean)
        : [],
      fields: Array.isArray(parsed.fields)
        ? parsed.fields.map((f: any, idx: number) => {
            const t = validTypes.includes(f.type) ? f.type : 'text';
            return {
              id: `fld_${Date.now()}_${idx}`,
              label: String(f.label || `Campo ${idx + 1}`).trim(),
              type: t,
              unit:
                t === 'percent_10'
                  ? '%'
                  : t === 'timer_minutes'
                  ? 'min'
                  : f.unit
                  ? String(f.unit)
                  : undefined,
              placeholder: t === 'text' ? String(f.placeholder || 'Observación del día...') : undefined,
            };
          })
        : [],
    };

    if (normalized.fields.length === 0) {
      normalized.fields = [
        { id: `fld_${Date.now()}_0`, label: 'Avance del Protocolo (%)', type: 'percent_10', unit: '%', placeholder: undefined },
        { id: `fld_${Date.now()}_1`, label: 'Tiempo Dedicado', type: 'timer_minutes', unit: 'min', placeholder: undefined },
        { id: `fld_${Date.now()}_2`, label: 'Observación mental del día', type: 'text', unit: undefined, placeholder: '¿Qué funcionó hoy?' },
      ];
    }

    return res.json({ experimentDraft: normalized, model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/experiment-from-template', error);
  }
});

// Scoped System AI Assistant Declarations (Strictly limited to internal app modules)
const systemAssistantDeclarations: FunctionDeclaration[] = [
  {
    name: 'create_reminder',
    description: 'Crea una nota o recordatorio en la bandeja unificada de Segundo Cerebro & Recordatorios y opcionalmente en Mi Día.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Título breve del recordatorio' },
        content: { type: Type.STRING, description: 'Detalle o nota del recordatorio' },
        originModule: {
          type: Type.STRING,
          description: 'Módulo de origen: personal | business | super_manana | super_noche | finanzas | fisico | sabiduria | sistema | general',
        },
        reminderDate: { type: Type.STRING, description: 'Fecha YYYY-MM-DD' },
        reminderTime: { type: Type.STRING, description: 'Hora HH:MM opcional' },
        showInMiDia: { type: Type.BOOLEAN, description: 'Si debe aparecer en Mi Día' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_task',
    description: 'Agenda una tarea personal o empresarial en Gestión de Tareas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Nombre claro de la tarea o reunión' },
        scope: { type: Type.STRING, description: 'personal o business' },
        priority: { type: Type.STRING, description: 'urgent_important | important | urgent | normal' },
        dueDate: { type: Type.STRING, description: 'Fecha YYYY-MM-DD' },
        estimatedMinutes: { type: Type.NUMBER, description: 'Duración estimada en minutos' },
        remindInInbox: { type: Type.BOOLEAN, description: 'Si se añade también a la bandeja de recordatorios' },
      },
      required: ['title', 'scope'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marca como completada una tarea existente cuyo título coincida parcialmente con la solicitud del usuario.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskQuery: { type: Type.STRING, description: 'Palabras clave del título de la tarea a completar' },
      },
      required: ['taskQuery'],
    },
  },
  {
    name: 'register_payment',
    description: 'Registra un gasto, pago, ingreso o abono a deuda en Finanzas Personales (también desde comprobantes/transferencias adjuntas).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: 'expense | income | investment | debt_payment' },
        amount: { type: Type.NUMBER, description: 'Monto numérico en dólares' },
        category: { type: Type.STRING, description: 'Categoría financiera' },
        description: { type: Type.STRING, description: 'Concepto o comercio/destinatario del comprobante' },
        date: { type: Type.STRING, description: 'Fecha YYYY-MM-DD' },
        scope: { type: Type.STRING, description: 'personal o business' },
      },
      required: ['type', 'amount', 'description'],
    },
  },
  {
    name: 'navigate_module',
    description: 'Abre o dirige al usuario a un módulo específico del sistema (ej. super_morning, super_night, mi_dia, personal_finances, tasks_general, second_brain, physical_trainer, business, strategy).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        viewId: { type: Type.STRING, description: 'ID de vista del sistema' },
      },
      required: ['viewId'],
    },
  },
];

// System AI Assistant Endpoint (Multimodal: Text, Audio Voice, Receipt Images/PDF)
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { message, audioBase64, audioMimeType, fileBase64, fileMimeType, appSnapshot } = req.body || {};

    let effectivePrompt = (message || '').trim();

    if (audioBase64) {
      const transcribed = await transcribeAudioBase64(client, audioBase64, audioMimeType || 'audio/webm');
      effectivePrompt = effectivePrompt ? `${effectivePrompt}\n[Audio transcrito]: ${transcribed}` : transcribed;
    }

    const parts: any[] = [];
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64,
        },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    parts.push({
      text: `Fecha actual: ${todayStr}\nEstado actual resumido del sistema:\n${JSON.stringify(appSnapshot || {}, null, 2)}\n\nSolicitud del usuario:\n${effectivePrompt || 'Analiza el archivo o comprobante adjunto y ejecuta la acción correspondiente dentro del sistema.'}`,
    });

    const { response, usedModel } = await generateWithFallback(client, {
      contents: parts,
      config: {
        systemInstruction: `Eres el Asistente Operativo Interno de "MI SEGUNDO CEREBRO 4.0".
ALCANCE ESTRICTO:
- ÚNICAMENTE puedes ejecutar acciones y responder sobre los módulos internos de la aplicación (Mi Día, Tareas, Recordatorios & Segundo Cerebro, Finanzas, Súper Mañana, Súper Noche, Entrenador Físico, Multi-Negocio, Dirección & Estrategia).
- Si el usuario pide algo fuera del sistema (ej. programar código genérico, noticias externas o temas sin relación), recuérdale amablemente que estás limitado exclusivamente a operar su Segundo Cerebro 4.0.
- Cuando el usuario adjunte una imagen o PDF de transferencia/factura/comprobante, extrae el monto exacto, fecha y destinatario/concepto y llama a 'register_payment'.
- Cuando pida recordar algo, llama a 'create_reminder'. Cuando pida agendar tarea o reunión, llama a 'create_task'. Cuando diga que ya terminó una tarea, llama a 'complete_task'.
- Responde en español, directo y claro.`,
        tools: [{ functionDeclarations: systemAssistantDeclarations }],
      },
    });

    const functionCalls = response.functionCalls || [];
    const actions = functionCalls.map((fc) => ({
      name: fc.name || '',
      args: (fc.args as Record<string, any>) || {},
    }));

    let reply = response.text || '';
    if (!reply && actions.length > 0) {
      const summary = actions
        .map((a) => {
          if (a.name === 'register_payment') return `Movimiento financiero registrado ($${a.args.amount} · ${a.args.description})`;
          if (a.name === 'create_reminder') return `Recordatorio creado: "${a.args.title}"`;
          if (a.name === 'create_task') return `Tarea agendada: "${a.args.title}"`;
          if (a.name === 'complete_task') return `Tarea completada: "${a.args.taskQuery}"`;
          if (a.name === 'navigate_module') return `Abriendo módulo: ${a.args.viewId}`;
          return a.name;
        })
        .join(' · ');
      reply = `Listo. Acción ejecutada en tu sistema: ${summary}.`;
    }

    return res.json({
      reply: reply || 'Listo, solicitud procesada en el sistema.',
      transcript: effectivePrompt,
      actions,
      model: usedModel,
    });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/assistant', error);
  }
});

// VPS Webhook Bridge Endpoint for WhatsApp (Evolution API / Meta), Telegram Bot & Email (n8n/SMTP)
app.post('/api/integrations/webhook', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { channel = 'whatsapp', sender = '', text = '', attachmentBase64, attachmentMimeType } = req.body || {};
    if (!text && !attachmentBase64) {
      return res.status(400).json({ error: 'Payload vacío: se requiere text o attachmentBase64.' });
    }

    const parts: any[] = [];
    if (attachmentBase64 && attachmentMimeType) {
      parts.push({ inlineData: { mimeType: attachmentMimeType, data: attachmentBase64 } });
    }
    parts.push({ text: `Mensaje entrante vía ${channel} de ${sender || 'usuario'}:\n${text}` });

    const { response, usedModel } = await generateWithFallback(client, {
      contents: parts,
      config: {
        systemInstruction: 'Convierte este mensaje externo de WhatsApp/Telegram/Correo en una acción interna exacta para Segundo Cerebro 4.0.',
        tools: [{ functionDeclarations: systemAssistantDeclarations }],
      },
    });

    return res.json({
      status: 'processed',
      channel,
      sender,
      model: usedModel,
      actions: (response.functionCalls || []).map((fc) => ({ name: fc.name, args: fc.args })),
      reply: response.text || 'Mensaje procesado en Segundo Cerebro 4.0.',
    });
  } catch (error: any) {
    return sendGeminiError(res, '/api/integrations/webhook', error);
  }
});

// Emotion logs store (in-memory session mirror for /api/emotions)
const emotionLogsStore: Array<{
  id: string;
  timestamp: string;
  valence_score: number;
  display_label: string;
  emotion_labels: string[];
  associations: string[];
}> = [];

app.post('/api/emotions', (req: Request, res: Response) => {
  try {
    const { timestamp, valence_score, display_label, emotion_labels, associations } = req.body || {};
    if (typeof valence_score !== 'number' || !display_label) {
      return res.status(400).json({ error: 'valence_score (number) y display_label son obligatorios.' });
    }
    const clampedValence = Math.max(-1, Math.min(1, Number(valence_score)));
    const entry = {
      id: `emo_${Date.now()}`,
      timestamp: timestamp || new Date().toISOString(),
      valence_score: Number(clampedValence.toFixed(2)),
      display_label: String(display_label),
      emotion_labels: Array.isArray(emotion_labels) ? emotion_labels.map(String) : [],
      associations: Array.isArray(associations) ? associations.map(String) : [],
    };
    emotionLogsStore.unshift(entry);
    return res.status(201).json({ status: 'saved', entry });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error guardando emoción' });
  }
});

app.get('/api/emotions', (_req: Request, res: Response) => {
  return res.json({ entries: emotionLogsStore });
});

// AI Handwriting Recognition (Apple Pencil / Ink Canvas -> Clean Spanish text & checklists)
app.post('/api/gemini/handwriting-ocr', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { imageBase64, mimeType = 'image/png' } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Se requiere imageBase64 para reconocer la escritura.' });
    }

    const cleanMime = String(mimeType).split(';')[0].trim().toLowerCase();
    const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    const safeMime = allowedMimes.has(cleanMime) ? cleanMime : 'image/png';

    const { response, usedModel } = await generateWithFallback(client, {
      contents: {
        parts: [
          { inlineData: { mimeType: safeMime, data: imageBase64 } },
          {
            text: 'Transcribe con precisión el texto escrito a mano en esta nota (Apple Pencil / iPad) en español claro. Si ves casillas o listas de tareas usa formato "- [ ] tarea". Conserva fechas (ej. 15/01/2027) y montos (ej. gasto de $120 o ingreso de $500) exactamente como estén escritos. Devuelve únicamente el texto transcrito sin comentarios adicionales.',
          },
        ],
      },
      config: { temperature: 0.1 },
    });

    const text = (response.text || '').trim();
    return res.json({ text, model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/handwriting-ocr', error);
  }
});

// AI Voice Dictation Fallback (Audio -> Clean Spanish text for Notes on any device/browser)
app.post('/api/gemini/dictate-audio', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { audioBase64, mimeType = 'audio/webm' } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Se requiere audioBase64 para transcribir el dictado.' });
    }

    const cleanMime = String(mimeType).split(';')[0].trim().toLowerCase();
    const safeMime = cleanMime.startsWith('audio/') ? cleanMime : 'audio/webm';

    const { response, usedModel } = await generateWithFallback(client, {
      contents: {
        parts: [
          { inlineData: { mimeType: safeMime, data: audioBase64 } },
          {
            text: 'Transcribe literalmente este dictado de voz en español claro, con buena puntuación y tildes. Conserva fechas (ej. 15/01/2027, próximo lunes) y montos (ej. gasto de $120, ingreso de $500) tal como se dicen. Devuelve únicamente el texto transcrito sin comentarios ni comillas.',
          },
        ],
      },
      config: { temperature: 0.1 },
    });

    const text = (response.text || '').trim();
    return res.json({ text, model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/dictate-audio', error);
  }
});

// AI Topic Note Assistant (Generates a rich editable Notability note on any user-specified topic)
app.post('/api/gemini/note-topic-assistant', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const {
      topic = '',
      instructions = '',
      scopeTags = ['personal'],
      linkedLabel = '',
      style = 'estructurada',
    } = req.body || {};

    const cleanTopic = String(topic).trim();
    if (!cleanTopic) {
      return res.status(400).json({ error: 'Indica el tema sobre el cual deseas crear la nota.' });
    }

    const scopeStr = Array.isArray(scopeTags) && scopeTags.length > 0
      ? scopeTags.map((t: string) => (t === 'business' ? 'Empresarial' : 'Personal')).join(' + ')
      : 'Personal';

    const styleHints: Record<string, string> = {
      estructurada: 'Guía ejecutiva estructurada con secciones claras, puntos clave en negrita y checklist accionable.',
      plan_accion: 'Plan de acción paso a paso con hitos, fechas sugeridas y checklist "- [ ]" ejecutable.',
      estudio: 'Apuntes profundos de estudio/resumen con conceptos clave, preguntas de reflexión y aplicación práctica.',
      reunion: 'Plantilla de agenda y bitácora lista para tomar acuerdos, contexto, resolución y compromisos.',
    };

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Tema específico: "${cleanTopic}"\nÁmbito: ${scopeStr}\nEstilo solicitado: ${styleHints[style] || styleHints.estructurada}${linkedLabel ? `\nVinculada a: ${linkedLabel}` : ''}${instructions ? `\nIndicaciones adicionales del usuario: ${String(instructions).trim()}` : ''}`,
      config: {
        systemInstruction:
          'Eres el Arquitecto de Notas Inteligentes de "MI SEGUNDO CEREBRO 4.0". Crea una nota profesional, práctica y directamente editable en español sobre el tema solicitado. Usa formato Markdown limpio compatible con el editor en vivo: "# Título" para el encabezado principal, "## Subtítulo" para bloques, "- [ ] ..." para tareas/checklists interactivos, "- ..." para viñetas y "**texto**" para énfasis. Si el tema involucra plazos o presupuestos, incluye ejemplos realistas de fechas (ej. DD/MM/YYYY) o montos ($...) para que el usuario pueda agendarlos o registrarlos con un clic. Evita bloques de código o tablas complejas.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título claro y conciso de la nota' },
            content: { type: Type.STRING, description: 'Contenido completo en Markdown enriquecido listo para editar' },
            suggestedCategory: {
              type: Type.STRING,
              description: 'Una de: general, ideas, finanzas, personal, bitacora',
            },
          },
          required: ['title', 'content', 'suggestedCategory'],
        },
      },
    });

    const parsed = parseJsonSafe<{
      title?: string;
      content?: string;
      suggestedCategory?: string;
    }>(response.text);

    const allowedCategories = new Set(['general', 'ideas', 'finanzas', 'personal', 'bitacora']);
    const rawCat = String(parsed.suggestedCategory || 'general').toLowerCase();
    const suggestedCategory = allowedCategories.has(rawCat) ? rawCat : 'general';

    return res.json({
      title: String(parsed.title || cleanTopic).trim(),
      content: String(parsed.content || `# ${cleanTopic}\n\n- [ ] Primer paso...`).trim(),
      suggestedCategory,
      model: usedModel,
    });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/note-topic-assistant', error);
  }
});

// AI Note / Bitácora Summarizer (Analyzes a selected note and returns executive summary, key points, decisions, and action items)
app.post('/api/gemini/note-summary', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const {
      title = '',
      content = '',
      tags = [],
      linkedContext = '',
      focusPrompt = '',
    } = req.body || {};

    const cleanTitle = String(title || '').trim();
    const cleanContent = String(content || '').trim();
    if (!cleanContent && !cleanTitle) {
      return res.status(400).json({ error: 'La nota seleccionada no tiene contenido suficiente para resumir.' });
    }

    const tagsLabel = Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'General';
    const userPrompt = [
      `Título de la nota: "${cleanTitle || 'Sin título'}"`,
      `Etiquetas / Áreas: ${tagsLabel}`,
      linkedContext ? `Vinculaciones: ${String(linkedContext).trim()}` : '',
      focusPrompt ? `Enfoque solicitado por el usuario: ${String(focusPrompt).trim()}` : '',
      '',
      'Contenido completo de la nota:',
      cleanContent.slice(0, 24000),
    ]
      .filter(Boolean)
      .join('\n');

    const { response, usedModel } = await generateWithFallback(client, {
      contents: userPrompt,
      config: {
        systemInstruction:
          'Eres el Analista Ejecutivo de Bitácoras de "MI SEGUNDO CEREBRO 4.0". Analiza la nota proporcionada en español y extrae un resumen claro, estructurado y accionable de tipo bitácora directiva/personal. No inventes datos que no estén sugeridos por la nota; sintetiza con precisión el resumen ejecutivo, el contexto o propósito, la resolución o conclusión principal, los puntos más importantes, las acciones concretas/pendientes y el impacto esperado.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Resumen ejecutivo de la bitácora en 2 a 4 oraciones claras y directas.',
            },
            context: {
              type: Type.STRING,
              description: 'Contexto, motivo o tema central que aborda la nota.',
            },
            resolution: {
              type: Type.STRING,
              description: 'Resolución, decisión adoptada o conclusión principal.',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 3 a 7 puntos más importantes de la nota.',
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de próximos pasos, tareas o compromisos accionables detectados o sugeridos.',
            },
            expectedImpact: {
              type: Type.STRING,
              description: 'Impacto esperado, aprendizaje clave o resultado objetivo.',
            },
          },
          required: ['executiveSummary', 'context', 'resolution', 'keyPoints', 'actionItems', 'expectedImpact'],
        },
      },
    });

    const parsed = parseJsonSafe<{
      executiveSummary?: string;
      context?: string;
      resolution?: string;
      keyPoints?: string[];
      actionItems?: string[];
      expectedImpact?: string;
    }>(response.text);

    return res.json({
      executiveSummary: String(parsed.executiveSummary || '').trim(),
      context: String(parsed.context || '').trim(),
      resolution: String(parsed.resolution || '').trim(),
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.map((x) => String(x).trim()).filter(Boolean)
        : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map((x) => String(x).trim()).filter(Boolean)
        : [],
      expectedImpact: String(parsed.expectedImpact || '').trim(),
      model: usedModel,
    });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/note-summary', error);
  }
});

// AI Daily Habit Quote / Meditation Message Endpoint
app.post('/api/gemini/habit-quote', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { habitTitle, topic = 'motivacion', description = '' } = req.body || {};

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Hábito matutino: "${habitTitle || 'Activación Matutina'}"\nTema / Descripción: "${description || topic}"\nSemilla diaria: ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).slice(2, 6)}`,
      config: {
        systemInstruction:
          'Eres el Mentor Matutino de "MI SEGUNDO CEREBRO 4.0". Genera UNA sola frase o micro-mensaje diario poderoso, original y accionable en español (máximo 28 palabras) adaptado al hábito indicado (si es meditación/calma, tono contemplativo y lúcido; si es motivación/enfoque, tono firme estilo Isra García y estoicismo). Sin comillas innecesarias ni introducciones.',
      },
    });

    return res.json({ quote: (response.text || '').trim().replace(/^["']|["']$/g, ''), model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/habit-quote', error);
  }
});

// Spiritual Guide Endpoint (Catholic Lectio Divina & Isra García / Contemplative)
app.post('/api/gemini/spiritual-guide', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { tradition = 'catolica', theme = 'fortaleza' } = req.body || {};

    const systemInstruction =
      tradition === 'catolica'
        ? 'Eres un acompañante espiritual católico sereno y profundo. Devuelve un JSON con: { "reference": "Cita bíblica exacta (Biblia Católica)", "verse": "Texto breve fiel del versículo", "reflection": "Reflexión práctica aplicada a la vida diaria y liderazgo", "prayer": "Oración breve y sincera de 2 líneas" }.'
        : 'Eres un guía espiritual no confesional inspirado en la quietud contemplativa y prácticas de presencia de Isra García. Devuelve un JSON con: { "reference": "Nombre de la práctica o principio", "verse": "Frase o principio de quietud", "reflection": "Reflexión práctica para conectar con propósito y gratitud", "prayer": "Intención o afirmación serena de 2 líneas" }.';

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Tema o necesidad espiritual actual: ${theme}. Fecha: ${new Date().toISOString().split('T')[0]}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return res.json({ guide: parseJsonSafe(response.text), model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/spiritual-guide', error);
  }
});

// AI OKR & KPI Advisor for Multi-Business Projects
app.post('/api/gemini/suggest-okrs', async (req: Request, res: Response) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;

    const { businessName, sector, revenueTarget, actualRevenue, currentProjects = [] } = req.body || {};

    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Empresa: ${businessName}\nSector: ${sector}\nMeta ingresos mensuales: $${revenueTarget || 0}\nIngresos actuales: $${actualRevenue || 0}\nProyectos activos: ${JSON.stringify(currentProjects)}`,
      config: {
        systemInstruction:
          'Eres un Director de Estrategia y OKRs de alto rendimiento. Recomienda 2 o 3 OKRs (Objetivos y Resultados Clave medibles) exactos para esta empresa y sector, explicando qué KPI medir. Devuelve JSON con array "suggestions": [{ "title": "Objetivo claro y medible", "horizon": "quarterly"|"annual", "pillar": "financiero"|"intelectual"|"fisico", "kpiMetric": "KPI principal a medir", "milestones": ["Hito medible 1", "Hito medible 2", "Hito medible 3"] }].',
        responseMimeType: 'application/json',
      },
    });

    const parsed = parseJsonSafe<{ suggestions?: any[] }>(response.text);
    return res.json({ suggestions: parsed.suggestions || [], model: usedModel });
  } catch (error: any) {
    return sendGeminiError(res, '/api/gemini/suggest-okrs', error);
  }
});

// Optional server-side disk backup endpoint (active only when ENABLE_DISK_STORAGE=true or DATA_DIR is set)
app.get('/api/storage/status', (_req: Request, res: Response) => {
  res.json({
    diskPersistenceEnabled: STORAGE_PATHS.enabled,
    dataDir: STORAGE_PATHS.enabled ? STORAGE_PATHS.dataDir : null,
    backupDir: STORAGE_PATHS.enabled ? STORAGE_PATHS.backupDir : null,
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Mi Segundo Cerebro 4.0 API',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: PORT,
    aiConfigured: Boolean(getApiKey()),
    model: TEXT_MODEL,
    fallbackModels: FALLBACK_MODELS,
    timeoutMs: GEMINI_TIMEOUT_MS,
    diskPersistenceEnabled: STORAGE_PATHS.enabled,
    timestamp: new Date().toISOString(),
  });
});

// Always return JSON 404 for unknown /api/* routes (never fall through to SPA index.html)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `Ruta API no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const disableHmr = process.env.DISABLE_HMR === 'true';

    // Initialize Vite concurrently so port 3000 binds immediately without timing out cold starts
    const viteReadyPromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: disableHmr ? false : { server: httpServer },
          ws: disableHmr ? false : undefined,
        },
        appType: 'spa',
      })
    );

    viteReadyPromise.catch((err) => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use((req, res, next) => {
      viteReadyPromise
        .then((vite) => vite.middlewares(req, res, next))
        .catch((err) => next(err));
    });
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      if (!IS_PROD && PORT !== 3000) {
        console.warn(`Port ${PORT} in use, falling back to port 3000`);
        httpServer.listen(3000, HOST, () => {
          console.log(`Mi Segundo Cerebro 4.0 running on http://${HOST}:3000`);
        });
      } else {
        console.error(
          `El puerto ${PORT} ya está en uso (EADDRINUSE). Cambia la variable PORT en tu entorno o detén el proceso anterior.`
        );
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(
      [
        `[Mi Segundo Cerebro 4.0] Servidor activo en http://${HOST}:${PORT} (${IS_PROD ? 'production' : 'development'})`,
        `  · GEMINI_API_KEY: ${getApiKey() ? 'CONFIGURADA' : 'NO CONFIGURADA (IA responderá HTTP 503)'}`,
        `  · Cadena de modelos IA: ${MODEL_CHAIN.join(' -> ')} (timeout: ${GEMINI_TIMEOUT_MS}ms)`,
        `  · Persistencia en disco: ${STORAGE_PATHS.enabled ? `${STORAGE_PATHS.dataDir} (respaldos: ${STORAGE_PATHS.backupDir})` : 'Desactivada (solo navegador)'}`,
      ].join('\n')
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
