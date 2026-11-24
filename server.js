// server.ts
import express from "express";
import http from "http";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env") });
var app = express();
var IS_PROD = process.env.NODE_ENV === "production";
var rawPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var PORT = !IS_PROD && rawPort === 8080 ? 3e3 : Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3e3;
app.use(express.json({ limit: "25mb" }));
var TEXT_MODEL = (process.env.GEMINI_MODEL || "gemini-4-hydrogen").trim();
var FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.1-flash-lite").split(",").map((m) => m.trim()).filter((m) => m && m !== TEXT_MODEL);
var MODEL_CHAIN = Array.from(/* @__PURE__ */ new Set([TEXT_MODEL, ...FALLBACK_MODELS]));
var TRANSCRIBE_MODEL = (process.env.GEMINI_TRANSCRIBE_MODEL || "gemini-3.5-transcribe").trim();
var GEMINI_TIMEOUT_MS = Math.max(
  5e3,
  Math.min(12e4, parseInt(process.env.GEMINI_TIMEOUT_MS || "25000", 10) || 25e3)
);
function resolvePersistentPaths() {
  const explicitlyEnabled = process.env.ENABLE_DISK_STORAGE === "true" || Boolean((process.env.DATA_DIR || "").trim());
  if (!explicitlyEnabled) {
    return { enabled: false, dataDir: "", backupDir: "" };
  }
  let baseRoot;
  if ((process.env.DATA_DIR || "").trim()) {
    baseRoot = path.resolve(process.env.DATA_DIR.trim());
    return {
      enabled: true,
      dataDir: baseRoot,
      backupDir: path.join(path.dirname(baseRoot), "respaldos")
    };
  }
  const normalizedDir = __dirname.replace(/\\/g, "/");
  const hbuildsIdx = normalizedDir.indexOf("/hbuilds/");
  if (hbuildsIdx > 0) {
    baseRoot = normalizedDir.slice(0, hbuildsIdx);
  } else {
    baseRoot = path.resolve(__dirname, "..");
  }
  return {
    enabled: true,
    dataDir: path.join(baseRoot, "datos"),
    backupDir: path.join(baseRoot, "respaldos")
  };
}
var STORAGE_PATHS = resolvePersistentPaths();
function initPersistentStorageIfEnabled() {
  if (!STORAGE_PATHS.enabled) return;
  try {
    fs.mkdirSync(STORAGE_PATHS.dataDir, { recursive: true });
    fs.mkdirSync(STORAGE_PATHS.backupDir, { recursive: true });
    const stateFile = path.join(STORAGE_PATHS.dataDir, "estado.json");
    if (fs.existsSync(stateFile)) {
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(STORAGE_PATHS.backupDir, `startup-backup-${stamp}.json`);
      fs.copyFileSync(stateFile, backupFile);
    }
  } catch (err) {
    console.warn("No se pudo inicializar almacenamiento persistente en disco:", err);
  }
}
initPersistentStorageIfEnabled();
function getApiKey() {
  const raw = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!raw || raw === "MY_GEMINI_API_KEY") return "";
  return raw;
}
var cachedKey = "";
var cachedClient = null;
function getAiClient() {
  const key = getApiKey();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedKey = key;
    cachedClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return cachedClient;
}
function parseJsonSafe(rawText) {
  const cleaned = (rawText || "{}").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned || "{}");
}
function getThinkingConfigForModel(model) {
  return model.startsWith("gemini-4-") ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {};
}
function isRetryableModelError(error) {
  const status = Number(error?.status || error?.statusCode) || 0;
  const msg = String(error?.message || "");
  return status === 404 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || /TIMEOUT|ETIMEDOUT|ECONNRESET|high demand|UNAVAILABLE|RESOURCE_EXHAUSTED|NOT_FOUND|AbortError/i.test(msg);
}
async function withTimeout(promise, ms, label) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Timeout tras ${Math.round(ms / 1e3)}s esperando respuesta de ${label}.`);
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
async function generateWithFallback(client, request) {
  let lastError = null;
  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];
    try {
      const mergedConfig = {
        ...request.config || {},
        ...getThinkingConfigForModel(model)
      };
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: request.contents,
          config: mergedConfig
        }),
        GEMINI_TIMEOUT_MS,
        model
      );
      return { response, usedModel: model };
    } catch (err) {
      lastError = err;
      const hasNext = i < MODEL_CHAIN.length - 1;
      if (hasNext && isRetryableModelError(err)) {
        console.warn(`[Gemini] Modelo ${model} fall\xF3 (${err?.status || err?.message}). Intentando respaldo: ${MODEL_CHAIN[i + 1]}`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("No se pudo obtener respuesta de ning\xFAn modelo de Gemini.");
}
function sendGeminiError(res, routeName, error) {
  console.error(`Error in ${routeName}:`, error);
  const status = Number(error?.status || error?.statusCode) || 500;
  const rawMsg = String(error?.message || "Error procesando solicitud con Gemini IA");
  let friendly = rawMsg;
  if (status === 504 || /Timeout/i.test(rawMsg)) {
    friendly = `El proveedor de IA tard\xF3 demasiado en responder (${Math.round(GEMINI_TIMEOUT_MS / 1e3)}s). Intenta de nuevo en unos segundos o configura un modelo m\xE1s r\xE1pido en GEMINI_MODEL.`;
  } else if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(rawMsg)) {
    friendly = "La clave GEMINI_API_KEY configurada en el servidor no es v\xE1lida. Verifica la clave en las variables de entorno del servidor.";
  } else if (status === 403 || /PERMISSION_DENIED/i.test(rawMsg)) {
    friendly = "Permiso denegado por la API de Gemini (403). Verifica que tu clave GEMINI_API_KEY tenga permisos activos.";
  } else if (status === 404 || /NOT_FOUND/i.test(rawMsg)) {
    friendly = `Modelo de Gemini no disponible (${MODEL_CHAIN.join(", ")}). Ajusta GEMINI_MODEL / GEMINI_FALLBACK_MODELS en tu archivo .env.`;
  } else if (status === 429 || /RESOURCE_EXHAUSTED/i.test(rawMsg)) {
    friendly = "L\xEDmite de cuota de la API de Gemini alcanzado (429). Espera unos segundos o verifica la facturaci\xF3n de tu clave API.";
  } else if (status === 503 || /UNAVAILABLE|high demand/i.test(rawMsg)) {
    friendly = "El modelo de Gemini est\xE1 temporalmente saturado (503). Intenta nuevamente en unos segundos.";
  }
  return res.status(status >= 400 && status < 600 ? status : 500).json({ error: friendly, details: rawMsg });
}
function requireAiClient(res) {
  const client = getAiClient();
  if (!client) {
    res.status(503).json({
      error: "GEMINI_API_KEY no est\xE1 configurada en el servidor Node.js. Configura la variable de entorno GEMINI_API_KEY y reinicia el servidor."
    });
    return null;
  }
  return client;
}
async function transcribeAudioBase64(client, base64Data, mimeType) {
  const transcribeChain = Array.from(/* @__PURE__ */ new Set([TRANSCRIBE_MODEL, ...MODEL_CHAIN]));
  let lastError = null;
  for (let i = 0; i < transcribeChain.length; i++) {
    const model = transcribeChain[i];
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: base64Data
              }
            },
            {
              text: "Transcribe con m\xE1xima fidelidad en espa\xF1ol todo lo que se dice en este audio. Devuelve \xFAnicamente la transcripci\xF3n limpia."
            }
          ]
        }),
        Math.max(GEMINI_TIMEOUT_MS, 35e3),
        model
      );
      return response.text || "";
    } catch (err) {
      lastError = err;
      if (i < transcribeChain.length - 1 && isRetryableModelError(err)) {
        console.warn(`[Gemini Audio] ${model} fall\xF3, probando ${transcribeChain[i + 1]}`);
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("No se pudo transcribir el audio.");
}
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { prompt, context, pillarData, tone = "directo" } = req.body || {};
    const systemInstruction = `Eres el Asistente Estrat\xE9gico Ejecutivo de "MI SEGUNDO CEREBRO 4.0".
Tu prop\xF3sito es asesorar al usuario en su crecimiento integral: ESPIRITUAL + EMOCIONAL + F\xCDSICO + INTELECTUAL + FINANCIERO = MEJOR VERSI\xD3N.
Integra de manera arm\xF3nica y original tres filosof\xEDas:
1. Isra Garc\xEDa: Alto rendimiento, disciplina inquebrantable, experimentos vitales, autoconocimiento pragm\xE1tico.
2. J\xFCrgen Klaric: Persuasi\xF3n \xE9tica, visi\xF3n comercial estrat\xE9gica, entendimiento de la psicolog\xEDa humana y escalamiento empresarial.
3. Diego Dreyfus: Introspecci\xF3n cruda, responsabilidad individual total, cuestionamiento constructivo, erradicar excusas y vivir con autenticidad.

REGLAS CR\xCDTICAS:
- NUNCA te limites a halagar o felicitar pasivamente. Cuestiona con firmeza y elegancia constructiva.
- Si el usuario tiene demasiadas tareas pendientes, ay\xFAdalo a filtrar las 3 verdaderamente cr\xEDticas (regla 80/20).
- Si detectas que descuida su salud o descanso por trabajar en exceso, se\xF1\xE1lale la alerta de balance.
- Tono solicitado: ${tone}.
- Responde en espa\xF1ol, de forma concisa, con vi\xF1etas claras y accionables.`;
    const mergedContext = context || (pillarData ? { pillarData } : {});
    const userMessage = `Contexto del usuario actual:
${JSON.stringify(mergedContext, null, 2)}

Pregunta / Situaci\xF3n:
${prompt || "Analiza mi estado actual."}`;
    const { response, usedModel } = await generateWithFallback(client, {
      contents: userMessage,
      config: { systemInstruction }
    });
    return res.json({ response: response.text || "Sin respuesta generada.", model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/advisor", error);
  }
});
app.post("/api/gemini/motivation", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { moment = "activacion", pillarSummary, tone = "directo" } = req.body || {};
    const systemInstruction = `Eres el Mentor de Mentalidad & Motivaci\xF3n de "MI SEGUNDO CEREBRO 4.0".
Genera un mensaje de mentalidad conciso, impactante y con criterio para el momento: "${String(moment).toUpperCase()}".
Momentos:
- ACTIVACION: Al iniciar el d\xEDa. En\xE9rgico, enfocado en intenci\xF3n, 3 prioridades y congruencia personal.
- ENFOQUE: A mitad de jornada. Reenfoque estrat\xE9gico, eliminaci\xF3n de ruido, ejecuci\xF3n implacable.
- REFLEXION: Al cerrar la noche. Rendici\xF3n de cuentas, autoevaluaci\xF3n honesta, gratitud y descanso regenerador.
Tono seleccionado: ${tone}.
No uses clich\xE9s vac\xEDos de autoayuda. Haz que cada palabra inspire responsabilidad y acci\xF3n inmediata.`;
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Resumen de estado del usuario:
${JSON.stringify(pillarSummary || {}, null, 2)}`,
      config: { systemInstruction }
    });
    return res.json({ message: response.text || "Enf\xF3cate en tus 3 prioridades cr\xEDticas hoy.", model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/motivation", error);
  }
});
app.post("/api/gemini/wisdom", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { bookTitle, author, chapter, excerpt, pageRef } = req.body || {};
    const systemInstruction = `Eres el Analista Intelectual de "MI SEGUNDO CEREBRO 4.0".
A partir del texto o referencia de libro aportado por el usuario, extrae y sintetiza una C\xE1psula Diaria de Sabidur\xEDa en formato JSON estructurado:
{
  "bookTitle": "string",
  "author": "string",
  "chapter": "string",
  "coreIdea": "string",
  "quote": "cita textual breve con fidelidad",
  "pageRef": "P\xE1g. X o Ref",
  "aiInterpretation": "an\xE1lisis profundo del concepto",
  "personalApplication": "c\xF3mo aplicarlo al crecimiento personal y 5 pilares",
  "businessApplication": "c\xF3mo aplicarlo al ecosistema empresarial y toma de decisiones",
  "practicalAction": "acci\xF3n concreta de hoy (menos de 20 palabras)"
}
Respeta los derechos de autor: no reproduzcas cap\xEDtulos completos, \xFAnicamente extractos breves de an\xE1lisis.`;
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Libro: ${bookTitle || "Sin t\xEDtulo"}, Autor: ${author || "Desconocido"}, Cap\xEDtulo/P\xE1gina: ${chapter || pageRef || "General"}
Contenido / Extracto:
${excerpt || "Resumen y principios fundamentales"}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    const parsed = parseJsonSafe(response.text);
    if (pageRef && !parsed.pageRef) parsed.pageRef = pageRef;
    return res.json({ capsule: parsed, model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/wisdom", error);
  }
});
app.post("/api/gemini/meeting-minutes", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { audioBase64, mimeType, rawNotes, businessName, scopeContext } = req.body || {};
    let transcript = (rawNotes || "").trim();
    if (audioBase64) {
      const transcribed = await transcribeAudioBase64(client, audioBase64, mimeType || "audio/webm");
      transcript = transcript ? `${transcribed}

Notas adicionales:
${transcript}` : transcribed;
    }
    if (!transcript) {
      return res.status(400).json({ error: "Se requiere un archivo de audio o notas de reuni\xF3n." });
    }
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `\xC1mbito: ${scopeContext || "Empresarial"}
Contexto / Empresa: ${businessName || "General"}

Transcripci\xF3n / Notas:
${transcript}`,
      config: {
        systemInstruction: 'Eres el Secretario Ejecutivo y Mentor Estrat\xE9gico de "MI SEGUNDO CEREBRO 4.0". Analiza la transcripci\xF3n o notas (puede ser una reuni\xF3n empresarial o una mentor\xEDa/reflexi\xF3n personal o exportaci\xF3n de NotebookLM) y extrae un acta estructurada, precisa y accionable en espa\xF1ol.',
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "T\xEDtulo breve de la reuni\xF3n, mentor\xEDa o decisi\xF3n" },
            context: { type: Type.STRING, description: "Contexto, problema o tema central tratado" },
            decision: { type: Type.STRING, description: "Resoluci\xF3n, aprendizaje pr\xE1ctico o acuerdo principal" },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 a 6 puntos importantes, compromisos o hallazgos clave"
            },
            expectedOutcome: { type: Type.STRING, description: "Impacto o transformaci\xF3n esperada tras aplicar el acta" }
          },
          required: ["title", "context", "decision", "keyPoints", "expectedOutcome"]
        }
      }
    });
    const parsed = parseJsonSafe(response.text);
    return res.json({
      transcript,
      minutes: parsed,
      model: usedModel
    });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/meeting-minutes", error);
  }
});
app.post("/api/gemini/experiment-coach", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { experiment, linkedNotes = [], question } = req.body || {};
    if (!experiment) {
      return res.status(400).json({ error: "Faltan datos del experimento." });
    }
    const logs = Array.isArray(experiment.logs) ? experiment.logs : [];
    const systemInstruction = `Eres el Mentor de Experimentos Personales de "MI SEGUNDO CEREBRO 4.0", combinando la filosof\xEDa pragm\xE1tica de incomodidad y alto rendimiento de Isra Garc\xEDa con la introspecci\xF3n cruda y coherencia radical de Diego Dreyfus.
TU MISI\xD3N:
1. Comparar la evoluci\xF3n cronol\xF3gica real entre los primeros registros (l\xEDnea base) y los \xFAltimos registros del experimento (variables num\xE9ricas, checklists y notas mentales/alimentarias).
2. Se\xF1alar con total honestidad d\xF3nde hay progreso real y d\xF3nde hay estancamiento o autoenga\xF1o.
3. Si hay notas de mentor\xEDas vinculadas, conectarlas directamente con el experimento.
4. Entregar 3 ajustes t\xE1cticos concretos para los pr\xF3ximos d\xEDas.
Responde en espa\xF1ol, directo, sin clich\xE9s suaves, con vi\xF1etas claras.`;
    const promptPayload = `Experimento: ${experiment.title}
Inspiraci\xF3n: ${experiment.inspiration}
Hip\xF3tesis: ${experiment.hypothesis}
Prop\xF3sito: ${experiment.purpose}
Duraci\xF3n objetivo: ${experiment.durationDays} d\xEDas
Campos definidos: ${JSON.stringify(experiment.fields)}
Registros cronol\xF3gicos (${logs.length}): ${JSON.stringify(logs)}
Notas/Mentor\xEDas vinculadas: ${JSON.stringify(linkedNotes)}
Pregunta espec\xEDfica del usuario: ${question || "Compara mis registros desde el d\xEDa 1 hasta hoy y dime qu\xE9 debo ajustar para elevar mis resultados."}`;
    const { response, usedModel } = await generateWithFallback(client, {
      contents: promptPayload,
      config: { systemInstruction }
    });
    return res.json({ feedback: response.text || "Sin retroalimentaci\xF3n generada.", model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/experiment-coach", error);
  }
});
app.post("/api/gemini/experiment-from-template", async (req, res) => {
  try {
    const { templateText = "", customTitle = "" } = req.body || {};
    const raw = String(templateText).trim();
    if (!raw) {
      return res.status(400).json({ error: "Se requiere el texto de la plantilla o lista de pasos." });
    }
    const client = requireAiClient(res);
    if (!client) return;
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `${customTitle ? `T\xEDtulo sugerido por usuario: ${customTitle}
` : ""}Plantilla / Lista de pasos enviada por el usuario:
"""
${raw}
"""`,
      config: {
        systemInstruction: `Eres el Arquitecto de Experimentos Personales de "MI SEGUNDO CEREBRO 4.0".
El usuario te entrega una plantilla, rutina, checklist o lista de pasos que desea experimentar.
Debes transformarla en un experimento personal completo, pr\xE1ctico y medible en espa\xF1ol.
Reglas:
- "pillar" debe ser exactamente uno de: "espiritual" | "emocional" | "fisico" | "intelectual" | "financiero".
- "inspirationColor" debe ser exactamente uno de: "fuchsia" | "indigo" | "emerald" | "amber" | "rose" | "cyan".
- "durationDays" entre 7 y 90 seg\xFAn el texto (21 por defecto).
- "dailySubtasks": extrae entre 3 y 8 pasos concretos y accionables del texto del usuario (limpios, concisos).
- "fields": genera entre 3 y 6 campos de medici\xF3n diarios. Usa tipos exactos: "percent_10", "timer_minutes", "number", "checkbox", "text". Incluye al menos un "percent_10", un campo cuantitativo o checkbox acorde a los pasos, y un campo "text" para reflexi\xF3n/observaci\xF3n.`,
        responseMimeType: "application/json",
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
              items: { type: Type.STRING }
            },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  type: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  placeholder: { type: Type.STRING }
                },
                required: ["label", "type"]
              }
            }
          },
          required: [
            "title",
            "inspiration",
            "inspirationColor",
            "pillar",
            "goalDescription",
            "hypothesis",
            "purpose",
            "durationDays",
            "dailySubtasks",
            "fields"
          ]
        }
      }
    });
    const parsed = parseJsonSafe(response.text);
    const validPillars = ["espiritual", "emocional", "fisico", "intelectual", "financiero"];
    const validColors = ["fuchsia", "indigo", "emerald", "amber", "rose", "cyan"];
    const validTypes = ["text", "number", "checkbox", "percent_10", "timer_minutes"];
    const normalized = {
      title: String(parsed.title || customTitle || "Experimento Personalizado").trim(),
      inspiration: String(parsed.inspiration || "Coach IA").trim(),
      inspirationColor: validColors.includes(parsed.inspirationColor) ? parsed.inspirationColor : "fuchsia",
      pillar: validPillars.includes(parsed.pillar) ? parsed.pillar : "fisico",
      goalDescription: String(parsed.goalDescription || "").trim(),
      hypothesis: String(parsed.hypothesis || "").trim(),
      purpose: String(parsed.purpose || "").trim(),
      durationDays: Math.max(3, Math.min(365, Number(parsed.durationDays) || 21)),
      dailySubtasks: Array.isArray(parsed.dailySubtasks) ? parsed.dailySubtasks.map((s) => String(s).trim()).filter(Boolean) : [],
      fields: Array.isArray(parsed.fields) ? parsed.fields.map((f, idx) => {
        const t = validTypes.includes(f.type) ? f.type : "text";
        return {
          id: `fld_${Date.now()}_${idx}`,
          label: String(f.label || `Campo ${idx + 1}`).trim(),
          type: t,
          unit: t === "percent_10" ? "%" : t === "timer_minutes" ? "min" : f.unit ? String(f.unit) : void 0,
          placeholder: t === "text" ? String(f.placeholder || "Observaci\xF3n del d\xEDa...") : void 0
        };
      }) : []
    };
    if (normalized.fields.length === 0) {
      normalized.fields = [
        { id: `fld_${Date.now()}_0`, label: "Avance del Protocolo (%)", type: "percent_10", unit: "%", placeholder: void 0 },
        { id: `fld_${Date.now()}_1`, label: "Tiempo Dedicado", type: "timer_minutes", unit: "min", placeholder: void 0 },
        { id: `fld_${Date.now()}_2`, label: "Observaci\xF3n mental del d\xEDa", type: "text", unit: void 0, placeholder: "\xBFQu\xE9 funcion\xF3 hoy?" }
      ];
    }
    return res.json({ experimentDraft: normalized, model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/experiment-from-template", error);
  }
});
var systemAssistantDeclarations = [
  {
    name: "create_reminder",
    description: "Crea una nota o recordatorio en la bandeja unificada de Segundo Cerebro & Recordatorios y opcionalmente en Mi D\xEDa.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "T\xEDtulo breve del recordatorio" },
        content: { type: Type.STRING, description: "Detalle o nota del recordatorio" },
        originModule: {
          type: Type.STRING,
          description: "M\xF3dulo de origen: personal | business | super_manana | super_noche | finanzas | fisico | sabiduria | sistema | general"
        },
        reminderDate: { type: Type.STRING, description: "Fecha YYYY-MM-DD" },
        reminderTime: { type: Type.STRING, description: "Hora HH:MM opcional" },
        showInMiDia: { type: Type.BOOLEAN, description: "Si debe aparecer en Mi D\xEDa" }
      },
      required: ["title"]
    }
  },
  {
    name: "create_task",
    description: "Agenda una tarea personal o empresarial en Gesti\xF3n de Tareas.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Nombre claro de la tarea o reuni\xF3n" },
        scope: { type: Type.STRING, description: "personal o business" },
        priority: { type: Type.STRING, description: "urgent_important | important | urgent | normal" },
        dueDate: { type: Type.STRING, description: "Fecha YYYY-MM-DD" },
        estimatedMinutes: { type: Type.NUMBER, description: "Duraci\xF3n estimada en minutos" },
        remindInInbox: { type: Type.BOOLEAN, description: "Si se a\xF1ade tambi\xE9n a la bandeja de recordatorios" }
      },
      required: ["title", "scope"]
    }
  },
  {
    name: "complete_task",
    description: "Marca como completada una tarea existente cuyo t\xEDtulo coincida parcialmente con la solicitud del usuario.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskQuery: { type: Type.STRING, description: "Palabras clave del t\xEDtulo de la tarea a completar" }
      },
      required: ["taskQuery"]
    }
  },
  {
    name: "register_payment",
    description: "Registra un gasto, pago, ingreso o abono a deuda en Finanzas Personales (tambi\xE9n desde comprobantes/transferencias adjuntas).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "expense | income | investment | debt_payment" },
        amount: { type: Type.NUMBER, description: "Monto num\xE9rico en d\xF3lares" },
        category: { type: Type.STRING, description: "Categor\xEDa financiera" },
        description: { type: Type.STRING, description: "Concepto o comercio/destinatario del comprobante" },
        date: { type: Type.STRING, description: "Fecha YYYY-MM-DD" },
        scope: { type: Type.STRING, description: "personal o business" }
      },
      required: ["type", "amount", "description"]
    }
  },
  {
    name: "navigate_module",
    description: "Abre o dirige al usuario a un m\xF3dulo espec\xEDfico del sistema (ej. super_morning, super_night, mi_dia, personal_finances, tasks_general, second_brain, physical_trainer, business, strategy).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        viewId: { type: Type.STRING, description: "ID de vista del sistema" }
      },
      required: ["viewId"]
    }
  }
];
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { message, audioBase64, audioMimeType, fileBase64, fileMimeType, appSnapshot } = req.body || {};
    let effectivePrompt = (message || "").trim();
    if (audioBase64) {
      const transcribed = await transcribeAudioBase64(client, audioBase64, audioMimeType || "audio/webm");
      effectivePrompt = effectivePrompt ? `${effectivePrompt}
[Audio transcrito]: ${transcribed}` : transcribed;
    }
    const parts = [];
    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          mimeType: fileMimeType,
          data: fileBase64
        }
      });
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    parts.push({
      text: `Fecha actual: ${todayStr}
Estado actual resumido del sistema:
${JSON.stringify(appSnapshot || {}, null, 2)}

Solicitud del usuario:
${effectivePrompt || "Analiza el archivo o comprobante adjunto y ejecuta la acci\xF3n correspondiente dentro del sistema."}`
    });
    const { response, usedModel } = await generateWithFallback(client, {
      contents: parts,
      config: {
        systemInstruction: `Eres el Asistente Operativo Interno de "MI SEGUNDO CEREBRO 4.0".
ALCANCE ESTRICTO:
- \xDANICAMENTE puedes ejecutar acciones y responder sobre los m\xF3dulos internos de la aplicaci\xF3n (Mi D\xEDa, Tareas, Recordatorios & Segundo Cerebro, Finanzas, S\xFAper Ma\xF1ana, S\xFAper Noche, Entrenador F\xEDsico, Multi-Negocio, Direcci\xF3n & Estrategia).
- Si el usuario pide algo fuera del sistema (ej. programar c\xF3digo gen\xE9rico, noticias externas o temas sin relaci\xF3n), recu\xE9rdale amablemente que est\xE1s limitado exclusivamente a operar su Segundo Cerebro 4.0.
- Cuando el usuario adjunte una imagen o PDF de transferencia/factura/comprobante, extrae el monto exacto, fecha y destinatario/concepto y llama a 'register_payment'.
- Cuando pida recordar algo, llama a 'create_reminder'. Cuando pida agendar tarea o reuni\xF3n, llama a 'create_task'. Cuando diga que ya termin\xF3 una tarea, llama a 'complete_task'.
- Responde en espa\xF1ol, directo y claro.`,
        tools: [{ functionDeclarations: systemAssistantDeclarations }]
      }
    });
    const functionCalls = response.functionCalls || [];
    const actions = functionCalls.map((fc) => ({
      name: fc.name || "",
      args: fc.args || {}
    }));
    let reply = response.text || "";
    if (!reply && actions.length > 0) {
      const summary = actions.map((a) => {
        if (a.name === "register_payment") return `Movimiento financiero registrado ($${a.args.amount} \xB7 ${a.args.description})`;
        if (a.name === "create_reminder") return `Recordatorio creado: "${a.args.title}"`;
        if (a.name === "create_task") return `Tarea agendada: "${a.args.title}"`;
        if (a.name === "complete_task") return `Tarea completada: "${a.args.taskQuery}"`;
        if (a.name === "navigate_module") return `Abriendo m\xF3dulo: ${a.args.viewId}`;
        return a.name;
      }).join(" \xB7 ");
      reply = `Listo. Acci\xF3n ejecutada en tu sistema: ${summary}.`;
    }
    return res.json({
      reply: reply || "Listo, solicitud procesada en el sistema.",
      transcript: effectivePrompt,
      actions,
      model: usedModel
    });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/assistant", error);
  }
});
app.post("/api/integrations/webhook", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { channel = "whatsapp", sender = "", text = "", attachmentBase64, attachmentMimeType } = req.body || {};
    if (!text && !attachmentBase64) {
      return res.status(400).json({ error: "Payload vac\xEDo: se requiere text o attachmentBase64." });
    }
    const parts = [];
    if (attachmentBase64 && attachmentMimeType) {
      parts.push({ inlineData: { mimeType: attachmentMimeType, data: attachmentBase64 } });
    }
    parts.push({ text: `Mensaje entrante v\xEDa ${channel} de ${sender || "usuario"}:
${text}` });
    const { response, usedModel } = await generateWithFallback(client, {
      contents: parts,
      config: {
        systemInstruction: "Convierte este mensaje externo de WhatsApp/Telegram/Correo en una acci\xF3n interna exacta para Segundo Cerebro 4.0.",
        tools: [{ functionDeclarations: systemAssistantDeclarations }]
      }
    });
    return res.json({
      status: "processed",
      channel,
      sender,
      model: usedModel,
      actions: (response.functionCalls || []).map((fc) => ({ name: fc.name, args: fc.args })),
      reply: response.text || "Mensaje procesado en Segundo Cerebro 4.0."
    });
  } catch (error) {
    return sendGeminiError(res, "/api/integrations/webhook", error);
  }
});
var emotionLogsStore = [];
app.post("/api/emotions", (req, res) => {
  try {
    const { timestamp, valence_score, display_label, emotion_labels, associations } = req.body || {};
    if (typeof valence_score !== "number" || !display_label) {
      return res.status(400).json({ error: "valence_score (number) y display_label son obligatorios." });
    }
    const clampedValence = Math.max(-1, Math.min(1, Number(valence_score)));
    const entry = {
      id: `emo_${Date.now()}`,
      timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      valence_score: Number(clampedValence.toFixed(2)),
      display_label: String(display_label),
      emotion_labels: Array.isArray(emotion_labels) ? emotion_labels.map(String) : [],
      associations: Array.isArray(associations) ? associations.map(String) : []
    };
    emotionLogsStore.unshift(entry);
    return res.status(201).json({ status: "saved", entry });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Error guardando emoci\xF3n" });
  }
});
app.get("/api/emotions", (_req, res) => {
  return res.json({ entries: emotionLogsStore });
});
app.post("/api/gemini/habit-quote", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { habitTitle, topic = "motivacion", description = "" } = req.body || {};
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `H\xE1bito matutino: "${habitTitle || "Activaci\xF3n Matutina"}"
Tema / Descripci\xF3n: "${description || topic}"
Semilla diaria: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}-${Math.random().toString(36).slice(2, 6)}`,
      config: {
        systemInstruction: 'Eres el Mentor Matutino de "MI SEGUNDO CEREBRO 4.0". Genera UNA sola frase o micro-mensaje diario poderoso, original y accionable en espa\xF1ol (m\xE1ximo 28 palabras) adaptado al h\xE1bito indicado (si es meditaci\xF3n/calma, tono contemplativo y l\xFAcido; si es motivaci\xF3n/enfoque, tono firme estilo Isra Garc\xEDa y estoicismo). Sin comillas innecesarias ni introducciones.'
      }
    });
    return res.json({ quote: (response.text || "").trim().replace(/^["']|["']$/g, ""), model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/habit-quote", error);
  }
});
app.post("/api/gemini/spiritual-guide", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { tradition = "catolica", theme = "fortaleza" } = req.body || {};
    const systemInstruction = tradition === "catolica" ? 'Eres un acompa\xF1ante espiritual cat\xF3lico sereno y profundo. Devuelve un JSON con: { "reference": "Cita b\xEDblica exacta (Biblia Cat\xF3lica)", "verse": "Texto breve fiel del vers\xEDculo", "reflection": "Reflexi\xF3n pr\xE1ctica aplicada a la vida diaria y liderazgo", "prayer": "Oraci\xF3n breve y sincera de 2 l\xEDneas" }.' : 'Eres un gu\xEDa espiritual no confesional inspirado en la quietud contemplativa y pr\xE1cticas de presencia de Isra Garc\xEDa. Devuelve un JSON con: { "reference": "Nombre de la pr\xE1ctica o principio", "verse": "Frase o principio de quietud", "reflection": "Reflexi\xF3n pr\xE1ctica para conectar con prop\xF3sito y gratitud", "prayer": "Intenci\xF3n o afirmaci\xF3n serena de 2 l\xEDneas" }.';
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Tema o necesidad espiritual actual: ${theme}. Fecha: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    return res.json({ guide: parseJsonSafe(response.text), model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/spiritual-guide", error);
  }
});
app.post("/api/gemini/suggest-okrs", async (req, res) => {
  try {
    const client = requireAiClient(res);
    if (!client) return;
    const { businessName, sector, revenueTarget, actualRevenue, currentProjects = [] } = req.body || {};
    const { response, usedModel } = await generateWithFallback(client, {
      contents: `Empresa: ${businessName}
Sector: ${sector}
Meta ingresos mensuales: $${revenueTarget || 0}
Ingresos actuales: $${actualRevenue || 0}
Proyectos activos: ${JSON.stringify(currentProjects)}`,
      config: {
        systemInstruction: 'Eres un Director de Estrategia y OKRs de alto rendimiento. Recomienda 2 o 3 OKRs (Objetivos y Resultados Clave medibles) exactos para esta empresa y sector, explicando qu\xE9 KPI medir. Devuelve JSON con array "suggestions": [{ "title": "Objetivo claro y medible", "horizon": "quarterly"|"annual", "pillar": "financiero"|"intelectual"|"fisico", "kpiMetric": "KPI principal a medir", "milestones": ["Hito medible 1", "Hito medible 2", "Hito medible 3"] }].',
        responseMimeType: "application/json"
      }
    });
    const parsed = parseJsonSafe(response.text);
    return res.json({ suggestions: parsed.suggestions || [], model: usedModel });
  } catch (error) {
    return sendGeminiError(res, "/api/gemini/suggest-okrs", error);
  }
});
app.get("/api/storage/status", (_req, res) => {
  res.json({
    diskPersistenceEnabled: STORAGE_PATHS.enabled,
    dataDir: STORAGE_PATHS.enabled ? STORAGE_PATHS.dataDir : null,
    backupDir: STORAGE_PATHS.enabled ? STORAGE_PATHS.backupDir : null
  });
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Mi Segundo Cerebro 4.0 API",
    nodeEnv: process.env.NODE_ENV || "development",
    port: PORT,
    aiConfigured: Boolean(getApiKey()),
    model: TEXT_MODEL,
    fallbackModels: FALLBACK_MODELS,
    timeoutMs: GEMINI_TIMEOUT_MS,
    diskPersistenceEnabled: STORAGE_PATHS.enabled,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `Ruta API no encontrada: ${req.method} ${req.originalUrl}`
  });
});
async function startServer() {
  const httpServer = http.createServer(app);
  let viteMiddleware = null;
  let viteReadyPromise = null;
  if (!IS_PROD) {
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      if (viteMiddleware) {
        return viteMiddleware(req, res, next);
      }
      if (viteReadyPromise) {
        viteReadyPromise.then(() => {
          if (viteMiddleware) viteMiddleware(req, res, next);
          else next();
        }).catch(next);
      } else {
        next();
      }
    });
  } else {
    const distDir = path.join(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (!IS_PROD && PORT !== 3e3) {
        console.warn(`Port ${PORT} in use, falling back to port 3000`);
        httpServer.listen(3e3, "0.0.0.0", () => {
          console.log(`Mi Segundo Cerebro 4.0 running on http://0.0.0.0:3000`);
        });
      } else {
        console.error(
          `El puerto ${PORT} ya est\xE1 en uso (EADDRINUSE). Cambia la variable PORT en tu entorno o det\xE9n el proceso anterior.`
        );
        process.exit(1);
      }
    } else {
      console.error("Server error:", err);
    }
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      [
        `[Mi Segundo Cerebro 4.0] Servidor activo en http://0.0.0.0:${PORT} (${IS_PROD ? "production" : "development"})`,
        `  \xB7 GEMINI_API_KEY: ${getApiKey() ? "CONFIGURADA" : "NO CONFIGURADA (IA responder\xE1 HTTP 503)"}`,
        `  \xB7 Cadena de modelos IA: ${MODEL_CHAIN.join(" -> ")} (timeout: ${GEMINI_TIMEOUT_MS}ms)`,
        `  \xB7 Persistencia en disco: ${STORAGE_PATHS.enabled ? `${STORAGE_PATHS.dataDir} (respaldos: ${STORAGE_PATHS.backupDir})` : "Desactivada (solo navegador)"}`
      ].join("\n")
    );
  });
  if (!IS_PROD) {
    const disableHmr = process.env.DISABLE_HMR === "true";
    viteReadyPromise = (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: disableHmr ? false : true,
          ws: disableHmr ? false : { server: httpServer }
        },
        appType: "spa"
      });
      viteMiddleware = vite.middlewares;
    })();
    await viteReadyPromise;
  }
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
