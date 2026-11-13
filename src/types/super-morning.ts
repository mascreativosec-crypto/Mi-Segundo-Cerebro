// Types and 13 Master Habits for Super Mañana 4.0

export type HabitCategory = 'mind' | 'body' | 'spirit' | 'focus';
export type RoutineMode = 'express' | 'balanced' | 'deep' | 'custom';

export type PromptFieldType = 'text' | 'textarea' | 'bullets' | 'pair' | 'checkboxes';

export interface PromptField {
  id: string;
  type: PromptFieldType;
  label: string;
  placeholder?: string;
  options?: string[]; // for checkboxes or pairs
  leftLabel?: string; // for pair (e.g., Bajo mi control)
  rightLabel?: string; // for pair (e.g., Fuera de mi control)
}

export interface SuperMorningHabit {
  id: string;
  order: number;
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  category: HabitCategory;
  defaultMinutes: number; // balanced
  expressMinutes: number; // express
  deepMinutes: number;    // deep
  enabled: boolean;
  stoicQuote?: string;
  enableAiDailyMessage?: boolean;
  aiMessageTopic?: string;
  linkToFitness?: boolean;
  description: string;
  instructions: string[];
  fields?: PromptField[];
}

export interface HabitResponse {
  habitId: string;
  completedAt?: string;
  timeSpentSeconds?: number;
  data: Record<string, any>;
}

export interface DailyMorningLog {
  date: string; // YYYY-MM-DD
  mode: RoutineMode;
  totalDurationSeconds: number;
  completedHabitIds: string[];
  responses: Record<string, Record<string, any>>;
  wakeUpTime: string;
  wakeUpMood: number; // 1 - 5
  notes?: string;
  isRecovery?: boolean;
}

export interface NightPrepCheckItem {
  id: string;
  label: string;
  hint: string;
  completed: boolean;
}

export const DEFAULT_NIGHT_PREP_ITEMS: NightPrepCheckItem[] = [
  { id: 'np_1', label: 'Ropa de entrenamiento lista y visible', hint: 'Reduce la fricción mental a las 5:00 AM', completed: false },
  { id: 'np_2', label: 'Botella de agua y electrolitos preparados', hint: 'Hidratación celular inmediata al despertar', completed: false },
  { id: 'np_3', label: 'Espacio de meditación y silencio despejado', hint: 'Cero desorden visual para máxima paz', completed: false },
  { id: 'np_4', label: 'Alarma fuera del alcance de la cama', hint: 'Evita el botón de posponer a toda costa', completed: false },
  { id: 'np_5', label: 'Desconexión digital 45 min antes de dormir', hint: 'Modo avión y luz cálida para melatonina profunda', completed: false },
  { id: 'np_6', label: 'Top 3 prioridades del día siguiente definidas', hint: 'Tu subconsciente las procesará mientras duermes', completed: false },
];

export const SUPER_MANANA_HABITS: SuperMorningHabit[] = [
  {
    id: 'sm_01',
    order: 1,
    key: 'primera_decision',
    title: '1. Primera Decisión Trascendental al Abrir los Ojos',
    subtitle: 'El primer acto de soberanía personal antes de tocar el teléfono',
    icon: 'AlarmClock',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'despertar con determinación y primera decisión',
    stoicQuote: 'Al amanecer, cuando te cueste despertar, ten presente: Me levanto para hacer la labor de un ser humano. — Marco Aurelio',
    description: '¿Cuál es la primera decisión trascendental al abrir los ojos? Define cómo entras al día antes de que el ruido externo decida por ti.',
    instructions: [
      'Abre los ojos, respira hondo y no negocies con la alarma.',
      'Recibe luz natural y toma 500 ml de agua tibia para activar tu organismo.',
      'Declara tu primera decisión consciente del día.',
    ],
    fields: [
      { id: 'first_decision', type: 'textarea', label: '¿Cuál es mi primera decisión trascendental hoy?', placeholder: 'Hoy decido actuar desde la calma, el servicio y la disciplina sin posponer lo vital...' },
    ],
  },
  {
    id: 'sm_02',
    order: 2,
    key: 'vipassana',
    title: '2. Meditación Vipassana (20 Min)',
    subtitle: 'Observación ecuanime de la respiración y sensaciones sin juicio',
    icon: 'Brain',
    category: 'mind',
    defaultMinutes: 20,
    expressMinutes: 5,
    deepMinutes: 25,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'meditación vipassana, presencia, silencio interior y quietud',
    stoicQuote: 'No son las cosas las que atormentan a los hombres, sino los juicios que sobre ellas se forman. — Epicteto',
    description: 'Práctica de atención plena en silencio observando la entrada y salida del aire y las sensaciones corporales tal como son.',
    instructions: [
      'Columna erguida, ojos cerrados y atención en las fosas nasales.',
      'Observa cada pensamiento o sensación sin reaccionar con apego ni rechazo.',
      'Vuelve con suavidad a la respiración las veces que sea necesario.',
    ],
    fields: [
      { id: 'vipassana_insight', type: 'textarea', label: 'Notas y observación tras la meditación', placeholder: '¿Qué observaste en tu mente y cuerpo durante la quietud?' },
    ],
  },
  {
    id: 'sm_03',
    order: 3,
    key: 'cosas_no_controlo',
    title: '3. Cosas que NO Controlo (2 min)',
    subtitle: 'Dicotomía estoica: distinguir qué suelto y qué solución ejecuto',
    icon: 'Scale',
    category: 'mind',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    stoicQuote: 'De las cosas que existen, unas dependen de nosotros y otras no. — Epicteto',
    description: 'Identifica lo que escapa de tu control y responde con una solución práctica sobre lo que sí depende de ti.',
    instructions: [
      'Anota la situación o preocupación externa que no puedes controlar directamente.',
      'Define la solución concreta o actitud que sí está en tus manos.',
    ],
    fields: [
      {
        id: 'no_control_pair',
        type: 'pair',
        label: 'No Controlo vs. Solución',
        leftLabel: 'No Controlo',
        rightLabel: 'Solución (Lo que sí depende de mí)',
      },
    ],
  },
  {
    id: 'sm_04',
    order: 4,
    key: 'explosion_fisica',
    title: '4. Explosión Física',
    subtitle: 'Despierta el córtex, más creatividad, más enfoque',
    icon: 'Dumbbell',
    category: 'body',
    defaultMinutes: 5,
    expressMinutes: 2,
    deepMinutes: 10,
    enabled: true,
    linkToFitness: true,
    description: 'Activación neuromuscular rápida para irrigar oxígeno al cerebro, despertar el córtex prefrontal y encender creatividad y enfoque.',
    instructions: [
      'Realiza movilidad articular y una serie explosiva controlada (flexiones, sentadillas o jumping jacks).',
      'Registra las series realizadas o enlaza directamente con Mi Entrenador Físico.',
    ],
    fields: [
      {
        id: 'explosion_exercises',
        type: 'checkboxes',
        label: 'Serie de ejercicios de activación',
        options: ['Movilidad articular (cuello, hombros, cadera)', '25 Sentadillas explosivas', '20 Flexiones / Lagartijas', '60 seg Jumping Jacks o Burpees'],
      },
      { id: 'explosion_notes', type: 'text', label: 'Series o registro adicional', placeholder: 'Ej: 3 rondas activas + 5 min movilidad' },
    ],
  },
  {
    id: 'sm_05',
    order: 5,
    key: 'momento_ideacion',
    title: '5. Momento de Ideación (1 Idea Clave del Día)',
    subtitle: 'Una sola idea potente que te mantenga presente durante la jornada',
    icon: 'Zap',
    category: 'focus',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    description: 'Captura una idea estratégica o pensamiento semilla para tenerlo presente en tus decisiones de hoy.',
    instructions: [
      'Permite que surja 1 idea clara y accionable sin sobrecargarte.',
      'Si deseas recordarla durante el día, envíala a tu bandeja de recordatorios.',
    ],
    fields: [
      { id: 'daily_idea', type: 'textarea', label: '1 idea que me mantendrá presente hoy', placeholder: 'Idea clave de negocio, producto, relación o crecimiento...' },
    ],
  },
  {
    id: 'sm_06',
    order: 6,
    key: 'cosa_nueva',
    title: '6. Qué Cosa Nueva Voy a Hacer que Nunca Antes Hacía',
    subtitle: 'Micro-experimento diario de expansión fuera de la zona conocida',
    icon: 'Compass',
    category: 'focus',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Cada día es un experimento estilo Isra García: rompe una rutina automática con una acción inédita.',
    instructions: [
      'Elige algo concreto que nunca antes hayas hecho hoy (conversación, método, límite sano, gesto).',
    ],
    fields: [
      { id: 'new_thing_today', type: 'textarea', label: 'Acción nueva de hoy', placeholder: 'Hoy haré por primera vez...' },
    ],
  },
  {
    id: 'sm_07',
    order: 7,
    key: 'tecnica_priming',
    title: '7. Técnica Priming (3 Cosas)',
    subtitle: 'Agradezco por lo que soy, por lo que tengo y por lo que el universo me ha de dar',
    icon: 'Sparkles',
    category: 'spirit',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 5,
    enabled: true,
    description: 'Calibra tu sistema nervioso en gratitud y apertura: agradezco por lo que soy, por lo que tengo y por lo que ha de venir.',
    instructions: [
      'Inhala profundo elevando los brazos o centrándote en el corazón.',
      'Escribe 3 cosas específicas por las que agradeces hoy.',
    ],
    fields: [
      { id: 'priming_3_things', type: 'bullets', label: '3 Cosas (Por lo que soy, tengo y recibiré)', placeholder: '1. Agradezco por...\n2. Agradezco por...\n3. Agradezco por...' },
    ],
  },
  {
    id: 'sm_08',
    order: 8,
    key: 'iceman',
    title: '8. Ice Man · 3 Objetivos y Acciones + Respiración',
    subtitle: 'Oxigenación consciente y 3 objetivos concretos con sus acciones',
    icon: 'Flame',
    category: 'body',
    defaultMinutes: 4,
    expressMinutes: 2,
    deepMinutes: 6,
    enabled: true,
    description: 'Combina respiración energizante controlada con la definición de los 3 objetivos que persigues y sus acciones inmediatas.',
    instructions: [
      'Realiza respiraciones profundas y rítmicas sin forzar ni marearte.',
      'Define tus 3 objetivos que persigues y las acciones exactas para conquistarlos.',
    ],
    fields: [
      { id: 'iceman_objectives_actions', type: 'pair', label: '3 Objetivos que persigo y Acciones', leftLabel: '3 Objetivos que persigo', rightLabel: 'Acciones concretas para hoy' },
    ],
  },
  {
    id: 'sm_09',
    order: 9,
    key: 'hidratacion_isra',
    title: '9. Hidratación Celular & Luz Natural (Isra García)',
    subtitle: 'Biohack matutino seguro: agua con minerales y luz del amanecer',
    icon: 'Droplets',
    category: 'body',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Práctica segura de alto rendimiento holístico: rehidrata el cuerpo tras el ayuno nocturno y expón tus ojos a luz natural.',
    instructions: [
      'Bebe 400–500 ml de agua fresca o tibia con unas gotas de limón o pizca de sal marina.',
      'Recibe 2 minutos de luz natural para sincronizar cortisol y descanso nocturno.',
    ],
    fields: [
      { id: 'hydration_ok', type: 'checkboxes', label: 'Activación biológica', options: ['500 ml de agua al despertar', 'Luz natural recibida'] },
    ],
  },
  {
    id: 'sm_10',
    order: 10,
    key: 'quietud',
    title: '10. Quietud (Claridad en las Ideas)',
    subtitle: 'Espacio sin estímulos para ordenar pensamientos con lucidez',
    icon: 'Feather',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'quietud mental, mente no sé zen y claridad interior',
    description: 'Detén la prisa por unos minutos. De la quietud nace la verdadera claridad estratégica.',
    instructions: [
      'Permanece en silencio sin teléfono ni música.',
      'Anota la idea o verdad más nítida que emerge cuando bajas el ruido.',
    ],
    fields: [
      { id: 'quietud_clarity', type: 'textarea', label: 'Claridad obtenida en la quietud', placeholder: 'En silencio veo con claridad que...' },
    ],
  },
  {
    id: 'sm_11',
    order: 11,
    key: 'mas_vital_hoy',
    title: '11. Qué es lo Más Vital que Tengo que Hacer Hoy',
    subtitle: 'Tu acción Dominó innegociable del 80/20',
    icon: 'Target',
    category: 'focus',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Si hoy solo pudieras completar una cosa para que el día sea una victoria rotunda, ¿cuál sería?',
    instructions: [
      'Define una sola acción vital, medible y de alto impacto.',
    ],
    fields: [
      { id: 'vital_today', type: 'textarea', label: 'Lo más vital de hoy', placeholder: 'Mi acción #1 innegociable de hoy es...' },
    ],
  },
  {
    id: 'sm_12',
    order: 12,
    key: 'como_enfrentar_dia',
    title: '12. Cómo Voy a Enfrentar Mi Día',
    subtitle: 'Postura mental, actitud y estrategia emocional ante los retos',
    icon: 'Shield',
    category: 'mind',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Diseña de antemano tu actitud frente a imprevistos, reuniones exigentes y presión operativa.',
    instructions: [
      'Elige con qué carácter y energía responderás hoy.',
    ],
    fields: [
      { id: 'face_day_strategy', type: 'textarea', label: 'Así voy a enfrentar mi día', placeholder: 'Con serenidad, firmeza, escucha activa y enfoque...' },
    ],
  },
  {
    id: 'sm_13',
    order: 13,
    key: 'miedos_enfrentar',
    title: '13. Qué Miedos Voy a Enfrentar Hoy',
    subtitle: 'Incomodidad voluntaria: mirar de frente lo que evitas',
    icon: 'Zap',
    category: 'mind',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'El crecimiento ocurre al otro lado de la conversación difícil o la tarea que postergas por miedo.',
    instructions: [
      'Nombra el miedo o incomodidad específica que vas a atravesar hoy.',
    ],
    fields: [
      { id: 'fears_today', type: 'textarea', label: 'Miedos que enfrento hoy', placeholder: 'Hoy atravieso la incomodidad de...' },
    ],
  },
  {
    id: 'sm_14',
    order: 14,
    key: 'cambio_necesito',
    title: '14. Qué Cambio Necesito Hacer',
    subtitle: 'Ajuste honesto de hábito, conducta o prioridad',
    icon: 'Compass',
    category: 'mind',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Detecta qué conducta o hábito necesita corrección hoy para alinearte con tu mejor versión.',
    instructions: [
      'Identifica un cambio real y aplicable desde esta misma mañana.',
    ],
    fields: [
      { id: 'needed_change', type: 'textarea', label: 'Cambio necesario', placeholder: 'Necesito cambiar / dejar de hacer...' },
    ],
  },
  {
    id: 'sm_15',
    order: 15,
    key: 'visualizacion_dia',
    title: '15. Cómo Va a Ser Mi Día — Visualización',
    subtitle: 'Ensayo mental en alta definición de tu jornada victoriosa',
    icon: 'Eye',
    category: 'mind',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    description: 'Visualiza tu día desde la mañana hasta la noche fluyendo con calma, excelencia y paz interior.',
    instructions: [
      'Cierra los ojos 60 segundos e imagina tus bloques clave ejecutándose con éxito.',
      'Escribe la escena principal de tu día.',
    ],
    fields: [
      { id: 'day_visualization', type: 'textarea', label: 'Visualización de mi día', placeholder: 'Me veo ejecutando con calma, terminando mi prioridad #1 y cerrando el día en paz...' },
    ],
  },
  {
    id: 'sm_16',
    order: 16,
    key: 'dejar_escapar',
    title: '16. Qué Voy a Dejar Escapar',
    subtitle: 'Soltar rencores, ruido, perfección estéril y cargas ajenas',
    icon: 'Wind',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Libera voluntariamente aquello que resta energía y no aporta paz ni propósito a tu vida.',
    instructions: [
      'Nombra qué pensamiento, queja o distracción decides soltar hoy.',
    ],
    fields: [
      { id: 'let_go', type: 'textarea', label: 'Hoy dejo ir', placeholder: 'Suelto la necesidad de controlar... / Dejo ir la preocupación por...' },
    ],
  },
  {
    id: 'sm_17',
    order: 17,
    key: 'mirarse_espejo',
    title: '17. Mirarse al Espejo (Sin Juzgarme)',
    subtitle: 'Presencia y aceptación radical frente a ti mismo · ¿Qué pensé?',
    icon: 'Smile',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Mírate a los ojos durante 30–60 segundos sin crítica ni juicio. Observa qué pensamientos surgen.',
    instructions: [
      'Ponte frente al espejo en silencio y respira profundo.',
      'Anota con honestidad qué pensaste al observarte sin juzgarte.',
    ],
    fields: [
      { id: 'mirror_thought', type: 'bullets', label: '¿Qué pensé al mirarme sin juzgarme?', placeholder: '• Pensé que...\n• Observé en mí...' },
    ],
  },
  {
    id: 'sm_18',
    order: 18,
    key: 'hablar_espejo',
    title: '18. Hablar Frente al Espejo (Conversación)',
    subtitle: 'Diálogo honesto y compasivo contigo mismo · ¿Cómo me sentí?',
    icon: 'Heart',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Háblate en voz alta con verdad, respeto y aliento como hablarías con alguien a quien lideras y amas.',
    instructions: [
      'Pronuncia palabras de verdad, aliento o reconciliación frente al espejo.',
      'Registra cómo te sentiste emocionalmente después de hablarte.',
    ],
    fields: [
      { id: 'mirror_feeling', type: 'textarea', label: '¿Cómo me sentí tras la conversación?', placeholder: 'Me sentí más ligero, comprendido, firme...' },
    ],
  },
  {
    id: 'sm_19',
    order: 19,
    key: 'apreciacion_agradecimiento',
    title: '19. Apreciación y Agradecimiento (5 Puntos)',
    subtitle: 'Reconocimiento profundo de bendiciones, personas y oportunidades',
    icon: 'Heart',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    stoicQuote: 'No arruines lo que tienes deseando lo que no tienes; recuerda que lo que tienes ahora fue una vez lo que deseabas. — Epicuro',
    description: 'Anota cinco motivos concretos de apreciación y agradecimiento para anclar tu día en abundancia.',
    instructions: [
      'Escribe 5 detalles reales (personas, salud, fe, oportunidades, aprendizajes).',
    ],
    fields: [
      { id: 'appreciation_list', type: 'bullets', label: '5 motivos de apreciación y agradecimiento', placeholder: '• \n• \n• \n• \n• ' },
    ],
  },
  {
    id: 'sm_20',
    order: 20,
    key: 'ducha_fria',
    title: '20. Ducha de Agua Fría',
    subtitle: 'Temple del carácter, respiración calma y activación circulatoria',
    icon: 'Snowflake',
    category: 'body',
    defaultMinutes: 3,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    stoicQuote: 'Dificultades son las cosas que muestran a los hombres quiénes son. — Epicteto',
    description: 'Finaliza o toma tu ducha con agua fría manteniendo respiración lenta y postura serena (adapta el tiempo de forma segura y progresiva).',
    instructions: [
      'Respira lento antes de abrir el agua fría.',
      'Mantén de 30 a 90 segundos relajando hombros y controlando la exhalación.',
    ],
    fields: [
      { id: 'cold_shower_time', type: 'text', label: 'Tiempo bajo agua fría y sensación', placeholder: '60 segundos · respiración controlada' },
    ],
  },
  {
    id: 'sm_21',
    order: 21,
    key: 'carga_espiritual',
    title: '21. Carga Espiritual',
    subtitle: 'Inhalo por la nariz y exhalo por la boca 2 veces en plenitud',
    icon: 'Sun',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'carga espiritual, fe, energía positiva y paz de Dios',
    description: 'Respira conscientemente (inhalando por la nariz y exhalando por la boca 2 veces) integrando pensamientos, energía y emociones positivas.',
    instructions: [
      'Inhala por la nariz, exhala lento por la boca 2 veces por cada intención.',
      'Visualiza cómo entra paz y claridad y sale toda tensión o negatividad.',
    ],
    fields: [
      {
        id: 'spiritual_charge_checks',
        type: 'checkboxes',
        label: 'Ciclos de Carga Espiritual completados',
        options: [
          'Entran pensamientos positivos y salen negativos (2x)',
          'Entra energía positiva y sale negativa (2x)',
          'Entran emociones positivas y salen negativas (2x)',
        ],
      },
    ],
  },
  {
    id: 'sm_22',
    order: 22,
    key: 'afirmacion_identidad',
    title: '22. Afirmación de la Persona que Soy',
    subtitle: 'Declaración firme de capacidad, poder y propósito',
    icon: 'CheckSquare',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'afirmaciones de identidad, propósito y fortaleza interior',
    description: 'Confirma en voz alta y por escrito quién eres antes de salir al mundo.',
    instructions: [
      'Declara con convicción cada afirmación mirando al frente.',
      'Agrega si deseas una afirmación personal extra del día.',
    ],
    fields: [
      {
        id: 'identity_affirmations',
        type: 'checkboxes',
        label: 'Declaraciones del día',
        options: ['Soy capaz', 'Soy poderoso'],
      },
      { id: 'custom_affirmation', type: 'text', label: 'Afirmación adicional de hoy', placeholder: 'Soy disciplinado, sereno y guiado por mi propósito...' },
    ],
  },
  {
    id: 'sm_23',
    order: 23,
    key: 'mente_no_se_isra',
    title: '23. La Mente "No Sé" & Escritura Libre (Isra García)',
    subtitle: 'Soltar expectativas rígidas para abrazar aprendizaje y gratitud',
    icon: 'BookOpen',
    category: 'focus',
    defaultMinutes: 3,
    expressMinutes: 1,
    deepMinutes: 5,
    enabled: true,
    enableAiDailyMessage: true,
    aiMessageTopic: 'filosofía de Isra García, mente de principiante y alto rendimiento holístico',
    description: 'Práctica segura de Isra García inspirada en el Zen: vaciar certezas rígidas ("no sé") para actuar con curiosidad, humildad y velocidad.',
    instructions: [
      'Escribe 3 líneas sobre qué asumirás hoy con mente abierta y sin prejuicios.',
    ],
    fields: [
      { id: 'isra_no_se', type: 'textarea', label: '¿Dónde aplicaré hoy la mente de principiante ("No Sé")?', placeholder: 'En lugar de dar por sentado..., escucharé y probaré con curiosidad...' },
    ],
  },
];

