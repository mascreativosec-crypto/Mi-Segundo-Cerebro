export type PillarKey = 'espiritual' | 'emocional' | 'fisico' | 'intelectual' | 'financiero';

export interface UserProfile {
  name: string;
  heightCm: number;
  weightKg: number;
  calculatedBmi: number;
  fitnessGoal: string;
  age?: number;
  dailyIntention?: string;
}

export interface PillarScore {
  key: PillarKey;
  label: string;
  score: number; // 0 - 100
  trend: 'up' | 'down' | 'steady';
  summary: string;
  accentColor: string;
}

// 1. Espiritual
export interface GratitudeEntry {
  id: string;
  date: string;
  text: string;
  tags?: string[];
}

export interface SpiritualJournalEntry {
  id: string;
  date: string;
  purposeReflection: string;
  faithMoments: string;
  gratitudeList: string[];
}

// 2. Emocional
export interface MoodEntry {
  id: string;
  date: string;
  timestamp?: string;
  score: number; // 1-5
  valence_score?: number; // -1.0 a 1.0
  display_label?: string;
  emotion_labels?: string[];
  associations?: string[];
  moodLabel: string;
  primaryEmotion: 'Calma' | 'Gratitud' | 'Entusiasmo' | 'Ansiedad' | 'Fatiga' | 'Frustración' | 'Determinación';
  triggers: string;
  reflection: string;
  thoughtManagement: string;
}

export interface RelationshipNote {
  id: string;
  personName: string;
  relationship: string;
  lastContactDate: string;
  commitments: string;
  notes: string;
}

// 3. Físico (Mi Entrenador)
export interface ExerciseSet {
  setNumber: number;
  setName?: string; // e.g. 'Calentamiento', 'Serie efectiva', 'Sprint 1'
  reps: number;
  weightKg: number;
  distanceKm?: number;
  durationMinutes?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  environment?: 'gym' | 'outdoor';
  metricType?: 'weight_reps' | 'distance_time';
  muscleGroup: 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros' | 'Brazos' | 'Core' | 'Cardio' | 'Exterior';
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  instructionNotes: string;
  sets: ExerciseSet[];
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  environment?: 'gym' | 'outdoor';
  dayOfWeek: string;
  muscleFocus: string;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  completedToday?: boolean;
}

export interface NutritionHydrationLog {
  waterGlasses250ml: number;
  sleepHours: number;
  energyLevel1to10: number;
  preWorkoutMeal: string;
  date: string;
}

export interface FitnessActivityLog {
  id: string;
  date: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
  sourceApp: 'Manual' | 'Apple Health' | 'Google Fit' | 'Strava' | 'Garmin';
  notes?: string;
}

// 4. Intelectual (Biblioteca de Sabiduría)
export interface BookItem {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'to_read' | 'reading' | 'completed';
  category: string;
  coverEmoji?: string;
  notes: string[];
  quotes: { text: string; page?: string }[];
  takeaways: string[];
}

export interface WisdomCapsule {
  id: string;
  date: string;
  bookTitle: string;
  author: string;
  chapter: string;
  coreIdea: string;
  quote: string;
  pageRef: string;
  aiInterpretation: string;
  personalApplication: string;
  businessApplication: string;
  practicalAction: string;
  isFavorite?: boolean;
}

// 5. Financiero (Finanzas Personales)
export interface BankAccount {
  id: string;
  name: string;
  accountType: 'checking' | 'savings' | 'cash' | 'investment';
  currentBalance: number;
  currency: string;
  institution: string;
  notes?: string;
}

export interface CreditPayment {
  id: string;
  creditAccountId: string;
  date: string;
  amount: number;
  sourceAccountId?: string;
  note?: string;
}

export interface CreditAccount {
  id: string;
  name: string;
  category: 'tarjeta_credito' | 'credito_bancario' | 'prestamo_personal' | 'cuenta_por_pagar';
  totalLimitOrOriginalAmount: number;
  currentBalanceRemaining: number;
  dueDate: string;
  minimumPayment?: number;
  interestRate?: number;
  institution?: string;
  payments: CreditPayment[];
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense' | 'investment' | 'debt_payment';
  category: string;
  amount: number;
  date: string;
  description: string;
  scope: 'personal' | 'business';
  businessId?: string;
  bankAccountId?: string;
  creditAccountId?: string;
}

export interface PersonalFinances {
  monthlyIncome: number;
  monthlyExpenses: number;
  emergencyFund: number;
  investmentsTotal: number;
  debtsTotal: number;
  netWorth: number;
  bankAccounts: BankAccount[];
  creditAccounts: CreditAccount[];
  transactions: FinancialTransaction[];
}

// Hábitos y Metas
export interface Habit {
  id: string;
  title: string;
  pillar: PillarKey;
  targetFrequency: 'daily' | 'weekdays' | 'custom';
  currentStreak: number;
  bestStreak: number;
  completedDates: string[]; // YYYY-MM-DD
  isArchived: boolean;
  isMicrohabit?: boolean;
  targetDurationMinutes?: number;
  description?: string;
  icon?: string;
}

export interface Goal {
  id: string;
  title: string;
  horizon: '5_years' | 'annual' | 'quarterly' | 'monthly';
  pillar?: PillarKey;
  businessId?: string;
  projectId?: string;
  targetDate: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'on_hold';
  milestones: { id: string; text: string; done: boolean }[];
}

// Súper Mañana & Súper Noche (Modular Contract)
export interface RoutineStep {
  id: string;
  label: string;
  durationMinutes: number;
  completed: boolean;
}

export interface ISuperMorningRoutine {
  date: string;
  wakeUpTime: string;
  wakeUpMood: number; // 1-5
  intention: string;
  top3Priorities: [string, string, string];
  steps: RoutineStep[];
  completedAt?: string;
  mode?: 'express' | 'balanced' | 'deep' | 'custom';
  customHabits?: any[];
  morningLogs?: any[];
  currentStreak?: number;
  bestStreak?: number;
  responses?: Record<string, Record<string, any>>;
}

export interface FailureSolutionPair {
  id: string;
  failure: string;
  solution: string;
}

export interface VerbalAwarenessCheck {
  id: string;
  label: string;
  checked: boolean;
}

export interface ISuperNightReview {
  date: string;
  dayRating: number; // 1-5
  wins: string[];
  lessons: string[];
  gratitudeItems: string[];
  preparedTomorrowPriorities: string[];
  plannedSleepHours: number;
  completedAt?: string;
  mode?: 'express' | 'balanced' | 'deep' | 'custom';
  customHabits?: any[];
  nightLogs?: any[];
  nightPrepItems?: any[];
  currentStreak?: number;
  bestStreak?: number;
  responses?: Record<string, Record<string, any>>;

  mainVictory?: string;
  magicMoment?: string;
  tikunReflection?: string;
  achievements?: string[];
  missedLessons?: string[];
  failuresAndSolutions?: FailureSolutionPair[];
  verbalAwareness?: VerbalAwarenessCheck[];
  newThingsDone?: string;
  subconsciousRequestText?: string;
  subconsciousRequestCount?: number;
  dayConclusion?: string;
  israNightChecks?: Record<string, boolean>;
  israNightNotes?: string;
}

// Ecosistema Empresarial
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  businessId: string;
  delegatedTasksCount: number;
}

export interface Business {
  id: string;
  name: string;
  sector: string;
  logoEmoji: string;
  description: string;
  revenueTarget: number;
  actualRevenue: number;
  kpis: { name: string; target: string; current: string }[];
}

export interface BusinessProject {
  id: string;
  businessId: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progressPercent: number;
  deadline: string;
  budget?: number;
}

export interface TaskSubtask {
  id: string;
  text: string;
  done: boolean;
}

export interface BusinessTask {
  id: string;
  title: string;
  description?: string;
  resourceLink?: string;
  scope: 'personal' | 'business';
  businessId?: string;
  projectId?: string;
  pillar?: PillarKey;
  priority: 'urgent_important' | 'important' | 'urgent' | 'normal';
  status: 'inbox' | 'todo' | 'in_progress' | 'done';
  isDelegated: boolean;
  delegatedToId?: string;
  dueDate: string;
  estimatedMinutes?: number;
  tags: string[];
  subtasks?: TaskSubtask[];
  remindInInbox?: boolean;
  completedAt?: string;
}

export interface StrategicDecision {
  id: string;
  businessId?: string;
  scopeTags?: ('personal' | 'business')[];
  experimentId?: string;
  date: string;
  title: string;
  context: string;
  decision: string;
  expectedOutcome: string;
  quarter: string;
  keyPoints?: string[];
  transcript?: string;
  source?: 'manual' | 'ai_audio' | 'notellm';
}

// Segundo Cerebro & Captura Rápida
export interface CapturedBrainItem {
  id: string;
  title: string;
  content: string;
  type: 'idea' | 'note' | 'task' | 'quote' | 'document' | 'reflection';
  pillar?: PillarKey;
  businessId?: string;
  tags: string[];
  createdAt: string;
  processed: boolean;
}

// Notificaciones
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'personal' | 'business' | 'reminder' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Schedule Slots & Automation Rule (Centro de Activación)
export interface ScheduleSlot {
  id: string;
  time: string;
  label: string;
  desc: string;
  view: string;
  enabled: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerTime: string;
  type: 'activation' | 'focus' | 'reflection' | 'capsule' | 'reminder';
  targetModule?: string;
  messageTemplate?: string;
  enabled: boolean;
}

// Módulo Personal: Rituales de Descompresión & Claridad
export interface PersonalRitualLog {
  id: string;
  type: 'brain_dump' | 'space_cleaning' | 'mental_reset' | 'custom';
  title: string;
  durationMinutes: number;
  completedAt: string;
  notes?: string;
  rating?: number;
  actionTaken?: 'burned' | 'archived' | 'converted_to_task';
}

export interface CleaningStepItem {
  id: string;
  phase: string;
  title: string;
  description: string;
  tips: string[];
}

export interface RitualField {
  id: string;
  type: 'text' | 'textarea' | 'bullets' | 'checkboxes';
  label: string;
  placeholder?: string;
  options?: string[];
}

export interface RitualPhase {
  id: string;
  title: string;
  subtitle?: string;
  durationMinutes: number;
  instructions: string[];
  fields: RitualField[];
}

export interface CustomRitual {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  icon: string;
  steps: string[];
  phases?: RitualPhase[];
}

export type ReminderOriginModule =
  | 'personal'
  | 'business'
  | 'super_manana'
  | 'super_noche'
  | 'finanzas'
  | 'fisico'
  | 'sabiduria'
  | 'sistema'
  | 'general';

export interface NoteReminderItem {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'super_manana' | 'tarea' | 'frase';
  originModule?: ReminderOriginModule;
  targetView?: string;
  linkedTaskId?: string;
  reminderTime?: string;
  reminderDate?: string;
  showInMiDia: boolean;
  completed: boolean;
  pinned?: boolean;
  source?: 'user' | 'super_morning' | 'system' | 'ai_assistant';
  createdAt: string;
}

// Experimentos Personales (Inspirado en Isra García & Diego Dreyfus)
export type ExperimentFieldType = 'text' | 'number' | 'checkbox' | 'percent_10' | 'timer_minutes';

export interface ExperimentFieldDef {
  id: string;
  label: string;
  type: ExperimentFieldType;
  unit?: string;
  placeholder?: string;
}

export interface ExperimentLogEntry {
  id: string;
  date: string;
  dayNumber: number;
  values: Record<string, string | number | boolean>;
  completedSubtasks?: string[];
  reflection?: string;
}

export interface PersonalExperiment {
  id: string;
  title: string;
  inspiration: string;
  inspirationColor?: 'fuchsia' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  pillar?: PillarKey;
  goalDescription?: string;
  hypothesis: string;
  purpose: string;
  durationDays: number;
  startDate: string;
  status: 'active' | 'completed' | 'paused';
  fields: ExperimentFieldDef[];
  dailySubtasks?: string[];
  logs: ExperimentLogEntry[];
  linkedDecisionIds?: string[];
  aiLastFeedback?: string;
}

