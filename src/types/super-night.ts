// Master definitions and types for Súper Noche 4.0 (Midnight Indigo)

import { RoutineMode, PromptField } from './super-morning';

export interface SuperNightHabit {
  id: string;
  order: number;
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'introspection' | 'tikun' | 'awareness' | 'release';
  defaultMinutes: number;
  expressMinutes: number;
  deepMinutes: number;
  enabled: boolean;
  stoicQuote?: string;
  description: string;
  instructions: string[];
  fields?: PromptField[];
}

export interface VerbalAwarenessItem {
  id: string;
  label: string;
  checked: boolean;
}

export const DEFAULT_VERBAL_AWARENESS_ITEMS: VerbalAwarenessItem[] = [
  { id: 'va_1', label: 'Cumplí con todo lo que pensé hacer hoy', checked: true },
  { id: 'va_2', label: 'Qué aprendí hoy en mis interacciones y decisiones', checked: true },
  { id: 'va_3', label: 'Sobre qué fui consciente en momentos de tensión', checked: true },
  { id: 'va_4', label: 'Cómo reaccioné ante esta tentación o distracción', checked: true },
  { id: 'va_5', label: 'Qué debo hacer para no caer en reacción inmediata', checked: true },
  { id: 'va_6', label: 'Qué virtud estoica o espiritual adquirí hoy', checked: true },
  { id: 'va_7', label: 'Estuve preparado física y mentalmente para este día', checked: true },
  { id: 'va_8', label: 'Seguí mis planes y prioridades innegociables', checked: true },
  { id: 'va_9', label: 'Qué pude haber ejecutado con mayor templanza o excelencia', checked: true },
];

export const SUPER_NOCHE_HABITS: SuperNightHabit[] = [
  {
    id: 'sn_01',
    order: 1,
    key: 'evaluacion_victoria',
    title: 'Evaluación del Día & Gran Victoria',
    subtitle: 'Rendición de cuentas sin concesiones ni autoengaño',
    icon: 'Award',
    category: 'introspection',
    defaultMinutes: 3,
    expressMinutes: 1,
    deepMinutes: 5,
    enabled: true,
    stoicQuote: 'No permitas que el sueño cierre tus párpados sin haber repasado tres veces cada acción del día: ¿En qué fallé? ¿Qué hice bien? ¿Qué deber omití? — Pitágoras / Séneca',
    description: 'Reconoce con honestidad tu victoria más profunda y qué aspecto de tu carácter requieres pulir.',
    instructions: [
      'Asigna tu calificación sincera de 1 a 5 estrellas.',
      'Identifica la victoria moral o ejecutiva del día.',
      'Agradece el esfuerzo desplegado sin caer en complacencia.',
    ],
  },
  {
    id: 'sn_02',
    order: 2,
    key: 'magia_tikun',
    title: 'Momento de Magia & Sentido de Tikún',
    subtitle: 'Saber qué tikún tocar y sostener la responsabilidad de no fallar',
    icon: 'Sparkles',
    category: 'tikun',
    defaultMinutes: 4,
    expressMinutes: 2,
    deepMinutes: 7,
    enabled: true,
    stoicQuote: 'Donde hay un ser humano, hay una oportunidad para hacer una bondad y rectificar el mundo. — Séneca',
    description: 'El Tikún representa la corrección espiritual del alma y el impacto trascendente en quienes dependen de tu liderazgo.',
    instructions: [
      'Reflexiona sobre el momento sagrado o sincronicidad vivida hoy.',
      'Toma conciencia de todas las personas y familias que dependen de que no te desvíes ni falles.',
      'Conecta con tu propósito superior.',
    ],
  },
  {
    id: 'sn_03',
    order: 3,
    key: 'logros_aprendizajes',
    title: 'Logros del Día & Aprendizajes Pasados por Alto',
    subtitle: 'Aquellas cosas aparentemente insignificantes que no lo son',
    icon: 'BookOpen',
    category: 'introspection',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 6,
    enabled: true,
    description: 'Muchas veces pasamos por alto detalles sutiles que esconden las mayores lecciones de liderazgo.',
    instructions: [
      'Enumera los avances tangibles completados hoy.',
      'Identifica qué aspecto pasabas por alto y cómo superarlo con sabiduría.',
    ],
  },
  {
    id: 'sn_04',
    order: 4,
    key: 'fracasos_soluciones',
    title: 'Fracasos del Día (3) & Posibles Soluciones',
    subtitle: 'Diagnóstico objetivo de desvíos y plan correctivo inmediato',
    icon: 'Target',
    category: 'introspection',
    defaultMinutes: 5,
    expressMinutes: 2,
    deepMinutes: 8,
    enabled: true,
    stoicQuote: 'El obstáculo en el camino se convierte en el camino. — Marco Aurelio',
    description: 'No tapes los errores. Obsérvalos con frialdad analítica (ej: cobranza) y genera de inmediato su solución operativa.',
    instructions: [
      'Registra los 3 puntos donde no estuviste al nivel esperado.',
      'Propón la solución pragmática para implementar mañana mismo.',
    ],
  },
  {
    id: 'sn_05',
    order: 5,
    key: 'conciencia_verbal',
    title: 'Conciencia Verbal & Autogobierno (9 Puntos)',
    subtitle: 'Revisión exhaustiva de integridad entre palabra, emoción y acción',
    icon: 'Shield',
    category: 'awareness',
    defaultMinutes: 5,
    expressMinutes: 3,
    deepMinutes: 8,
    enabled: true,
    description: 'Protocolo riguroso de autogobierno sobre tentaciones, cumplimiento de planes y templanza.',
    instructions: [
      'Marca cada casilla confirmando tu nivel de presencia y lucidez durante el día.',
    ],
  },
  {
    id: 'sn_06',
    order: 6,
    key: 'nuevo_y_apoyo',
    title: 'Lo Nuevo de Hoy & Gratitud de Respaldo',
    subtitle: 'Qué hice hoy que nunca antes hacía y saber que hay gente que me apoya',
    icon: 'Heart',
    category: 'release',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 5,
    enabled: true,
    description: 'Expansión de tu zona de confort (ej. contar tus experiencias) y gratitud sincera por tu red de apoyo.',
    instructions: [
      'Registra qué barrera mental derribaste hoy al intentar algo nuevo.',
      'Conecta con la gratitud por las personas que respaldan tu visión.',
    ],
  },
  {
    id: 'sn_07',
    order: 7,
    key: 'peticion_subconsciente',
    title: 'Petición Subconsciente (30 Repeticiones)',
    subtitle: 'Grabación hipnagógica antes del descanso biológico',
    icon: 'Moon',
    category: 'release',
    defaultMinutes: 4,
    expressMinutes: 2,
    deepMinutes: 6,
    enabled: true,
    description: 'Tu mente subconsciente procesa durante 8 horas la última idea que siembras con intensidad antes de dormir. Repite tu orden mental 30 veces.',
    instructions: [
      'Formula tu mandato afirmativo en tiempo presente.',
      'Cierra los ojos y pulsa el contador mientras lo repites con fe absoluta.',
      'Suelta todo control y entrégate al sueño reparador.',
    ],
  },
  {
    id: 'sn_08',
    order: 8,
    key: 'conclusion_paz',
    title: 'Conclusión del Día & Paz Invencible',
    subtitle: 'Liberación total de tensión y transición al sueño',
    icon: 'Sun',
    category: 'release',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    stoicQuote: 'He vivido y he completado la carrera que me asignó el destino. Ahora, mi imagen irá al descanso en paz. — Virgilio',
    description: 'Cierra tu cuaderno. El día terminó; has dado tu máximo esfuerzo. Lo que quedó pendiente se conquistará mañana.',
    instructions: [
      'Tres exhalaciones profundas por la boca soltando hombros y mandíbula.',
      'Agradece por este día vivido y descansa.',
    ],
  },
];

export interface IsraGarciaNightHabit {
  id: string;
  title: string;
  timing: string;
  description: string;
  benefit: string;
}

export const ISRA_GARCIA_NIGHT_HABITS: IsraGarciaNightHabit[] = [
  {
    id: 'ig_digital_detox',
    title: 'Desconexión Digital Radical',
    timing: '45–60 min antes de dormir',
    description: 'Apaga pantallas, activa modo avión y evita redes sociales, correos o luz azul que inhibe la melatonina.',
    benefit: 'Reduce la hiperactivación dopaminérgica y acelera el sueño profundo.',
  },
  {
    id: 'ig_quietud_danza',
    title: 'Quietud, Silencio y "Danza Interna"',
    timing: '10 min de descarga somática',
    description: 'Dedica minutos de silencio total con respiración nasal profunda y movilidad suave para liberar tensión corporal.',
    benefit: 'Activa el sistema nervioso parasimpático y serena la mente antes de acostarte.',
  },
  {
    id: 'ig_agua_cierre',
    title: 'Higiene del Agua (Ducha / Baño Relajante)',
    timing: '30 min antes de la cama',
    description: 'Toma una ducha templada o relajante como señal fisiológica de cierre del esfuerzo físico y mental del día.',
    benefit: 'El descenso térmico posterior induce somnolencia natural de forma más rápida.',
  },
  {
    id: 'ig_diario_sabiduria',
    title: 'Pequeño Diario de Sabiduría Interna',
    timing: '5–8 min en papel o bitácora',
    description: 'Vacía pendientes en una nota para no rumiar en la cama y registra 1 lección esencial que te deja la jornada.',
    benefit: 'Libera memoria de trabajo y previene despertares nocturnos por preocupaciones.',
  },
  {
    id: 'ig_lectura_filosofica',
    title: 'Lectura Filosófica sin Pantallas',
    timing: '10–15 min antes de dormir',
    description: 'Lee páginas físicas de estoicismo, filosofía práctica o biografías para nutrir tu mente con calma.',
    benefit: 'Desplaza el estrés operativo por perspectiva serena y sabiduría atemporal.',
  },
  {
    id: 'ig_binaural_hipnagogia',
    title: 'Sonidos Binaurales y Afirmaciones Positivas',
    timing: 'Últimos 5 min ya en cama',
    description: 'Escucha frecuencias relajantes suaves o repite tus afirmaciones de gratitud y descanso reparador.',
    benefit: 'Prepara el subconsciente durante el estado hipnagógico para un descanso óptimo.',
  },
];

