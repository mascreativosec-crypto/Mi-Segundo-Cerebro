import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the environment; 8080 is reserved for Nginx reverse proxy
const PORT = process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

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

// Helper to transcribe audio buffer (base64) with gemini-3.5-transcribe
async function transcribeAudioBase64(base64Data: string, mimeType: string): Promise<string> {
  if (!ai || !apiKey) return '';
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: [
      {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: base64Data,
        },
      },
      {
        text: 'Transcribe con máxima fidelidad en español todo lo que se dice en este audio. Devuelve únicamente la transcripción limpia.',
      },
    ],
  });
  return response.text || '';
}

// Strategic AI Advisor Endpoint
app.post('/api/gemini/advisor', async (req: Request, res: Response) => {
  try {
    const { prompt, context, pillarData, tone = 'directo' } = req.body;

    if (!ai || !apiKey) {
      return res.json({
        response: `Diagnóstico Estratégico:\n1. Enfócate en el 20% de acciones que generan el 80% del impacto hoy.\n2. Revisa tu área más baja y desbloquéala con un bloque de trabajo profundo de 45 min.\n3. Protege tu hidratación y descanso para sostener el ritmo ejecutivo.`,
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
- Tono solicitado: ${tone}.
- Responde en español, de forma concisa, con viñetas claras y accionables.`;

    const mergedContext = context || (pillarData ? { pillarData } : {});
    const userMessage = `Contexto del usuario actual:\n${JSON.stringify(mergedContext, null, 2)}\n\nPregunta / Situación:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
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
        activacion: 'Hoy no negocias con tu mente. Tus 3 prioridades mandan. Pon el cuerpo en movimiento, agradece la oportunidad de existir y domina el día.',
        enfoque: 'Pausa táctica: ¿Estás ocupado o estás siendo productivo? Elimina la distracción y termina lo que empezaste.',
        reflexion: 'Cierre de jornada: evalúa tus victorias con humildad y tus errores con objetividad. Mañana comienza hoy.',
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
      model: 'gemini-4-hydrogen',
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
          bookTitle: bookTitle || 'Principios para el Éxito',
          author: author || 'Ray Dalio',
          chapter: chapter || 'Capítulo 1',
          coreIdea: 'La realidad funciona como una máquina maravillosa que recompensa a quien comprende la causa y el efecto sin autoengaño.',
          quote: 'El dolor más la reflexión es igual al progreso.',
          pageRef: 'Pág. 42',
          aiInterpretation: 'El dolor emocional o profesional no debe evitarse ni suprimirse; es el indicador biológico de que estás enfrentando una verdad necesaria para crecer.',
          personalApplication: 'Identifica qué conversación o hábito postergas por incomodidad y abórdalo hoy mismo.',
          businessApplication: 'Analiza el fallo más reciente en tus operaciones empresariales como una oportunidad de depuración de sistemas.',
          practicalAction: 'Escribe 1 fallo de esta semana, extrae la lección y modifica el proceso para que no se repita.',
        },
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
      model: 'gemini-4-hydrogen',
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

// Executive Meeting Minutes & Audio Transcription Endpoint (Dirección & Estrategia + NoteLLM compatible)
app.post('/api/gemini/meeting-minutes', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, rawNotes, businessName, scopeContext } = req.body;

    if (!ai || !apiKey) {
      const notesPreview = (rawNotes || '').trim();
      return res.json({
        transcript: notesPreview || 'Transcripción de ejemplo: Revisión de prioridades, aprendizajes de mentoría y acuerdos clave.',
        minutes: {
          title: notesPreview ? notesPreview.slice(0, 58) : 'Acta / Nota Estructurada',
          context: notesPreview || 'Sesión de alineación estratégica y reflexión aplicada.',
          decision: 'Priorizar acciones de alto impacto y ejecutar el primer paso medible hoy mismo.',
          keyPoints: [
            'Validación de objetivos prioritarios y responsables',
            'Puntos clave extraídos de la sesión o mentoría',
            'Seguimiento concreto en el tablero correspondiente',
          ],
          expectedOutcome: 'Mayor velocidad de ejecución, coherencia y trazabilidad.',
        },
        mode: 'offline_mode',
      });
    }

    let transcript = (rawNotes || '').trim();
    if (audioBase64) {
      const transcribed = await transcribeAudioBase64(audioBase64, mimeType || 'audio/webm');
      transcript = transcript ? `${transcribed}\n\nNotas adicionales:\n${transcript}` : transcribed;
    }

    if (!transcript) {
      return res.status(400).json({ error: 'Se requiere un archivo de audio o notas de reunión.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Ámbito: ${scopeContext || 'Empresarial'}\nContexto / Empresa: ${businessName || 'General'}\n\nTranscripción / Notas:\n${transcript}`,
      config: {
        systemInstruction:
          'Eres el Secretario Ejecutivo y Mentor Estratégico de "MI SEGUNDO CEREBRO 4.0". Analiza la transcripción o notas (puede ser una reunión empresarial o una mentoría/reflexión personal) y extrae un acta estructurada, precisa y accionable en español.',
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

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      transcript,
      minutes: parsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/meeting-minutes:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar acta de reunión' });
  }
});

// Personal Experiment Coach Endpoint (Isra García + Diego Dreyfus comparison & coaching)
app.post('/api/gemini/experiment-coach', async (req: Request, res: Response) => {
  try {
    const { experiment, linkedNotes = [], question } = req.body;
    if (!experiment) {
      return res.status(400).json({ error: 'Faltan datos del experimento.' });
    }

    const logs = Array.isArray(experiment.logs) ? experiment.logs : [];

    if (!ai || !apiKey) {
      const firstLog = logs[0];
      const latestLog = logs[logs.length - 1];
      return res.json({
        feedback: [
          `Análisis de Experimento "${experiment.title}" (${experiment.inspiration}):`,
          logs.length >= 2
            ? `• Comparativa (${firstLog.date} → ${latestLog.date}): llevas ${logs.length} registros en ruta hacia tu meta de ${experiment.durationDays} días. La consistencia real se mide comparando tu línea base contra tus acciones bajo presión.`
            : `• Tienes ${logs.length} registro(s). Registra al menos 2-3 días consecutivos para medir deltas numéricos reales y cambios mentales.`,
          `• Ajuste inmediato (estilo ${experiment.inspiration}): identifica qué excusa apareció esta semana y diseña una regla binaria no negociable para las próximas 48 horas.`,
        ].join('\n'),
        mode: 'offline_mode',
      });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptPayload,
      config: { systemInstruction },
    });

    return res.json({ feedback: response.text });
  } catch (error: any) {
    console.error('Error in /api/gemini/experiment-coach:', error);
    return res.status(500).json({ error: error.message || 'Error en Coach de Experimentos' });
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

    const extractFallbackExperiment = (text: string) => {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.replace(/^[-*•\d.)\]]+\s*/, '').trim())
        .filter((l) => l.length > 2);

      const daysMatch = text.match(/(\d{1,3})\s*(?:d[ií]as|dias|semanas)/i);
      let durationDays = 21;
      if (daysMatch) {
        const val = parseInt(daysMatch[1], 10);
        durationDays = /semanas/i.test(daysMatch[0]) ? Math.min(365, val * 7) : Math.max(3, Math.min(365, val));
      }

      const lower = text.toLowerCase();
      let pillar: 'espiritual' | 'emocional' | 'fisico' | 'intelectual' | 'financiero' = 'fisico';
      if (lower.includes('orac') || lower.includes('fe') || lower.includes('espirit') || lower.includes('medit')) {
        pillar = 'espiritual';
      } else if (lower.includes('emoc') || lower.includes('ansied') || lower.includes('paz') || lower.includes('calma')) {
        pillar = 'emocional';
      } else if (lower.includes('le') || lower.includes('estud') || lower.includes('enfoq') || lower.includes('deep work')) {
        pillar = 'intelectual';
      } else if (lower.includes('dinero') || lower.includes('ahorr') || lower.includes('vent') || lower.includes('ingres')) {
        pillar = 'financiero';
      }

      const title =
        String(customTitle).trim() ||
        (lines[0] && lines[0].length <= 68 ? lines[0] : 'Experimento desde Plantilla Personalizada');

      const dailySubtasks = lines.slice(0, 7).map((l) => l.slice(0, 75));
      if (dailySubtasks.length === 0) {
        dailySubtasks.push('Ejecutar protocolo principal del día', 'Registrar aprendizaje clave');
      }

      const fields = [
        { id: `fld_${Date.now()}_0`, label: 'Avance del Protocolo (%)', type: 'percent_10', unit: '%' },
        { id: `fld_${Date.now()}_1`, label: 'Tiempo Dedicado', type: 'timer_minutes', unit: 'min' },
        { id: `fld_${Date.now()}_2`, label: 'Nivel de Energía / Enfoque (1-10)', type: 'number', unit: 'pts' },
        {
          id: `fld_${Date.now()}_3`,
          label: 'Observación mental y resultados del día',
          type: 'text',
          placeholder: '¿Qué funcionó, qué resistencia apareció y qué ajustas mañana?',
        },
      ];

      return {
        title,
        inspiration: 'Propio',
        inspirationColor: 'fuchsia',
        pillar,
        goalDescription: `Ejecutar de forma consistente los ${dailySubtasks.length} pasos clave de esta plantilla durante ${durationDays} días.`,
        hypothesis: 'Aplicar esta secuencia de pasos sin negociar excusas producirá mejoras medibles en disciplina y resultados.',
        purpose: 'Convertir una guía teórica o plantilla en ejecución diaria observable y comparativa.',
        durationDays,
        dailySubtasks,
        fields,
      };
    };

    if (!ai || !apiKey) {
      return res.json({
        experimentDraft: extractFallbackExperiment(raw),
        mode: 'offline_mode',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
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

    const parsed = JSON.parse(response.text || '{}');
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
      normalized.fields = extractFallbackExperiment(raw).fields;
    }

    return res.json({ experimentDraft: normalized });
  } catch (error: any) {
    console.error('Error in /api/gemini/experiment-from-template:', error);
    return res.status(500).json({ error: error.message || 'Error convirtiendo plantilla en experimento' });
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
    const { message, audioBase64, audioMimeType, fileBase64, fileMimeType, appSnapshot } = req.body;

    let effectivePrompt = (message || '').trim();

    if (audioBase64 && ai && apiKey) {
      const transcribed = await transcribeAudioBase64(audioBase64, audioMimeType || 'audio/webm');
      effectivePrompt = effectivePrompt ? `${effectivePrompt}\n[Audio transcrito]: ${transcribed}` : transcribed;
    }

    if (!ai || !apiKey) {
      // Deterministic offline intent parser for common commands
      const lower = effectivePrompt.toLowerCase();
      const actions: { name: string; args: Record<string, any> }[] = [];
      let reply = 'Modo local activo (sin API Key en entorno). ';

      if (lower.includes('super mañana') || lower.includes('súper mañana')) {
        actions.push({ name: 'navigate_module', args: { viewId: 'super_morning' } });
        reply += 'Abriendo tu módulo de Súper Mañana.';
      } else if (lower.includes('super noche') || lower.includes('súper noche')) {
        actions.push({ name: 'navigate_module', args: { viewId: 'super_night' } });
        reply += 'Abriendo tu módulo de Súper Noche.';
      } else if (lower.includes('pago') || lower.includes('gasto') || lower.includes('transferencia')) {
        const match = effectivePrompt.match(/(\d+(?:\.\d{1,2})?)/);
        const amount = match ? parseFloat(match[1]) : 50;
        actions.push({
          name: 'register_payment',
          args: {
            type: 'expense',
            amount,
            category: 'Gasto / Transferencia',
            description: effectivePrompt || 'Registro rápido desde asistente',
            scope: 'personal',
          },
        });
        reply += `He registrado el movimiento de $${amount} en Finanzas Personales.`;
      } else if (lower.includes('recordatorio') || lower.includes('recuerdame') || lower.includes('recuérdame')) {
        actions.push({
          name: 'create_reminder',
          args: {
            title: effectivePrompt.replace(/recu[eé]rdame|recordatorio/gi, '').trim() || 'Recordatorio del asistente',
            originModule: 'sistema',
            showInMiDia: true,
          },
        });
        reply += 'Recordatorio guardado en tu bandeja unificada y visible en Mi Día.';
      } else {
        actions.push({
          name: 'create_task',
          args: {
            title: effectivePrompt || 'Nueva acción programada',
            scope: lower.includes('empresa') || lower.includes('reuni') ? 'business' : 'personal',
            priority: 'important',
            remindInInbox: true,
          },
        });
        reply += 'He agendado esa acción en Gestión de Tareas y en tu bandeja de recordatorios.';
      }

      return res.json({ reply, transcript: effectivePrompt, actions, mode: 'offline_mode' });
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

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
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
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/assistant:', error);
    return res.status(500).json({ error: error.message || 'Error en asistente del sistema' });
  }
});

// VPS Webhook Bridge Endpoint for WhatsApp (Evolution API / Meta), Telegram Bot & Email (n8n/SMTP)
app.post('/api/integrations/webhook', async (req: Request, res: Response) => {
  try {
    const { channel = 'whatsapp', sender = '', text = '', attachmentBase64, attachmentMimeType } = req.body;
    if (!text && !attachmentBase64) {
      return res.status(400).json({ error: 'Payload vacío: se requiere text o attachmentBase64.' });
    }

    // In VPS production with PostgreSQL, this route persists directly into SQL.
    // Here it parses the external message into structured system actions ready for execution.
    if (!ai || !apiKey) {
      return res.json({
        status: 'received',
        channel,
        sender,
        parsedAction: {
          name: 'create_reminder',
          args: {
            title: `[${String(channel).toUpperCase()}] ${String(text).slice(0, 80)}`,
            content: text,
            originModule: 'sistema',
            showInMiDia: true,
          },
        },
      });
    }

    const parts: any[] = [];
    if (attachmentBase64 && attachmentMimeType) {
      parts.push({ inlineData: { mimeType: attachmentMimeType, data: attachmentBase64 } });
    }
    parts.push({ text: `Mensaje entrante vía ${channel} de ${sender || 'usuario'}:\n${text}` });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
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
      actions: (response.functionCalls || []).map((fc) => ({ name: fc.name, args: fc.args })),
      reply: response.text || 'Mensaje procesado en Segundo Cerebro 4.0.',
    });
  } catch (error: any) {
    console.error('Error in /api/integrations/webhook:', error);
    return res.status(500).json({ error: error.message });
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

// AI Daily Habit Quote / Meditation Message Endpoint
app.post('/api/gemini/habit-quote', async (req: Request, res: Response) => {
  try {
    const { habitTitle, topic = 'motivacion', description = '' } = req.body || {};
    const offlinePools: Record<string, string[]> = {
      motivacion: [
        'No negocies con la comodidad de las 6 AM; quien conquista la primera hora conquista el día entero.',
        'Tu disciplina es el voto silencioso por la persona en la que te estás convirtiendo hoy.',
        'Haz lo importante antes de que el mundo empiece a pedirte lo urgente.',
        'La excelencia no es un estado de ánimo, es una decisión ejecutada aunque no tengas ganas.',
      ],
      meditacion: [
        'Observa tus pensamientos como nubes pasando: no tienes que pelear con ellos ni obedecerlos.',
        'En la quietud absoluta antes del ruido está la claridad que cien reuniones no pueden darte.',
        'Respira lento. Suelta el resultado que no controlas y habita plenamente este segundo.',
        'Mente "No Sé": mira tu mañana sin juicios viejos, con asombro y lucidez limpia.',
      ],
      isra: [
        'Abraza hoy una micro-incomodidad voluntaria; ahí es donde se forja tu temple.',
        'No te creas tus excusas elegantes. Mide tu compromiso por hechos visibles antes de las 10 AM.',
      ],
    };

    if (!ai || !apiKey) {
      const lower = `${habitTitle || ''} ${topic}`.toLowerCase();
      const pool = lower.includes('medit') || lower.includes('vipass') || lower.includes('silencio')
        ? offlinePools.meditacion
        : lower.includes('isra') || lower.includes('incomod')
        ? offlinePools.isra
        : offlinePools.motivacion;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      return res.json({ quote: picked, mode: 'offline_mode' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Hábito matutino: "${habitTitle || 'Activación Matutina'}"\nTema / Descripción: "${description || topic}"\nSemilla diaria: ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).slice(2, 6)}`,
      config: {
        systemInstruction:
          'Eres el Mentor Matutino de "MI SEGUNDO CEREBRO 4.0". Genera UNA sola frase o micro-mensaje diario poderoso, original y accionable en español (máximo 28 palabras) adaptado al hábito indicado (si es meditación/calma, tono contemplativo y lúcido; si es motivación/enfoque, tono firme estilo Isra García y estoicismo). Sin comillas innecesarias ni introducciones.',
      },
    });

    return res.json({ quote: (response.text || '').trim().replace(/^["']|["']$/g, '') });
  } catch (error: any) {
    console.error('Error in /api/gemini/habit-quote:', error);
    return res.status(500).json({ error: error.message || 'Error generando mensaje diario' });
  }
});

// Spiritual Guide Endpoint (Catholic Lectio Divina & Isra García / Contemplative)
app.post('/api/gemini/spiritual-guide', async (req: Request, res: Response) => {
  try {
    const { tradition = 'catolica', theme = 'fortaleza' } = req.body || {};

    if (!ai || !apiKey) {
      if (tradition === 'catolica') {
        const catholicFallbacks: Record<string, { reference: string; verse: string; reflection: string; prayer: string }> = {
          fortaleza: {
            reference: 'Isaías 41,10',
            verse: 'No temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios. Te fortaleceré y te ayudaré.',
            reflection: 'La verdadera fortaleza directiva no nace de la autosuficiencia rígida, sino de avanzar con paz interior sabiendo que no caminas solo.',
            prayer: 'Señor, dame serenidad para decidir con justicia, coraje para hacer lo correcto y humildad para soltar lo que no controlo.',
          },
          proposito: {
            reference: 'Jeremías 29,11',
            verse: 'Porque yo sé muy bien los planes que tengo para ustedes, planes de bienestar y no de calamidad, a fin de darles un futuro y una esperanza.',
            reflection: 'Tus proyectos materiales cobran sentido eterno cuando sirven a las personas y se construyen con verdad y rectitud.',
            prayer: 'Alinea hoy mi agenda con Tu propósito, y haz de mi trabajo un instrumento de bien y paz.',
          },
          paz: {
            reference: 'Filipenses 4,6-7',
            verse: 'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias.',
            reflection: 'La gratitud es el antídoto inmediato contra la ansiedad anticipatoria. Entrega las cargas antes de descansar.',
            prayer: 'Guarda mi corazón y mis pensamientos en Tu paz que sobrepasa todo entendimiento.',
          },
        };
        return res.json({
          guide: catholicFallbacks[theme] || catholicFallbacks.fortaleza,
          mode: 'offline_mode',
        });
      }

      return res.json({
        guide: {
          reference: 'Práctica de Quietud & Mente "No Sé" (Isra García)',
          verse: 'Deja de intentar encajar cada segundo en etiquetas viejas. Observa este instante con presencia limpia, gratitud y asombro.',
          reflection: 'Cuando silencias el ruido de las expectativas ajenas y agradeces lo esencial, recuperas tu eje espiritual.',
          prayer: 'Hoy elijo estar presente, agradecer sin prisa y actuar con coherencia.',
        },
        mode: 'offline_mode',
      });
    }

    const systemInstruction =
      tradition === 'catolica'
        ? 'Eres un acompañante espiritual católico sereno y profundo. Devuelve un JSON con: { "reference": "Cita bíblica exacta (Biblia Católica)", "verse": "Texto breve fiel del versículo", "reflection": "Reflexión práctica aplicada a la vida diaria y liderazgo", "prayer": "Oración breve y sincera de 2 líneas" }.'
        : 'Eres un guía espiritual no confesional inspirado en la quietud contemplativa y prácticas de presencia de Isra García. Devuelve un JSON con: { "reference": "Nombre de la práctica o principio", "verse": "Frase o principio de quietud", "reflection": "Reflexión práctica para conectar con propósito y gratitud", "prayer": "Intención o afirmación serena de 2 líneas" }.';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Tema o necesidad espiritual actual: ${theme}. Fecha: ${new Date().toISOString().split('T')[0]}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return res.json({ guide: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error in /api/gemini/spiritual-guide:', error);
    return res.status(500).json({ error: error.message || 'Error en guía espiritual' });
  }
});

// AI OKR & KPI Advisor for Multi-Business Projects
app.post('/api/gemini/suggest-okrs', async (req: Request, res: Response) => {
  try {
    const { businessName, sector, revenueTarget, actualRevenue, currentProjects = [] } = req.body || {};

    if (!ai || !apiKey) {
      return res.json({
        suggestions: [
          {
            title: `Incrementar conversión comercial y retención en ${businessName || 'la empresa'} (+25% ingresos recurrentes)`,
            horizon: 'quarterly',
            pillar: 'financiero',
            kpiMetric: 'MRR / Margen Neto / Tasa de Cierre',
            milestones: [
              'Auditar embudo de ventas y definir métrica semanal de propuestas enviadas',
              'Estandarizar proceso de onboarding para elevar retención sobre 85%',
              'Alcanzar el 100% de la meta de ingresos mensual proyectada',
            ],
          },
          {
            title: `Sistematizar entregas y reducir cuellos de botella operativos en ${sector || 'operaciones'}`,
            horizon: 'quarterly',
            pillar: 'intelectual',
            kpiMetric: 'Tiempo de Entrega (Cycle Time) & NPS',
            milestones: [
              'Documentar los 3 procesos críticos del equipo en checklist repetibles',
              'Medir satisfacción (NPS >= 90) al cierre de cada proyecto',
            ],
          },
        ],
        mode: 'offline_mode',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Empresa: ${businessName}\nSector: ${sector}\nMeta ingresos mensuales: $${revenueTarget || 0}\nIngresos actuales: $${actualRevenue || 0}\nProyectos activos: ${JSON.stringify(currentProjects)}`,
      config: {
        systemInstruction:
          'Eres un Director de Estrategia y OKRs de alto rendimiento. Recomienda 2 o 3 OKRs (Objetivos y Resultados Clave medibles) exactos para esta empresa y sector, explicando qué KPI medir. Devuelve JSON con array "suggestions": [{ "title": "Objetivo claro y medible", "horizon": "quarterly"|"annual", "pillar": "financiero"|"intelectual"|"fisico", "kpiMetric": "KPI principal a medir", "milestones": ["Hito medible 1", "Hito medible 2", "Hito medible 3"] }].',
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ suggestions: parsed.suggestions || [] });
  } catch (error: any) {
    console.error('Error in /api/gemini/suggest-okrs:', error);
    return res.status(500).json({ error: error.message || 'Error generando sugerencias OKR' });
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

