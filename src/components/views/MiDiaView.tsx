import React, { useMemo, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BusinessTask, NoteReminderItem } from '../../types';
import { ORIGIN_MODULE_META, resolveReminderOrigin } from './SecondBrainView';
import {
  Compass,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  Flame,
  Dumbbell,
  Droplets,
  DollarSign,
  BookOpen,
  Building2,
  User,
  CheckSquare,
  Sparkles,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  BellRing,
  Quote,
  Clock,
  Bot,
} from 'lucide-react';

interface MiDiaViewProps {
  data: AppStoreData;
  onNavigate: (view: string) => void;
  onOpenQuickCapture: () => void;
  onOpenQuickPayment: () => void;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

const FALLBACK_MINDSET_QUOTES = [
  'No necesitas motivación cuando tienes una identidad innegociable. Haz lo que dijiste que harías cuando ya se te pasó la emoción.',
  'Hoy no negocias con tu mente ni con las excusas. Tus prioridades mandan sobre cualquier urgencia secundaria.',
  'La claridad sin ejecución es entretenimiento intelectual. Cierra hoy lo que realmente mueve la aguja.',
  'Cada acción que tomas hoy es un voto por el tipo de líder y persona en la que te estás convirtiendo.',
];

export const MiDiaView: React.FC<MiDiaViewProps> = ({
  data,
  onNavigate,
  onOpenQuickCapture,
  onOpenQuickPayment,
  onUpdateData,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [quickReminderText, setQuickReminderText] = useState('');

  const formattedDate = useMemo(() => {
    const str = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 18;
  const currentMoment: 'activacion' | 'enfoque' | 'reflexion' =
    currentHour < 12 ? 'activacion' : currentHour < 18 ? 'enfoque' : 'reflexion';

  // Saved quotes from Second Brain or fallback
  const savedQuotes = useMemo(
    () => data.capturedItems.filter((item) => item.type === 'quote'),
    [data.capturedItems]
  );

  const [mindsetMessage, setMindsetMessage] = useState<string>(() => {
    if (savedQuotes.length > 0) {
      return savedQuotes[0].content.replace(/^"|"$/g, '');
    }
    return FALLBACK_MINDSET_QUOTES[0];
  });
  const [mindsetSource, setMindsetSource] = useState<string>(() =>
    savedQuotes.length > 0 ? savedQuotes[0].title : 'Activación Mentalidad IA Coach'
  );
  const [isRefreshingMindset, setIsRefreshingMindset] = useState(false);

  // 1. Tasks calculations
  const activeTasks = useMemo(
    () => data.tasks.filter((t) => t.status !== 'done'),
    [data.tasks]
  );

  const overdueTasks = useMemo(
    () => activeTasks.filter((t) => Boolean(t.dueDate && t.dueDate < todayStr)),
    [activeTasks, todayStr]
  );

  const todayTasksAll = useMemo(
    () => data.tasks.filter((t) => t.dueDate === todayStr),
    [data.tasks, todayStr]
  );

  const pendingTodayTasks = useMemo(
    () => todayTasksAll.filter((t) => t.status !== 'done'),
    [todayTasksAll]
  );

  const sortTasks = (list: BusinessTask[]) => {
    const priorityRank: Record<BusinessTask['priority'], number> = {
      urgent_important: 4,
      urgent: 3,
      important: 2,
      normal: 1,
    };
    return [...list].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return priorityRank[b.priority] - priorityRank[a.priority];
    });
  };

  const todayBusinessTasks = useMemo(
    () => sortTasks(todayTasksAll.filter((t) => t.scope === 'business')),
    [todayTasksAll]
  );

  const todayPersonalTasks = useMemo(
    () => sortTasks(todayTasksAll.filter((t) => t.scope === 'personal')),
    [todayTasksAll]
  );

  const urgentPendingTasks = activeTasks.filter(
    (t) => t.priority === 'urgent_important' || t.priority === 'urgent'
  );

  // 2. Habits calculations
  const activeHabits = data.habits.filter((h) => !h.isArchived);
  const habitsDoneToday = activeHabits.filter((h) => h.completedDates.includes(todayStr));
  const pendingHabits = activeHabits.filter((h) => !h.completedDates.includes(todayStr));

  // 3. Super Mañana & Super Noche calculations
  const morningTotal = data.superMorning.steps.length;
  const morningDone = data.superMorning.steps.filter((s) => s.completed).length;
  const isMorningComplete = morningTotal > 0 && morningDone === morningTotal;
  const isNightComplete = Boolean(data.superNight.completedAt);

  // 4. Physical & Hydration
  const waterGlasses = data.nutritionLog.waterGlasses250ml || 0;
  const waterLiters = waterGlasses * 0.25;
  const targetWaterLiters = 2.5;
  const workoutCompletedToday = data.workoutRoutines.some((w) => w.completedToday);
  const nextWorkout = data.workoutRoutines.find((w) => !w.completedToday) || data.workoutRoutines[0];

  // 5. Finances
  const totalLiquidity = data.personalFinances.bankAccounts.reduce(
    (sum, acc) => sum + (acc.currentBalance || 0),
    0
  );
  const openDebtsCount = data.personalFinances.creditAccounts.filter(
    (c) => c.currentBalanceRemaining > 0
  ).length;
  const totalDebtRemaining = data.personalFinances.creditAccounts.reduce(
    (sum, c) => sum + (c.currentBalanceRemaining || 0),
    0
  );
  const recentTxToday = data.personalFinances.transactions.filter((tx) => tx.date === todayStr).length;

  // 6. Wisdom & Reading
  const readingBook = data.books.find((b) => b.status === 'reading') || data.books[0];
  const readingProgress =
    readingBook && readingBook.totalPages > 0
      ? Math.round((readingBook.currentPage / readingBook.totalPages) * 100)
      : 0;
  const latestCapsule =
    data.wisdomCapsules.find((c) => c.date === todayStr) || data.wisdomCapsules[0];

  // 7. Personal, Spiritual & Emotional
  const todayMood = data.moodEntries.find((m) => m.date === todayStr);
  const todaySpiritual = data.spiritualEntries.find((s) => s.date === todayStr);

  // 8. Standalone Day Reminders (Notas & Recordatorios + Súper Mañana + Tareas del sistema)
  const dailyReminders = useMemo(() => {
    const list = (data.notesReminders || []).filter((r) => r.showInMiDia && !r.completed);
    return [...list].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [data.notesReminders]);

  const unreadSystemAlerts = useMemo(
    () => data.notifications.filter((n) => !n.read).slice(0, 2),
    [data.notifications]
  );

  // Overall Daily Execution Percentage
  const executionScore = useMemo(() => {
    const checks = [
      isMorningComplete ? 1 : morningTotal > 0 ? morningDone / morningTotal : 0,
      activeHabits.length > 0 ? habitsDoneToday.length / activeHabits.length : 1,
      todayTasksAll.length > 0
        ? todayTasksAll.filter((t) => t.status === 'done').length / todayTasksAll.length
        : 1,
      workoutCompletedToday ? 1 : 0,
      latestCapsule ? 1 : 0,
      todayMood || todaySpiritual ? 1 : 0,
    ];
    return Math.round((checks.reduce((a, b) => a + b, 0) / checks.length) * 100);
  }, [
    isMorningComplete,
    morningTotal,
    morningDone,
    activeHabits.length,
    habitsDoneToday.length,
    todayTasksAll,
    workoutCompletedToday,
    latestCapsule,
    todayMood,
    todaySpiritual,
  ]);

  // Handlers
  const handleToggleTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: BusinessTask['status'] = t.status === 'done' ? 'todo' : 'done';
        return {
          ...t,
          status: nextStatus,
          completedAt:
            nextStatus === 'done'
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
        };
      }),
    }));
  };

  const handleAddWaterGlass = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateData((prev) => ({
      ...prev,
      nutritionLog: {
        ...prev.nutritionLog,
        waterGlasses250ml: (prev.nutritionLog.waterGlasses250ml || 0) + 1,
        date: todayStr,
      },
    }));
  };

  const handleToggleReminder = (reminderId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((r) =>
        r.id === reminderId ? { ...r, completed: !r.completed } : r
      ),
    }));
  };

  const handleQuickAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReminderText.trim()) return;

    const newItem: NoteReminderItem = {
      id: `nr_${Date.now()}`,
      title: quickReminderText.trim(),
      content: '',
      category: 'general',
      originModule: 'personal',
      targetView: 'second_brain',
      reminderDate: todayStr,
      showInMiDia: true,
      completed: false,
      pinned: false,
      source: 'user',
      createdAt: new Date().toISOString(),
    };

    onUpdateData((prev) => ({
      ...prev,
      notesReminders: [newItem, ...(prev.notesReminders || [])],
    }));
    setQuickReminderText('');
  };

  const handleMarkNotificationRead = (notifId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    }));
  };

  const handleRefreshMindsetReminder = async () => {
    if (isRefreshingMindset) return;
    setIsRefreshingMindset(true);
    try {
      const res = await fetch('/api/gemini/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment: currentMoment,
          tone: 'directo y exigente',
          pillarSummary: {
            profile: data.profile,
            todayPriorities: data.superMorning.top3Priorities,
            completedHabits: habitsDoneToday.length,
          },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.message) {
          setMindsetMessage(result.message);
          setMindsetSource(
            currentMoment === 'activacion'
              ? 'Recordatorio Matutino · IA Coach'
              : currentMoment === 'enfoque'
              ? 'Pulso de Enfoque · IA Coach'
              : 'Cierre Estoico · IA Coach'
          );
          setIsRefreshingMindset(false);
          return;
        }
      }
      const nextIdx =
        (FALLBACK_MINDSET_QUOTES.indexOf(mindsetMessage) + 1) % FALLBACK_MINDSET_QUOTES.length;
      setMindsetMessage(FALLBACK_MINDSET_QUOTES[nextIdx]);
      setMindsetSource('Recordatorio de Mentalidad');
    } catch {
      const nextIdx =
        (FALLBACK_MINDSET_QUOTES.indexOf(mindsetMessage) + 1) % FALLBACK_MINDSET_QUOTES.length;
      setMindsetMessage(FALLBACK_MINDSET_QUOTES[nextIdx]);
      setMindsetSource('Recordatorio de Mentalidad');
    } finally {
      setIsRefreshingMindset(false);
    }
  };

  const renderTaskRow = (task: BusinessTask, isOverdue = false) => {
    const assignedMember = task.delegatedToId
      ? data.teamMembers.find((m) => m.id === task.delegatedToId)
      : null;
    const business = task.businessId
      ? data.businesses.find((b) => b.id === task.businessId)
      : null;
    const isDone = task.status === 'done';

    return (
      <div
        key={task.id}
        onClick={() => onNavigate('tasks_general')}
        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 cursor-pointer group hover:bg-slate-100/60 dark:hover:bg-white/[0.03] -mx-2 px-2 rounded-xl transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={(e) => handleToggleTask(e, task.id)}
            className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
            title={isDone ? 'Reabrir tarea' : 'Marcar como completada'}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={`text-xs sm:text-sm font-semibold transition-colors truncate ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400'
              }`}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              <span
                className={
                  task.scope === 'business'
                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                    : 'font-semibold text-emerald-600 dark:text-emerald-400'
                }
              >
                {task.scope === 'business'
                  ? business
                    ? business.name
                    : 'Empresarial'
                  : 'Personal'}
              </span>
              {task.estimatedMinutes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{task.estimatedMinutes} min</span>
                </>
              )}
              {isOverdue && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    Vencida ({task.dueDate})
                  </span>
                </>
              )}
              {!isOverdue && !isDone && task.priority === 'urgent_important' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Urgente y Vital
                  </span>
                </>
              )}
              {assignedMember && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <UserCheck className="w-3 h-3" />
                    {assignedMember.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-50 group-hover:opacity-100 group-hover:text-teal-500 shrink-0 transition-all" />
      </div>
    );
  };

  const filteredOverdue =
    agendaFilter === 'all'
      ? overdueTasks
      : overdueTasks.filter((t) => t.scope === agendaFilter);

  const showBusinessGroup = agendaFilter === 'all' || agendaFilter === 'business';
  const showPersonalGroup = agendaFilter === 'all' || agendaFilter === 'personal';

  return (
    <div className="space-y-6">
      {/* 1. Executive Header */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Compass className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>{formattedDate}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                  {executionScore}% ejecutado hoy
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {pendingTodayTasks.length} {pendingTodayTasks.length === 1 ? 'tarea pendiente hoy' : 'tareas pendientes hoy'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mi Día — Centro de Acción
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                {data.superMorning.intention ||
                  data.profile.dailyIntention ||
                  'Enfócate en lo esencial y ejecuta sin saturación.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenQuickCapture}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-xs rounded-2xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Captura Rápida</span>
            </button>
            <button
              onClick={() => onNavigate('ai_assistant')}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-xs rounded-2xl shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Bot className="w-4 h-4" />
              <span>Asistente IA</span>
            </button>
            <button
              onClick={() => onNavigate('mindset')}
              className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>IA Coach</span>
            </button>
          </div>
        </div>

        {/* Minimal full-width progress track */}
        <div className="mt-5 h-1.5 w-full bg-slate-200/80 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${executionScore}%` }}
          />
        </div>
      </div>

      {/* 2. 4 Essential Daily Indicators (Finanzas Hoy is larger with Quick Payment button; Físico & Agua on the right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Tareas Pendientes */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('tasks_general')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('tasks_general')}
          className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-teal-500/50 dark:hover:border-teal-400/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Tareas Pendientes
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {activeTasks.length} {activeTasks.length === 1 ? 'pendiente' : 'pendientes'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
              {overdueTasks.length > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueTasks.length} vencidas
                </span>
              ) : (
                <span>{urgentPendingTasks.length} urgentes</span>
              )}
              <span aria-hidden="true">·</span>
              <span>{pendingTodayTasks.length} para hoy</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-xs font-semibold text-teal-600 dark:text-teal-400">
            Completar o crear tarea
          </div>
        </div>

        {/* KPI 2: Hábitos Cumplidos */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('habits_goals')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('habits_goals')}
          className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-rose-500/50 dark:hover:border-rose-400/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Hábitos Cumplidos
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {habitsDoneToday.length}/{activeHabits.length} cumplidos
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {pendingHabits.length > 0
                ? `Falta: ${pendingHabits[0].title}`
                : 'Todos los hábitos de hoy completos'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-xs font-semibold text-rose-600 dark:text-rose-400">
            Marcar hábitos y metas
          </div>
        </div>

        {/* KPI 3 (Expanded / Larger): Finanzas Hoy + Registrar pago rápido */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('personal_finances')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('personal_finances')}
          className="sm:col-span-2 lg:col-span-2 p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-400/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Finanzas Hoy
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQuickPayment();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Registrar pago rápido</span>
            </button>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Liquidez bancaria disponible
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                ${totalLiquidity.toLocaleString()}
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums text-left sm:text-right">
              <div className="font-semibold text-rose-600 dark:text-rose-400">
                {openDebtsCount} deudas · ${totalDebtRemaining.toLocaleString()}
              </div>
              <div>{recentTxToday} movimientos hoy</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Abrir panel completo de finanzas</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 4 (Rightmost): Físico & Agua */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('physical_trainer')}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('physical_trainer')}
          className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-lime-500/50 dark:hover:border-lime-400/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime-500 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-lime-500/20">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Físico & Agua
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddWaterGlass}
              className="px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Registrar 1 vaso de agua (250ml)"
            >
              <Droplets className="w-3 h-3" />
              <span>+250ml</span>
            </button>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {waterLiters.toFixed(2)} L{' '}
              <span className="text-xs font-semibold text-slate-400">
                / {targetWaterLiters} L
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {workoutCompletedToday
                ? 'Entrenamiento completado'
                : nextWorkout
                ? `Pendiente: ${nextWorkout.title}`
                : 'Registrar sesión física'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-xs font-semibold text-lime-700 dark:text-lime-400">
            Entreno y sueño ({data.nutritionLog.sleepHours}h)
          </div>
        </div>
      </div>

      {/* 3. Main Balanced Workspace Grid: Left (Súper Mañana/Noche + Agenda de Mi Día) & Right (Recordatorios del Día + Mentalidad IA Coach + Sabiduría) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Compact Súper Mañana / Súper Noche + Agenda de Mi Día */}
        <div className="lg:col-span-7 space-y-6">
          {/* Compact 2-block quick access for Súper Mañana & Súper Noche (no empty space) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('super_morning')}
              className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/50 dark:hover:border-amber-400/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Sun className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      Súper Mañana
                    </span>
                    {isMorningComplete && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                    {morningDone}/{morningTotal} pasos completados
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('super_night')}
              className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] hover:border-purple-500/50 dark:hover:border-purple-400/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Moon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      Súper Noche
                    </span>
                    {isNightComplete && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                    {isNightComplete
                      ? 'Cierre listo'
                      : isEvening
                      ? 'Cierre nocturno pendiente'
                      : `Meta descanso ${data.superNight.plannedSleepHours}h`}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Agenda de Mi Día
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {todayBusinessTasks.length} empresariales y {todayPersonalTasks.length} personales para hoy
                  {overdueTasks.length > 0 ? ` · ${overdueTasks.length} vencidas` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      agendaFilter === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('business')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      agendaFilter === 'business'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaFilter('personal')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      agendaFilter === 'personal'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Personal
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('tasks_general')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>Gestionar</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 1st: Today's Business Tasks */}
            {showBusinessGroup && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Empresariales de Hoy ({todayBusinessTasks.filter((t) => t.status !== 'done').length} pendientes)
                  </h3>
                </div>
                {todayBusinessTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02]">
                    No hay tareas empresariales programadas para hoy.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                    {todayBusinessTasks.map((task) => renderTaskRow(task))}
                  </div>
                )}
              </div>
            )}

            {/* 2nd: Today's Personal Tasks */}
            {showPersonalGroup && (
              <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Personales de Hoy ({todayPersonalTasks.filter((t) => t.status !== 'done').length} pendientes)
                  </h3>
                </div>
                {todayPersonalTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02]">
                    No hay tareas personales programadas para hoy.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                    {todayPersonalTasks.map((task) => renderTaskRow(task))}
                  </div>
                )}
              </div>
            )}

            {/* 3rd (After today's business & personal): Overdue Tasks */}
            {filteredOverdue.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/[0.06] dark:bg-rose-500/[0.08] border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Tareas Vencidas ({filteredOverdue.length})
                  </span>
                  <span className="font-medium text-rose-600/80 dark:text-rose-400/80">
                    Prioriza o reprograma
                  </span>
                </div>
                <div className="divide-y divide-rose-500/15">
                  {filteredOverdue.map((task) => renderTaskRow(task, true))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): 1. Recordatorios del Día (Violet Segundo Cerebro theme) · 2. Mentalidad & IA Coach · 3. Biblioteca de Sabiduría */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Standalone Recordatorios del Día */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/20 shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Recordatorios del Día
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Centralizados por área · Segundo Cerebro
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('second_brain')}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Ver todos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline Quick Add Reminder */}
            <form onSubmit={handleQuickAddReminder} className="flex items-center gap-2">
              <input
                type="text"
                value={quickReminderText}
                onChange={(e) => setQuickReminderText(e.target.value)}
                placeholder="Añadir recordatorio rápido para hoy..."
                className="flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-sm cursor-pointer shrink-0 transition-all active:scale-95"
                title="Guardar recordatorio"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Unified Reminders with Module Origin Tag */}
            <div className="space-y-2">
              {dailyReminders.length === 0 && unreadSystemAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02]">
                  No tienes recordatorios activos. Crea uno arriba o desde cualquier módulo.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                  {dailyReminders.map((rem) => {
                    const originKey = resolveReminderOrigin(rem);
                    const originMeta = ORIGIN_MODULE_META[originKey] || ORIGIN_MODULE_META.general;
                    return (
                      <div
                        key={rem.id}
                        className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 group"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleReminder(rem.id)}
                          className="mt-0.5 text-slate-400 hover:text-violet-500 transition-colors cursor-pointer shrink-0"
                          title="Marcar recordatorio como listo"
                        >
                          <Circle className="w-4 h-4" />
                        </button>

                        <div
                          onClick={() => onNavigate(rem.targetView || 'second_brain')}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                              {rem.title}
                            </span>
                            {rem.reminderTime && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums shrink-0">
                                <Clock className="w-3 h-3" />
                                {rem.reminderTime}
                              </span>
                            )}
                          </div>
                          {rem.content && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                              {rem.content}
                            </p>
                          )}
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border mt-1 ${originMeta.bgClass} ${originMeta.textClass}`}
                          >
                            {originMeta.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* System Alerts / Unread notifications */}
                  {unreadSystemAlerts.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-start justify-between gap-2.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </span>
                          <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0"
                        aria-label="Alerta del sistema"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('second_brain')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-violet-500/15 border border-slate-200/80 dark:border-white/[0.08] hover:border-violet-500/40 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Abrir Segundo Cerebro & Recordatorios</span>
              <ArrowUpRight className="w-4 h-4 text-violet-500" />
            </button>
          </div>

          {/* Card 2: Mentalidad & IA Coach (Clean, without mixed general day reminders) */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Mentalidad & IA Coach
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mindsetSource}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshMindsetReminder}
                disabled={isRefreshingMindset}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-sky-500/15 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title="Generar nueva frase motivacional"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingMindset ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/[0.08] to-indigo-500/[0.06] border border-sky-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                <Quote className="w-3.5 h-3.5" />
                <span>Frase & Enfoque IA</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                "{mindsetMessage}"
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('mindset')}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>Abrir Mentalidad & Asesor IA</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Biblioteca de Sabiduría — Acceso & Extracto de Lectura */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Biblioteca de Sabiduría
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Extracto diario & lectura activa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('wisdom_library')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span>Ir al módulo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {readingBook && (
              <div
                onClick={() => onNavigate('wisdom_library')}
                className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] hover:border-amber-500/40 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {readingBook.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {readingBook.author} · {readingBook.category}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                    {readingProgress}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  Página {readingBook.currentPage} de {readingBook.totalPages}
                </p>
              </div>
            )}

            {latestCapsule ? (
              <div className="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>Extracto de Lectura</span>
                  <span className="tabular-nums font-medium">{latestCapsule.pageRef}</span>
                </div>
                <p className="text-xs sm:text-sm italic text-slate-800 dark:text-slate-100 leading-relaxed">
                  "{latestCapsule.quote}"
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-white">Acción hoy: </span>
                  {latestCapsule.practicalAction}
                </p>
              </div>
            ) : (
              readingBook?.quotes?.[0] && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 space-y-1.5">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Cita destacada · {readingBook.quotes[0].page || 'Lectura'}
                  </p>
                  <p className="text-xs sm:text-sm italic text-slate-800 dark:text-slate-100 leading-relaxed">
                    "{readingBook.quotes[0].text}"
                  </p>
                </div>
              )
            )}

            <button
              type="button"
              onClick={() => onNavigate('wisdom_library')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-amber-500/15 border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/40 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Registrar lectura o cápsula de sabiduría</span>
              <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
