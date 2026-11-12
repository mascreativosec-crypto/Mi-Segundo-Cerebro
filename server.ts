import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the environment; 8080 is reserved for Nginx reverse proxy
const PORT = process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Strategic AI Advisor Endpoint
// Principles: Isra García (discipline & high performance), Jürgen Klaric (strategic thinking & persuasion), Diego Dreyfus (radical introspection & accountability)
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const { prompt, context, tone = 'directo' } = req.body;

    if (!ai || !apiKey) {
      // Graceful fallback response if API key is not configured in environment
      return res.json({
        response: `[Aviso: Configura tu GEMINI_API_KEY en Secrets para respuestas en tiempo real de IA]\n\nDiagnóstico Estratégico:\n1. Tienes tareas clave pendientes; enfócate en el 20% de acciones que generan el 80% del impacto.\n2. Cuida la sincronización entre tu pilar físico y tus responsabilidades empresariales.\n3. Revisa tus prioridades innegociables en 'MI DÍA'.`,
        mode: 'offline_mode',
      });
    }

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
- Tono solicitado: ${tone} (opciones: 'directo y exigente', 'reflexivo', 'estratégico', 'inspirador', 'cercano y humano').
- Responde en español, de forma concisa, con viñetas claras y accionables.`;

    const userMessage = `Contexto del usuario actual:\n${JSON.stringify(context || {}, null, 2)}\n\nPregunta / Situación:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
      },
    });

    return res.json({ response: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/advisor:', error);
    return res.status(500).json({ error: error.message || 'Error processing AI advisor request' });
  }
});

// Daily Motivation & Mindset Endpoint
app.post('/api/gemini/motivation', async (req: Request, res: Response) => {
  try {
    const { moment = 'activacion', pillarSummary, tone = 'directo' } = req.body;

    if (!ai || !apiKey) {
      const fallbacks: Record<string, string> = {
        activacion: "Hoy no negocias con tu mente. Tus 3 prioridades mandan. Pon el cuerpo en movimiento, agradece la oportunidad de existir y domina el día.",
        enfoque: "Pausa táctica: ¿Estás ocupado o estás siendo productivo? Elimina la distracción y termina lo que empezaste.",
        reflexion: "Cierre de jornada: evalúa tus victorias con humildad y tus errores con objetividad. Mañana comienza hoy."
      };
      return res.json({ message: fallbacks[moment] || fallbacks.activacion });
    }

    const systemInstruction = `Eres el Mentor de Mentalidad & Motivación de "MI SEGUNDO CEREBRO 4.0".
Genera un mensaje de mentalidad conciso, impactante y con criterio para el momento: "${moment.toUpperCase()}".
Momentos:
- ACTIVACION: Al iniciar el día. Enérgico, enfocado en intención, 3 prioridades y congruencia personal.
- ENFOQUE: A mitad de jornada. Reenfoque estratégico, eliminación de ruido, ejecución implacable.
- REFLEXION: Al cerrar la noche. Rendición de cuentas, autoevaluación honesta, gratitud y descanso regenerador.
Tono seleccionado: ${tone}.
No uses clichés vacíos de autoayuda. Haz que cada palabra inspire responsabilidad y acción inmediata.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Resumen de estado del usuario:\n${JSON.stringify(pillarSummary || {}, null, 2)}`,
      config: {
        systemInstruction,
      },
    });

    return res.json({ message: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/motivation:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Wisdom Library & Capsule Endpoint
app.post('/api/gemini/wisdom', async (req: Request, res: Response) => {
  try {
    const { bookTitle, author, chapter, excerpt } = req.body;

    if (!ai || !apiKey) {
      return res.json({
        capsule: {
          bookTitle: bookTitle || "Principios para el Éxito",
          author: author || "Ray Dalio",
          chapter: chapter || "Capítulo 1",
          coreIdea: "La realidad funciona como una máquina maravillosa que recompensa a quien comprende la causa y el efecto sin autoengaño.",
          quote: "El dolor más la reflexión es igual al progreso.",
          pageRef: "Pág. 42",
          aiInterpretation: "El dolor emocional o profesional no debe evitarse ni suprimirse; es el indicador biológico de que estás enfrentando una verdad necesaria para crecer.",
          personalApplication: "Identifica qué conversación o hábito postergas por incomodidad y abórdalo hoy mismo.",
          businessApplication: "Analiza el fallo más reciente en tus operaciones empresariales como una oportunidad de depuración de sistemas.",
          practicalAction: "Escribe 1 fallo de esta semana, extrae la lección y modifica el proceso para que no se repita."
        }
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Libro: ${bookTitle}, Autor: ${author}, Capítulo: ${chapter}\nContenido / Extracto:\n${excerpt || 'Resumen y principios fundamentales'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return res.json({ capsule: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error in /api/gemini/wisdom:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Mi Segundo Cerebro 4.0 API', timestamp: new Date().toISOString() });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mi Segundo Cerebro 4.0 running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && PORT !== 3000) {
      console.warn(`Port ${PORT} in use, falling back to port 3000`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`Mi Segundo Cerebro 4.0 running on http://0.0.0.0:3000`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
