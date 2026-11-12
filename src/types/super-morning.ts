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
  defaultMinutes: number; // balanced (e.g., 30m total)
  expressMinutes: number; // express (15m total)
  deepMinutes: number;    // deep (60m total)
  enabled: boolean;
  stoicQuote?: string;
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
    key: 'despertar',
    title: 'Despertar Temprano con Determinación',
    subtitle: '5:00 AM · El club de los madrugadores',
    icon: 'AlarmClock',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    stoicQuote: 'Al amanecer, cuando te cueste despertar, ten presente: Me levanto para hacer la labor de un ser humano. — Marco Aurelio',
    description: 'Levántate de inmediato sin posponer la alarma. Tu primer acto del día demuestra tu nivel de autogobierno.',
    instructions: [
      'Ponte de pie en menos de 5 segundos.',
      'Abre las cortinas para recibir luz natural y activar tu ritmo circadiano.',
      'Sonríe y agradece la oportunidad de un nuevo día de vida.',
    ],
    fields: [
      { id: 'wake_time', type: 'text', label: 'Hora exacta de despertar', placeholder: '05:00 AM' },
    ],
  },
  {
    id: 'sm_02',
    order: 2,
    key: 'hidratacion',
    title: 'Hidratación Celular Profunda',
    subtitle: '500ml de agua tibia con sal del Himalaya / limón',
    icon: 'Droplets',
    category: 'body',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    description: 'Tu cuerpo se deshidrata tras 7-8 horas de ayuno nocturno. Bebe conscientemente para reactivar tu metabolismo y cognición.',
    instructions: [
      'Bebe a sorbos conscientes un vaso grande de agua (500ml).',
      'Agrega una pizca de sal marina o del Himalaya para recargar electrolitos.',
      'Siente cómo el agua reactiva tus órganos internos.',
    ],
    fields: [
      { id: 'water_ml', type: 'text', label: 'Cantidad consumida (ml)', placeholder: '500 ml' },
    ],
  },
  {
    id: 'sm_03',
    order: 3,
    key: 'vipassana',
    title: 'Meditación Vipassana & Quietud',
    subtitle: 'Atención desnuda a la respiración y sensaciones',
    icon: 'Brain',
    category: 'mind',
    defaultMinutes: 5,
    expressMinutes: 3,
    deepMinutes: 10,
    enabled: true,
    stoicQuote: 'No son las cosas las que atormentan a los hombres, sino los juicios que sobre ellas se forman. — Epicteto',
    description: 'Observa la realidad tal como es, sin juzgar, apegarte ni rechazar ninguna sensación física o mental.',
    instructions: [
      'Adopta una postura erguida con la columna recta y hombros relajados.',
      'Enfoca toda tu atención en la entrada y salida de aire en el labio superior y las fosas nasales.',
      'Cuando surja un pensamiento, reconócelo con calma y vuelve con dulzura a la respiración.',
    ],
    fields: [
      { id: 'vipassana_insight', type: 'textarea', label: '¿Qué estado mental observaste al sentarte en silencio?', placeholder: 'Calma, agitación sutil, claridad...' },
    ],
  },
  {
    id: 'sm_04',
    order: 4,
    key: 'movilidad',
    title: 'Movilidad Articular & Activación Física',
    subtitle: 'Despierta fascias, columna y flexibilidad',
    icon: 'Activity',
    category: 'body',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 7,
    enabled: true,
    description: 'Moviliza suavemente cuello, hombros, caderas y columna (Gato-Camello, Saludo al Sol o estiramientos fluidos).',
    instructions: [
      'Círculos articulares lentos en articulaciones principales.',
      'Estiramiento de la cadena posterior y apertura torácica.',
      'Conecta cada movimiento con una inhalación y exhalación profunda.',
    ],
    fields: [
      {
        id: 'exercises_done',
        type: 'checkboxes',
        label: 'Movimientos realizados',
        options: ['Rotación cervical y hombros', 'Gato-Camello (columna)', 'Apertura de cadera profunda', 'Saludo al Sol / Sentadillas'],
      },
    ],
  },
  {
    id: 'sm_05',
    order: 5,
    key: 'dicotomia',
    title: 'Dicotomía de Control Estoica',
    subtitle: 'Separación lúcida entre lo que depende de mí y lo que no',
    icon: 'Scale',
    category: 'mind',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 5,
    enabled: true,
    stoicQuote: 'De las cosas que existen, unas dependen de nosotros y otras no. — Epicteto (Enquiridión)',
    description: 'Filtra las batallas del día. Entrega el 100% a lo que puedes controlar y suelta con serenidad el resto.',
    instructions: [
      'Identifica los retos, llamadas o proyectos más desafiantes de hoy.',
      'Distingue qué parte depende enteramente de tu actitud, esfuerzo y honestidad.',
      'Acepta con ecuanimidad las variables externas fuera de tu control.',
    ],
    fields: [
      {
        id: 'control_pair',
        type: 'pair',
        label: 'Separación Estratégica de Control',
        leftLabel: 'Bajo mi control (Mi actitud, esfuerzo, enfoque)',
        rightLabel: 'Fuera de mi control (Respuestas ajenas, resultados, clima)',
      },
    ],
  },
  {
    id: 'sm_06',
    order: 6,
    key: 'iceman',
    title: 'Respiración Ice Man (Método Wim Hof)',
    subtitle: 'Alcalinización, oxigenación y retención consciente',
    icon: 'Flame',
    category: 'body',
    defaultMinutes: 4,
    expressMinutes: 2,
    deepMinutes: 8,
    enabled: true,
    description: 'Técnica de respiración controlada que satura tus células de oxígeno, reduce inflamación y eleva la energía vital.',
    instructions: [
      'Inhala profundo llenando vientre y pecho; exhala relajando sin forzar (30 repeticiones rítmicas).',
      'En la última exhalación, vacía el aire y retén la respiración el mayor tiempo confortable.',
      'Al sentir el impulso, inhala al 100% y retén durante 15 segundos con suavidad.',
    ],
    fields: [
      { id: 'retention_time', type: 'text', label: 'Tiempo de retención aproximado (ej: 1m 30s)', placeholder: '1:30 min' },
      { id: 'rounds', type: 'text', label: 'Rondas completadas', placeholder: '2 rondas' },
    ],
  },
  {
    id: 'sm_07',
    order: 7,
    key: 'ducha_fria',
    title: 'Ducha Fría & Resiliencia Térmica',
    subtitle: 'Disparo de dopamina y temple de carácter',
    icon: 'Snowflake',
    category: 'body',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    stoicQuote: 'Dificultades son las cosas que muestran a los hombres quiénes son. — Epicteto',
    description: 'Finaliza o realiza tu baño con agua fría. Conquista la resistencia mental inicial y entrena el control de la respiración ante el choque.',
    instructions: [
      'Respira lento y profundo antes de entrar.',
      'Empieza mojando extremidades y luego el pecho y la espalda.',
      'Permanece mínimo 60-90 segundos con respiración serena.',
    ],
    fields: [
      { id: 'cold_duration', type: 'text', label: 'Segundos bajo agua fría', placeholder: '90 segundos' },
    ],
  },
  {
    id: 'sm_08',
    order: 8,
    key: 'priming',
    title: 'Priming & Visualización de la Victoria',
    subtitle: 'Condicionamiento neuromuscular del éxito',
    icon: 'Sparkles',
    category: 'mind',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 5,
    enabled: true,
    description: 'Visualiza con máximo detalle sensorial tus reuniones, llamadas y ejecuciones del día ya concluidas de forma magistral.',
    instructions: [
      'Cierra los ojos e imagina tu postura al resolver el problema más difícil de hoy.',
      'Siente la tranquilidad y firmeza en tu voz durante tus compromisos.',
      'Conecta con la versión más elevada de ti mismo.',
    ],
    fields: [
      { id: 'victory_scene', type: 'textarea', label: 'Describe la escena de victoria de tu día', placeholder: 'Cierre de negociación con firmeza y calma, ejecución sin distracciones...' },
    ],
  },
  {
    id: 'sm_09',
    order: 9,
    key: 'gratitud',
    title: 'Tres Agradecimientos Específicos',
    subtitle: 'Pilar Espiritual · Rebalancear el sesgo de negatividad',
    icon: 'Heart',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 4,
    enabled: true,
    stoicQuote: 'No arruines lo que tienes deseando lo que no tienes; recuerda que lo que tienes ahora fue una vez una de las cosas que sólo deseabas. — Epicuro',
    description: 'La gratitud no es un cliché; es la medicina neuroquímica contra la ansiedad y la queja.',
    instructions: [
      'Escribe tres motivos reales y específicos (evita respuestas genéricas).',
      'Incluye una persona, una oportunidad y un detalle sutil.',
      'Siente genuinamente el agradecimiento en tu pecho.',
    ],
    fields: [
      {
        id: 'gratitude_bullets',
        type: 'bullets',
        label: '3 Motivos de profunda gratitud',
        placeholder: '1. La salud y energía de mis hijos\n2. La lucidez para liderar mis empresas\n3. Este café caliente y mi cuerpo fuerte',
      },
    ],
  },
  {
    id: 'sm_10',
    order: 10,
    key: 'lectura',
    title: 'Lectura Profunda & Nutrición Intelectual',
    subtitle: 'Pilar Intelectual · Diálogo con las mejores mentes',
    icon: 'BookOpen',
    category: 'focus',
    defaultMinutes: 5,
    expressMinutes: 2,
    deepMinutes: 15,
    enabled: true,
    description: 'Dedica unos minutos a nutrir tu mente con filosofía, estrategia o ciencia antes de que el mundo intente programar tu cerebro con notificaciones.',
    instructions: [
      'Lee sin interrupciones un libro de impacto.',
      'Subraya o extrae un concepto aplicable para el día.',
      'Vincúlalo con una decisión personal o de negocios.',
    ],
    fields: [
      { id: 'book_title', type: 'text', label: 'Libro o texto leído', placeholder: 'Meditaciones de Marco Aurelio' },
      { id: 'key_takeaway', type: 'textarea', label: 'Idea o lección principal aprendida', placeholder: 'La mejor venganza es no ser como mi adversario...' },
    ],
  },
  {
    id: 'sm_11',
    order: 11,
    key: 'tarea_domino',
    title: 'Definición de la Tarea Dominó (The One Thing)',
    subtitle: 'La única acción que hace todo lo demás más fácil o innecesario',
    icon: 'Target',
    category: 'focus',
    defaultMinutes: 3,
    expressMinutes: 2,
    deepMinutes: 5,
    enabled: true,
    description: '¿Cuál es la acción de máxima palanca hoy? Aquella que si la ejecutas con éxito, tu día habrá valido la pena.',
    instructions: [
      'Identifica la tarea más retadora que sueles postergar.',
      'Asígnale tu bloque de máximo enfoque matutino.',
      'Comprométete a no revisar correos ni redes hasta completarla.',
    ],
    fields: [
      { id: 'domino_task', type: 'text', label: 'Mi Tarea Dominó de Hoy', placeholder: 'Presentar propuesta estratégica de expansión a socios...' },
      { id: 'execution_time', type: 'text', label: 'Horario reservado para ejecutarla', placeholder: '09:00 AM - 11:00 AM' },
    ],
  },
  {
    id: 'sm_12',
    order: 12,
    key: 'identidad',
    title: 'Declaración de Identidad & Valores',
    subtitle: '¿Quién elijo ser durante las próximas 16 horas?',
    icon: 'Shield',
    category: 'spirit',
    defaultMinutes: 2,
    expressMinutes: 1,
    deepMinutes: 3,
    enabled: true,
    stoicQuote: 'No pierdas más tiempo discutiendo cómo debe ser un hombre bueno. Sé uno. — Marco Aurelio',
    description: 'Sella tu compromiso de integridad, presencia y excelencia.',
    instructions: [
      'Declara en presente tu compromiso con tus 5 pilares.',
      'Recuerda que tus acciones hablan más fuerte que tus palabras.',
    ],
    fields: [
      { id: 'identity_declaration', type: 'textarea', label: 'Mi declaración de hoy', placeholder: 'Soy un líder disciplinado, compasivo y enfocado. Actúo con rigor y mantengo la paz interior ante cualquier tormenta.' },
    ],
  },
  {
    id: 'sm_13',
    order: 13,
    key: 'bendicion_salida',
    title: 'Bendición de Salida & Activación Total',
    subtitle: 'Transición hacia la arena de la vida',
    icon: 'Sun',
    category: 'spirit',
    defaultMinutes: 1,
    expressMinutes: 1,
    deepMinutes: 2,
    enabled: true,
    description: 'Inhala profundamente, exhala toda duda y sal a conquistar tu jornada con serenidad invencible.',
    instructions: [
      'Tres respiraciones profundas conectando con tu centro.',
      'Siente la fuerza en tu postura y mirada.',
      '¡Es hora de ejecutar!',
    ],
    fields: [],
  },
];
