import {
  UserProfile,
  PillarScore,
  Habit,
  Goal,
  ISuperMorningRoutine,
  ISuperNightReview,
  Business,
  BusinessProject,
  BusinessTask,
  TeamMember,
  StrategicDecision,
  BookItem,
  WisdomCapsule,
  WorkoutRoutine,
  NutritionHydrationLog,
  PersonalFinances,
  CapturedBrainItem,
  AppNotification,
  AutomationRule,
  MoodEntry,
  SpiritualJournalEntry,
  PersonalRitualLog,
  CustomRitual
} from '../types';

const STORAGE_KEY = 'msc_4_0_app_data_v1';

export interface AppStoreData {
  version: string;
  lastUpdated: string;
  profile: UserProfile;
  pillarScores: PillarScore[];
  habits: Habit[];
  goals: Goal[];
  superMorning: ISuperMorningRoutine;
  superNight: ISuperNightReview;
  morningHistory: ISuperMorningRoutine[];
  nightHistory: ISuperNightReview[];
  businesses: Business[];
  projects: BusinessProject[];
  tasks: BusinessTask[];
  teamMembers: TeamMember[];
  strategicDecisions: StrategicDecision[];
  books: BookItem[];
  wisdomCapsules: WisdomCapsule[];
  workoutRoutines: WorkoutRoutine[];
  nutritionLog: NutritionHydrationLog;
  personalFinances: PersonalFinances;
  capturedItems: CapturedBrainItem[];
  notifications: AppNotification[];
  automations: AutomationRule[];
  moodEntries: MoodEntry[];
  spiritualEntries: SpiritualJournalEntry[];
  personalLogs: PersonalRitualLog[];
  customRituals: CustomRitual[];
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

export const initialStoreData: AppStoreData = {
  version: '4.0.0',
  lastUpdated: new Date().toISOString(),
  profile: {
    name: 'Director Ejecutivo',
    heightCm: 168,
    weightKg: 70,
    calculatedBmi: 24.8,
    fitnessGoal: 'Recomposición corporal, aumento de fuerza funcional y alta energía ejecutiva',
    dailyIntention: 'Liderar con serenidad, ejecutar con precisión y proteger mi energía vital.',
  },
  pillarScores: [
    { key: 'espiritual', label: 'Espiritual', score: 85, trend: 'up', summary: 'Propósito claro, práctica de gratitud matutina constante.', accentColor: '#10b981' },
    { key: 'emocional', label: 'Emocional', score: 78, trend: 'steady', summary: 'Inteligencia emocional activa, gestión de estrés moderada.', accentColor: '#34d399' },
    { key: 'fisico', label: 'Físico', score: 82, trend: 'up', summary: 'Frecuencia de entrenamiento 4x/semana, hidratación 2.5L.', accentColor: '#00f59b' },
    { key: 'intelectual', label: 'Intelectual', score: 90, trend: 'up', summary: '1 libro en lectura activa, 1 cápsula diaria procesada.', accentColor: '#6ee7b7' },
    { key: 'financiero', label: 'Financiero', score: 88, trend: 'up', summary: 'Patrimonio en crecimiento, flujo de caja empresarial sano.', accentColor: '#059669' },
  ],
  habits: [
    { id: 'h1', title: 'Súper Mañana completa (07:00)', pillar: 'espiritual', targetFrequency: 'daily', currentStreak: 14, bestStreak: 28, completedDates: [getTodayDateStr()], isArchived: false },
    { id: 'h2', title: 'Entrenamiento de fuerza / movilidad', pillar: 'fisico', targetFrequency: 'weekdays', currentStreak: 4, bestStreak: 18, completedDates: [getTodayDateStr()], isArchived: false },
    { id: 'h3', title: 'Lectura estratégica 20 min + Cápsula', pillar: 'intelectual', targetFrequency: 'daily', currentStreak: 12, bestStreak: 21, completedDates: [getTodayDateStr()], isArchived: false },
    { id: 'h4', title: 'Revisión de flujo de caja & KPIs', pillar: 'financiero', targetFrequency: 'weekdays', currentStreak: 9, bestStreak: 15, completedDates: [getTodayDateStr()], isArchived: false },
    { id: 'h5', title: 'Súper Noche y gratitud (21:00)', pillar: 'emocional', targetFrequency: 'daily', currentStreak: 8, bestStreak: 20, completedDates: [], isArchived: false },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Escalar ingresos netos de negocios a $50k/mes manteniendo márgenes > 40%',
      horizon: 'annual',
      pillar: 'financiero',
      targetDate: '2026-12-31',
      progressPercent: 68,
      status: 'in_progress',
      milestones: [
        { id: 'm1', text: 'Optimizar estructura de costos operativos', done: true },
        { id: 'm2', text: 'Implementar nuevo servicio de consultoría de alto ticket', done: true },
        { id: 'm3', text: 'Alcanzar 12 clientes recurrentes de retainers', done: false }
      ]
    },
    {
      id: 'g2',
      title: 'Alcanzar 14% de porcentaje graso con masa muscular densa y ágil',
      horizon: 'quarterly',
      pillar: 'fisico',
      targetDate: '2026-06-30',
      progressPercent: 75,
      status: 'in_progress',
      milestones: [
        { id: 'm4', text: 'Mantener 4 sesiones semanales de sobrecarga progresiva', done: true },
        { id: 'm5', text: 'Asegurar 130g de proteína de fuentes limpias al día', done: true },
        { id: 'm6', text: 'Completar 10,000 pasos diarios de base', done: false }
      ]
    },
    {
      id: 'g3',
      title: 'Consolidar sistema de dirección delegada en empresas para liberar 15h semanales',
      horizon: 'annual',
      pillar: 'intelectual',
      targetDate: '2026-09-30',
      progressPercent: 55,
      status: 'in_progress',
      milestones: [
        { id: 'm7', text: 'Nombrar líder operativo en agencia', done: true },
        { id: 'm8', text: 'Documentar SOPs de ventas y entrega', done: false }
      ]
    }
  ],
  superMorning: {
    date: getTodayDateStr(),
    wakeUpTime: '06:30',
    wakeUpMood: 5,
    intention: 'Foco implacable en el cierre de alianzas estratégicas y energía calmada en cada interacción.',
    top3Priorities: [
      'Aprobar propuesta comercial de expansión Q3 con cliente corporativo',
      'Completar sesión de fuerza (Torso + brazos) y 2.5L de agua',
      'Sesión de alineación directiva con el equipo operativo'
    ],
    steps: [
      { id: 'sm1', label: 'Hidratación 500ml + luz natural', durationMinutes: 5, completed: true },
      { id: 'sm2', label: 'Silencio, oración y gratitud consciente', durationMinutes: 10, completed: true },
      { id: 'sm3', label: 'Revisión y fijación de las 3 Prioridades Innegociables', durationMinutes: 10, completed: true },
      { id: 'sm4', label: 'Desayuno pre-entreno (Avena con proteína y fruta)', durationMinutes: 20, completed: true },
      { id: 'sm5', label: 'Mensaje de Activación de Mentalidad', durationMinutes: 5, completed: true }
    ],
    completedAt: '07:20',
  },
  superNight: {
    date: getTodayDateStr(),
    dayRating: 4,
    wins: [
      'Se concretó reunión con nuevo socio comercial',
      'Cumplimiento al 100% de la rutina de entrenamiento físico',
      'Se procesó la cápsula de sabiduría de Ray Dalio'
    ],
    lessons: [
      'No aceptar llamadas no agendadas antes del mediodía para proteger el bloque de trabajo profundo'
    ],
    gratitudeItems: [
      'Por la salud y vitalidad de mi cuerpo',
      'Por un equipo leal y comprometido',
      'Por la claridad de rumbo que me da este sistema'
    ],
    preparedTomorrowPriorities: [
      'Revisar flujo de caja quincenal con contabilidad',
      'Avanzar en el diseño del nuevo producto digital'
    ],
    plannedSleepHours: 7.5,
  },
  morningHistory: [],
  nightHistory: [],
  businesses: [
    {
      id: 'biz_1',
      name: 'Alpha Creative Studio',
      sector: 'Diseño, Software & SaaS',
      logoEmoji: '⚡',
      description: 'Estudio boutique especializado en desarrollo de productos digitales premium y arquitectura web.',
      revenueTarget: 35000,
      actualRevenue: 28400,
      kpis: [
        { name: 'MRR', target: '$35,000', current: '$28,400' },
        { name: 'Margen Neto', target: '45%', current: '42%' },
        { name: 'NPS Clientes', target: '90+', current: '94' }
      ]
    },
    {
      id: 'biz_2',
      name: 'Klaric Strategic Consulting',
      sector: 'Consultoría Empresarial & Formación',
      logoEmoji: '💎',
      description: 'Acompañamiento a fundadores y directivos en escalamiento comercial y liderazgo de alto impacto.',
      revenueTarget: 25000,
      actualRevenue: 19800,
      kpis: [
        { name: 'Ticket Promedio', target: '$5,000', current: '$4,800' },
        { name: 'Retención Anual', target: '80%', current: '85%' }
      ]
    }
  ],
  projects: [
    {
      id: 'proj_1',
      businessId: 'biz_1',
      name: 'Lanzamiento Plataforma SaaS Clientes v2.0',
      description: 'Rediseño completo de la suite de clientes y automatización de onboarding.',
      status: 'in_progress',
      progressPercent: 70,
      deadline: '2026-11-30',
      budget: 12000
    },
    {
      id: 'proj_2',
      businessId: 'biz_1',
      name: 'Reestructuración de Procesos de Entrega',
      description: 'Implementación de metodologías ágiles y control de calidad sin micro-gestión.',
      status: 'planning',
      progressPercent: 35,
      deadline: '2026-12-15',
      budget: 5000
    },
    {
      id: 'proj_3',
      businessId: 'biz_2',
      name: 'Programa Mastermind para Emprendedores',
      description: 'Cohorte exclusiva de 15 fundadores de alto crecimiento.',
      status: 'in_progress',
      progressPercent: 85,
      deadline: '2026-11-20',
      budget: 8000
    }
  ],
  tasks: [
    {
      id: 't1',
      title: 'Aprobar propuesta de contrato para nuevo cliente enterprise',
      scope: 'business',
      businessId: 'biz_1',
      projectId: 'proj_1',
      priority: 'urgent_important',
      status: 'todo',
      isDelegated: false,
      dueDate: getTodayDateStr(),
      estimatedMinutes: 45,
      tags: ['Empresarial', 'Ventas', 'Alta Prioridad']
    },
    {
      id: 't2',
      title: 'Supervisar entrega de maquetas de UI con equipo de diseño',
      scope: 'business',
      businessId: 'biz_1',
      projectId: 'proj_1',
      priority: 'important',
      status: 'in_progress',
      isDelegated: true,
      delegatedToId: 'tm_1',
      dueDate: getTodayDateStr(),
      estimatedMinutes: 30,
      tags: ['Delegado', 'Diseño']
    },
    {
      id: 't3',
      title: 'Auditoría de conciliación bancaria y cuentas por cobrar',
      scope: 'business',
      businessId: 'biz_2',
      priority: 'important',
      status: 'todo',
      isDelegated: true,
      delegatedToId: 'tm_2',
      dueDate: getTodayDateStr(),
      estimatedMinutes: 60,
      tags: ['Finanzas', 'Delegado']
    },
    {
      id: 't4',
      title: 'Completar sesión de fuerza (Torso + hombros) con sobrecarga',
      scope: 'personal',
      pillar: 'fisico',
      priority: 'urgent_important',
      status: 'done',
      isDelegated: false,
      dueDate: getTodayDateStr(),
      estimatedMinutes: 60,
      tags: ['Salud', 'Entrenamiento'],
      completedAt: '08:30'
    },
    {
      id: 't5',
      title: 'Revisión y notas de la cápsula de sabiduría de Ray Dalio',
      scope: 'personal',
      pillar: 'intelectual',
      priority: 'important',
      status: 'done',
      isDelegated: false,
      dueDate: getTodayDateStr(),
      estimatedMinutes: 20,
      tags: ['Lectura', 'Aprendizaje'],
      completedAt: '12:15'
    },
    {
      id: 't6',
      title: 'Llamar a mi mentor para feedback trimestral',
      scope: 'personal',
      pillar: 'emocional',
      priority: 'important',
      status: 'todo',
      isDelegated: false,
      dueDate: getTodayDateStr(),
      estimatedMinutes: 30,
      tags: ['Relaciones', 'Mentoría']
    }
  ],
  teamMembers: [
    { id: 'tm_1', businessId: 'biz_1', name: 'Sofía Valdés', role: 'Directora de Diseño & Producto', email: 'sofia@alphastudio.com', delegatedTasksCount: 4 },
    { id: 'tm_2', businessId: 'biz_2', name: 'Mateo Rincón', role: 'Gerente Financiero & Operaciones', email: 'mateo@klaricconsulting.com', delegatedTasksCount: 3 },
    { id: 'tm_3', businessId: 'biz_1', name: 'Carlos Mendoza', role: 'Líder Técnico de Software', email: 'carlos@alphastudio.com', delegatedTasksCount: 2 }
  ],
  strategicDecisions: [
    {
      id: 'sd_1',
      businessId: 'biz_1',
      date: '2026-11-01',
      title: 'Transición hacia modelo de suscripción / retainer garantizado',
      context: 'La volatilidad de proyectos de precio fijo afectaba la previsibilidad de ingresos.',
      decision: 'Establecer piso mínimo de $4,500/mes para todo nuevo cliente corporativo con compromiso de 6 meses.',
      expectedOutcome: 'Incrementar la previsibilidad de caja en un 40% y reducir tiempo de prospección.',
      quarter: 'Q4 2026'
    }
  ],
  books: [
    {
      id: 'b1',
      title: 'Principios: Vida y Trabajo',
      author: 'Ray Dalio',
      totalPages: 580,
      currentPage: 340,
      status: 'reading',
      category: 'Estrategia & Filosofía',
      coverEmoji: '📘',
      notes: ['La verdad radical y la transparencia radical son pilares del progreso.'],
      quotes: [{ text: 'El dolor más la reflexión es igual al progreso.', page: 'Pág. 42' }],
      takeaways: ['Construir máquinas de toma de decisiones basadas en principios claros.']
    },
    {
      id: 'b2',
      title: 'El Obstáculo es el Camino',
      author: 'Ryan Holiday',
      totalPages: 240,
      currentPage: 240,
      status: 'completed',
      category: 'Estoicismo & Disciplina',
      coverEmoji: '🏛️',
      notes: ['Lo que impide la acción avanza la acción.'],
      quotes: [{ text: 'La mente se adapta y convierte en provecho sus propios obstáculos.', page: 'Pág. 19' }],
      takeaways: ['Ver la dificultad como la materia prima para moldear el carácter.']
    },
    {
      id: 'b3',
      title: 'Hábitos Atómicos',
      author: 'James Clear',
      totalPages: 320,
      currentPage: 320,
      status: 'completed',
      category: 'Productividad & Hábitos',
      coverEmoji: '⚛️',
      notes: ['No te elevas al nivel de tus metas, caes al nivel de tus sistemas.'],
      quotes: [{ text: 'Cada acción que tomas es un voto por el tipo de persona que deseas ser.', page: 'Pág. 38' }],
      takeaways: ['Enfocarse en la identidad antes que en el resultado final.']
    }
  ],
  wisdomCapsules: [
    {
      id: 'wc_1',
      date: getTodayDateStr(),
      bookTitle: 'Principios: Vida y Trabajo',
      author: 'Ray Dalio',
      chapter: 'Capítulo 2: Acepta la realidad y lidia con ella',
      coreIdea: 'El autoengaño es el mayor enemigo del crecimiento; mirar la verdad de frente sin dramatismo acelera la evolución.',
      quote: 'No confundas lo que desearías que fuera verdad con lo que realmente es verdad.',
      pageRef: 'Pág. 68',
      aiInterpretation: 'A menudo los líderes pierden semanas discutiendo con los hechos en lugar de adaptar inmediatamente la estrategia. La aceptación activa es serenidad ejecutiva.',
      personalApplication: 'Acepta tu fatiga actual o fallo reciente sin juzgarte; ajusta tu descanso y sigue adelante.',
      businessApplication: 'Si un proyecto no está dando números, córtalo o pivótalo hoy sin apego emocional.',
      practicalAction: 'Audita hoy 1 aspecto que evitas confrontar en tus operaciones.',
      isFavorite: true
    }
  ],
  workoutRoutines: [
    {
      id: 'wr_1',
      title: 'Torso: Potencia & Hipertrofia Funcional',
      dayOfWeek: 'Lunes / Jueves',
      muscleFocus: 'Pecho, Espalda & Hombros',
      estimatedMinutes: 55,
      completedToday: true,
      exercises: [
        {
          id: 'ex_1',
          name: 'Press de Banca con Mancuernas',
          muscleGroup: 'Pecho',
          targetSets: 4,
          targetReps: '8-10',
          restSeconds: 90,
          instructionNotes: 'Control excéntrico de 3 segundos, rango completo de movimiento sin arquear la zona lumbar.',
          sets: [
            { setNumber: 1, reps: 10, weightKg: 24, completed: true },
            { setNumber: 2, reps: 10, weightKg: 26, completed: true },
            { setNumber: 3, reps: 8, weightKg: 28, completed: true },
            { setNumber: 4, reps: 8, weightKg: 28, completed: true }
          ]
        },
        {
          id: 'ex_2',
          name: 'Remo con Barra o Mancuerna apoyada',
          muscleGroup: 'Espalda',
          targetSets: 4,
          targetReps: '10-12',
          restSeconds: 90,
          instructionNotes: 'Tracción enfocada desde los codos, retracción escapular al final del recorrido.',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 50, completed: true },
            { setNumber: 2, reps: 10, weightKg: 55, completed: true },
            { setNumber: 3, reps: 10, weightKg: 55, completed: true },
            { setNumber: 4, reps: 10, weightKg: 55, completed: true }
          ]
        },
        {
          id: 'ex_3',
          name: 'Press Militar de Hombros',
          muscleGroup: 'Hombros',
          targetSets: 3,
          targetReps: '10-12',
          restSeconds: 60,
          instructionNotes: 'Core firme, cabeza neutra al extender los brazos verticalmente.',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 16, completed: true },
            { setNumber: 2, reps: 10, weightKg: 18, completed: true },
            { setNumber: 3, reps: 10, weightKg: 18, completed: true }
          ]
        }
      ]
    },
    {
      id: 'wr_2',
      title: 'Pierna & Core: Fuerza Atlética',
      dayOfWeek: 'Martes / Viernes',
      muscleFocus: 'Cuádriceps, Isquiotibiales & Glúteos',
      estimatedMinutes: 50,
      completedToday: false,
      exercises: [
        {
          id: 'ex_4',
          name: 'Sentadilla Goblet o con Barra',
          muscleGroup: 'Piernas',
          targetSets: 4,
          targetReps: '10-12',
          restSeconds: 90,
          instructionNotes: 'Profundidad a paralelo, peso centrado en medio pie, activación de glúteos.',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 40, completed: false },
            { setNumber: 2, reps: 10, weightKg: 50, completed: false },
            { setNumber: 3, reps: 10, weightKg: 50, completed: false },
            { setNumber: 4, reps: 10, weightKg: 50, completed: false }
          ]
        },
        {
          id: 'ex_5',
          name: 'Peso Muerto Rumano con Mancuernas',
          muscleGroup: 'Piernas',
          targetSets: 3,
          targetReps: '10-12',
          restSeconds: 75,
          instructionNotes: 'Bisagra de cadera perfecta, tensión máxima en isquiotibiales.',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 20, completed: false },
            { setNumber: 2, reps: 10, weightKg: 22, completed: false },
            { setNumber: 3, reps: 10, weightKg: 22, completed: false }
          ]
        }
      ]
    }
  ],
  nutritionLog: {
    waterGlasses250ml: 7, // 1.75 Litros
    sleepHours: 7.2,
    energyLevel1to10: 9,
    preWorkoutMeal: 'Avena integral con proteína en polvo, plátano y café negro (60-90 min antes)',
    date: getTodayDateStr()
  },
  personalFinances: {
    monthlyIncome: 14500,
    monthlyExpenses: 4800,
    emergencyFund: 28000,
    investmentsTotal: 94000,
    debtsTotal: 6350,
    netWorth: 122000,
    bankAccounts: [
      {
        id: 'ba_1',
        name: 'Banco Pichincha - Cta. Corriente',
        accountType: 'checking',
        currentBalance: 6450,
        currency: 'USD',
        institution: 'Banco Pichincha',
        notes: 'Cuenta principal para gastos corrientes y cobros personales'
      },
      {
        id: 'ba_2',
        name: 'Banco Guayaquil - Fondo de Emergencia',
        accountType: 'savings',
        currentBalance: 28000,
        currency: 'USD',
        institution: 'Banco Guayaquil',
        notes: '6 meses de reserva intacta para tranquilidad absoluta'
      },
      {
        id: 'ba_3',
        name: 'Efectivo / Caja Fuerte',
        accountType: 'cash',
        currentBalance: 850,
        currency: 'USD',
        institution: 'Efectivo en mano',
        notes: 'Gastos imprevistos menores'
      }
    ],
    creditAccounts: [
      {
        id: 'ca_1',
        name: 'Tarjeta Visa Infinite',
        category: 'tarjeta_credito',
        totalLimitOrOriginalAmount: 5000,
        currentBalanceRemaining: 1250,
        dueDate: 'Día 28 de cada mes',
        minimumPayment: 150,
        interestRate: 16.5,
        institution: 'Banco Pichincha',
        payments: [
          {
            id: 'cp_1',
            creditAccountId: 'ca_1',
            date: '2026-11-05',
            amount: 350,
            note: 'Abono quincenal para mantener saldo bajo 30%'
          }
        ]
      },
      {
        id: 'ca_2',
        name: 'Crédito Vehicular / Bancario',
        category: 'credito_bancario',
        totalLimitOrOriginalAmount: 12000,
        currentBalanceRemaining: 4500,
        dueDate: 'Día 15 de cada mes',
        minimumPayment: 450,
        interestRate: 11.2,
        institution: 'Banco Guayaquil',
        payments: [
          {
            id: 'cp_2',
            creditAccountId: 'ca_2',
            date: '2026-11-01',
            amount: 450,
            note: 'Cuota ordinaria noviembre'
          }
        ]
      },
      {
        id: 'ca_3',
        name: 'Cuenta Abierta / Línea Proveedor',
        category: 'cuenta_por_pagar',
        totalLimitOrOriginalAmount: 1000,
        currentBalanceRemaining: 600,
        dueDate: '2026-11-30',
        minimumPayment: 200,
        institution: 'Línea de Crédito Comercial',
        payments: [
          {
            id: 'cp_3',
            creditAccountId: 'ca_3',
            date: '2026-11-04',
            amount: 400,
            note: 'Abono de $400 al saldo inicial de $1,000'
          }
        ]
      }
    ],
    transactions: [
      { id: 'tx_1', type: 'income', category: 'Dividendos / Sueldo Personal', amount: 9500, date: '2026-11-01', description: 'Retiro mensual planificado de Alpha Studio', scope: 'personal', bankAccountId: 'ba_1' },
      { id: 'tx_2', type: 'investment', category: 'Fondo Indexado S&P500', amount: 2500, date: '2026-11-02', description: 'Aporte sistemático mensual DCA', scope: 'personal', bankAccountId: 'ba_1' },
      { id: 'tx_3', type: 'expense', category: 'Vivienda & Servicios', amount: 1800, date: '2026-11-03', description: 'Renta y suministros del hogar', scope: 'personal', bankAccountId: 'ba_1' },
      { id: 'tx_4', type: 'expense', category: 'Salud & Alimentación Limpia', amount: 650, date: '2026-11-05', description: 'Supermercado de alta calidad y nutrición', scope: 'personal', bankAccountId: 'ba_1' },
      { id: 'tx_5', type: 'expense', category: 'Transporte & Movilidad', amount: 220, date: '2026-11-06', description: 'Combustible y mantenimiento', scope: 'personal', bankAccountId: 'ba_1' },
      { id: 'tx_6', type: 'debt_payment', category: 'Pago Tarjeta / Crédito', amount: 350, date: '2026-11-05', description: 'Abono a Tarjeta Visa Infinite', scope: 'personal', bankAccountId: 'ba_1', creditAccountId: 'ca_1' },
      { id: 'tx_7', type: 'debt_payment', category: 'Pago Tarjeta / Crédito', amount: 400, date: '2026-11-04', description: 'Abono a Cuenta Abierta de $1000', scope: 'personal', bankAccountId: 'ba_1', creditAccountId: 'ca_3' }
    ]
  },
  capturedItems: [
    {
      id: 'cap_1',
      title: 'Idea de automatización de reportes semanales con Gemini',
      content: 'Configurar un cron semanal que resuma los avances de los 5 pilares y lo envíe directamente a mi correo o Telegram.',
      type: 'idea',
      pillar: 'intelectual',
      businessId: 'biz_1',
      tags: ['IA', 'Automatización', 'Productividad'],
      createdAt: '2026-11-10T14:30:00Z',
      processed: false
    },
    {
      id: 'cap_2',
      title: 'Frase clave de Diego Dreyfus sobre el compromiso',
      content: '"No necesitas motivación cuando tienes una identidad innegociable. Haz lo que dijiste que harías cuando ya se te pasó la emoción."',
      type: 'quote',
      pillar: 'espiritual',
      tags: ['Mentalidad', 'Identidad'],
      createdAt: '2026-11-09T09:15:00Z',
      processed: true
    }
  ],
  notifications: [
    { id: 'notif_1', title: 'Súper Mañana Completada', message: 'Has iniciado el día con intención y tus 3 prioridades claras.', category: 'personal', timestamp: '07:20', read: true },
    { id: 'notif_2', title: 'Reunión de Estrategia a las 11:30', message: 'Revisión con Sofía Valdés sobre entregables de UI.', category: 'business', timestamp: '11:00', read: false },
    { id: 'notif_3', title: 'Recordatorio de Hidratación', message: 'Llevas 1.75L. Falta 1 vaso para tu meta de 2.0L.', category: 'reminder', timestamp: '13:00', read: false }
  ],
  automations: [
    { id: 'auto_1', name: 'Mensaje de Activación Matutina', description: 'Dispara reflexión estratégica y alinea prioridades a las 07:15', triggerTime: '07:15', type: 'activation', enabled: true },
    { id: 'auto_2', name: 'Alerta de Enfoque Medio Día', description: 'Evalúa avance del 80/20 y desactiva distracciones a las 12:30', triggerTime: '12:30', type: 'focus', enabled: true },
    { id: 'auto_3', name: 'Cápsula Diaria de Sabiduría', description: 'Extrae una perla intelectual de la biblioteca de libros a las 13:00', triggerTime: '13:00', type: 'capsule', enabled: true },
    { id: 'auto_4', name: 'Súper Noche & Rendición de Cuentas', description: 'Abre la evaluación del día y gratitud a las 20:30', triggerTime: '20:30', type: 'reflection', enabled: true }
  ],
  moodEntries: [
    {
      id: 'me_1',
      date: getTodayDateStr(),
      score: 5,
      moodLabel: 'Determinado y Sereno',
      primaryEmotion: 'Determinación',
      triggers: 'Rutina matutina cumplida a tiempo y claridad de prioridades de negocio.',
      reflection: 'Cuando domino la primera hora del día, el resto de la jornada fluye con aplomo.',
      thoughtManagement: 'Reemplacé la prisa con respiración consciente.'
    }
  ],
  spiritualEntries: [
    {
      id: 'se_1',
      date: getTodayDateStr(),
      purposeReflection: 'Construir organizaciones prósperas y conscientes que eleven la calidad de vida de las personas que colaboran en ellas.',
      faithMoments: 'Agradecimiento en silencio por la abundancia y la salud.',
      gratitudeList: [
        'Por la salud y claridad mental',
        'Por la capacidad de crear y liderar',
        'Por la paz en mi hogar y mis relaciones'
      ]
    }
  ],
  personalLogs: [
    {
      id: 'pl_1',
      type: 'brain_dump',
      title: 'Vómito de Pensamientos de Descompresión',
      durationMinutes: 10,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Vacié toda la sobrecarga mental acumulada tras las reuniones de cobranza.',
      rating: 5,
      actionTaken: 'burned'
    },
    {
      id: 'pl_2',
      type: 'space_cleaning',
      title: 'Ritual de Limpieza de mi Cuarto & Escritorio',
      durationMinutes: 15,
      completedAt: new Date(Date.now() - 43200000).toISOString(),
      notes: 'Superficies despejadas, cama impecable y espacio ventilado.',
      rating: 5,
      actionTaken: 'archived'
    }
  ],
  customRituals: [
    {
      id: 'cr_1',
      title: 'Ritual de Limpieza de mi Cuarto',
      description: 'Espacio físico ordenado es mente despejada. 15 minutos de reseteo visual y sensorial.',
      durationMinutes: 15,
      icon: 'Home',
      steps: [
        'Abrir ventanas y permitir entrada de luz natural y aire fresco.',
        'Hacer la cama impecable y despejar completamente las superficies.',
        'Guardar o clasificar la ropa y objetos fuera de lugar.',
        'Toque final: ordenar cables y aroma agradable para sellar la paz.'
      ]
    },
    {
      id: 'cr_2',
      title: 'Vómito de Pensamientos (Brain Dump)',
      description: 'Descarga mental sin filtros. Escribe todo lo que abruma tu mente hasta sentir ligereza.',
      durationMinutes: 10,
      icon: 'Sparkles',
      steps: [
        'Pon tu teléfono en modo no molestar y respira profundo 3 veces.',
        'Escribe en flujo continuo sin corregir ortografía ni censurarte.',
        'Pregúntate: ¿Qué pendiente no me deja estar presente?',
        'Elige: ¿Archivar en notas, convertir en tarea o quemar simbólicamente?'
      ]
    },
    {
      id: 'cr_3',
      title: 'Reset Mental & Recarga de Energía',
      description: 'Pausa cuántica de 3 minutos para soltar el estrés simpático y reconectar con el presente.',
      durationMinutes: 3,
      icon: 'Wind',
      steps: [
        'Cierra los ojos y suelta la tensión en hombros y mandíbula.',
        'Ciclo de respiración profunda: 4 segundos inhalar, 7 sostener, 8 exhalar.',
        'Agradece este instante y retoma tu centro.'
      ]
    }
  ]
};

export class StorageService {
  static load(): AppStoreData {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        this.save(initialStoreData);
        return initialStoreData;
      }
      const parsed = JSON.parse(serialized);
      // Ensure merged with current keys if updated
      const merged: AppStoreData = {
        ...initialStoreData,
        ...parsed,
        personalFinances: {
          ...initialStoreData.personalFinances,
          ...(parsed.personalFinances || {}),
          bankAccounts: parsed.personalFinances?.bankAccounts?.length
            ? parsed.personalFinances.bankAccounts
            : initialStoreData.personalFinances.bankAccounts,
          creditAccounts: parsed.personalFinances?.creditAccounts?.length
            ? parsed.personalFinances.creditAccounts
            : initialStoreData.personalFinances.creditAccounts,
        },
      };
      return merged;
    } catch (err) {
      console.warn('Error loading from localStorage, using initial data:', err);
      return initialStoreData;
    }
  }

  static save(data: AppStoreData): void {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }

  static exportBackup(data: AppStoreData): void {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mi_Segundo_Cerebro_4.0_Backup_${getTodayDateStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async importBackup(file: File): Promise<AppStoreData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.profile || !parsed.pillarScores) {
            throw new Error('Archivo de respaldo no válido para Mi Segundo Cerebro 4.0');
          }
          this.save(parsed);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  }

  static resetToDefault(): AppStoreData {
    this.save(initialStoreData);
    return initialStoreData;
  }
}
