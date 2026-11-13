import React, { useState, useMemo } from 'react';
import { AppStoreData } from '../../services/storage';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Calendar,
  ChevronRight,
  FileText,
  Target,
  AlertTriangle,
  RefreshCw,
  Dumbbell,
  DollarSign,
  Brain,
  Heart,
  Building2,
  Send,
} from 'lucide-react';
import { MobileCollapsibleCard } from '../shared/MobileCollapsibleCard';

interface PersonalDashboardViewProps {
  data: AppStoreData;
  onNavigate: (view: string) => void;
  onOpenQuickCapture: () => void;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

const getIsoWeekNumber = (date: Date): number => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const PersonalDashboardView: React.FC<PersonalDashboardViewProps> = ({
  data,
  onNavigate,
}) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentWeek = getIsoWeekNumber(now);

  // --- Real Metrics Calculation from AppStoreData ---
  const metrics = useMemo(() => {
    const activeHabits = data.habits.filter((h) => !h.isArchived);
    const completedHabitsToday = activeHabits.filter((h) =>
      h.completedDates.includes(todayStr)
    ).length;
    const habitRate =
      activeHabits.length > 0 ? Math.round((completedHabitsToday / activeHabits.length) * 100) : 0;

    const todayTasks = data.tasks.filter((t) => t.dueDate === todayStr);
    const overdueTasks = data.tasks.filter((t) => t.dueDate < todayStr && t.status !== 'done');
    const doneTodayTasks = todayTasks.filter((t) => t.status === 'done').length;
    const allOpenTasks = data.tasks.filter((t) => t.status !== 'done');
    const taskTodayRate =
      todayTasks.length > 0 ? Math.round((doneTodayTasks / todayTasks.length) * 100) : 100;
    const overduePenalty = Math.min(overdueTasks.length * 10, 45);
    const executionScore = Math.max(
      0,
      Math.min(100, Math.round(habitRate * 0.55 + taskTodayRate * 0.45 - overduePenalty * 0.5))
    );

    // Physical Score: BMI + Water + Steps + Sets completed
    const bmi = data.profile.calculatedBmi || 22;
    const bmiScore = bmi >= 18.5 && bmi <= 24.9 ? 100 : bmi < 30 ? 72 : 48;
    const waterGlasses = data.nutritionLog.waterGlasses250ml || 0;
    const waterPct = Math.min(100, Math.round((waterGlasses / 10) * 100));
    const todaySteps = (data.fitnessLogs || [])
      .filter((l) => l.date === todayStr)
      .reduce((acc, l) => acc + l.steps, 0);
    const stepsPct = Math.min(100, Math.round((todaySteps / 10000) * 100));
    const totalSets = data.workoutRoutines.reduce(
      (acc, r) => acc + r.exercises.reduce((eAcc, ex) => eAcc + ex.sets.length, 0),
      0
    );
    const doneSets = data.workoutRoutines.reduce(
      (acc, r) =>
        acc +
        r.exercises.reduce(
          (eAcc, ex) => eAcc + ex.sets.filter((s) => s.completed).length,
          0
        ),
      0
    );
    const workoutPct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 50;
    const physicalScore = Math.round(
      bmiScore * 0.35 + waterPct * 0.2 + stepsPct * 0.25 + workoutPct * 0.2
    );

    // Financial Score: Liquidity + Emergency Fund + Debt Ratio
    const totalBankLiquidity = data.personalFinances.bankAccounts.reduce(
      (acc, a) => acc + a.currentBalance,
      0
    );
    const totalDebt = data.personalFinances.creditAccounts.reduce(
      (acc, c) => acc + c.currentBalanceRemaining,
      0
    );
    const emergencyFund = data.personalFinances.emergencyFund || 0;
    const debtHealth =
      totalBankLiquidity > 0
        ? Math.max(20, Math.min(100, Math.round((1 - totalDebt / (totalBankLiquidity + 1)) * 100)))
        : 40;
    const emergencyHealth = Math.min(100, Math.round((emergencyFund / 15000) * 100));
    const financialScore = Math.round(debtHealth * 0.6 + emergencyHealth * 0.4);

    // Intellectual Score: Reading progress + Wisdom capsules + Second Brain
    const readingBooks = data.books.filter((b) => b.totalPages > 0);
    const avgBookProgress =
      readingBooks.length > 0
        ? Math.round(
            readingBooks.reduce((acc, b) => acc + (b.currentPage / b.totalPages) * 100, 0) /
              readingBooks.length
          )
        : 0;
    const capsulesScore = Math.min(100, data.wisdomCapsules.length * 25 + 25);
    const intellectualScore = Math.round(avgBookProgress * 0.5 + capsulesScore * 0.5);

    // Business & OKR Score: Goals avg progress + Business revenue ratio + Kanban flow
    const avgGoalProgress =
      data.goals.length > 0
        ? Math.round(
            data.goals.reduce((acc, g) => acc + g.progressPercent, 0) / data.goals.length
          )
        : 0;
    const bizRevenueRatio =
      data.businesses.length > 0
        ? Math.min(
            100,
            Math.round(
              (data.businesses.reduce((acc, b) => acc + b.actualRevenue, 0) /
                Math.max(
                  1,
                  data.businesses.reduce((acc, b) => acc + b.revenueTarget, 0)
                )) *
                100
            )
          )
        : 0;
    const businessScore = Math.round(avgGoalProgress * 0.6 + bizRevenueRatio * 0.4);

    // Spiritual & Emotional Score
    const morningDone =
      Boolean(data.superMorning.completedAt) ||
      data.superMorning.steps.every((s) => s.completed);
    const nightDone =
      Boolean(data.superNight.completedAt) ||
      (data.superNight.wins && data.superNight.wins.length > 0 && data.superNight.date === todayStr);
    const latestMood = data.moodEntries[0]?.score ?? 4;
    const spiritualScore = Math.min(
      100,
      Math.round((morningDone ? 45 : 20) + (data.spiritualEntries.length > 0 ? 35 : 10) + habitRate * 0.2)
    );
    const emotionalScore = Math.min(
      100,
      Math.round(latestMood * 15 + (nightDone ? 25 : 5))
    );

    const growthDimensions = [
      {
        id: 'exec',
        label: 'Ejecución & Hábitos',
        score: executionScore,
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        targetView: 'tasks_general',
        detail: `${completedHabitsToday}/${activeHabits.length} hábitos hoy · ${overdueTasks.length} vencidas`,
      },
      {
        id: 'fin',
        label: 'Disciplina Financiera',
        score: financialScore,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        targetView: 'personal_finances',
        detail: `Liquidez $${totalBankLiquidity.toLocaleString()} · Deudas $${totalDebt.toLocaleString()}`,
      },
      {
        id: 'phys',
        label: 'Salud & Físico',
        score: physicalScore,
        color: 'bg-lime-500',
        textColor: 'text-lime-600 dark:text-lime-400',
        targetView: 'physical_trainer',
        detail: `IMC ${bmi} · ${todaySteps.toLocaleString()} pasos · ${waterGlasses} vasos`,
      },
      {
        id: 'intel',
        label: 'Intelecto & Sabiduría',
        score: intellectualScore,
        color: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
        targetView: 'wisdom_library',
        detail: `${data.wisdomCapsules.length} cápsulas · ${avgBookProgress}% lectura promedio`,
      },
      {
        id: 'biz',
        label: 'Empresarial & OKRs',
        score: businessScore,
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        targetView: 'business',
        detail: `${avgGoalProgress}% metas · ${allOpenTasks.filter((t) => t.scope === 'business').length} tareas activas`,
      },
    ];

    const totalGrowthScore = growthDimensions.reduce((acc, d) => acc + d.score, 0);
    const weakestDimension = [...growthDimensions].sort((a, b) => a.score - b.score)[0];

    // Real Focus Index Today (0 - 500 pts)
    const morningComponent = morningDone ? 100 : Math.round((data.superMorning.steps.filter((s) => s.completed).length / Math.max(1, data.superMorning.steps.length)) * 100);
    const focusRatioPct = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          morningComponent * 0.25 +
            taskTodayRate * 0.3 +
            habitRate * 0.25 +
            Math.round((waterPct + stepsPct) / 2) * 0.2 -
            overduePenalty * 0.4
        )
      )
    );
    const focusPoints500 = Math.round(focusRatioPct * 5);
    const focusLabel =
      focusRatioPct >= 75 ? 'Excelente' : focusRatioPct >= 50 ? 'En Camino' : 'Requiere Foco';

    const realPillars = [
      {
        key: 'espiritual' as const,
        label: 'Espiritual',
        score: spiritualScore,
        summary: morningDone
          ? 'Súper Mañana activada y práctica de gratitud registrada.'
          : 'Pendiente completar Súper Mañana o reflexión espiritual de hoy.',
        view: 'spiritual',
      },
      {
        key: 'emocional' as const,
        label: 'Emocional',
        score: emotionalScore,
        summary: nightDone
          ? 'Cierre consciente y bitácora emocional equilibrada.'
          : `Estado de ánimo ${latestMood}/5 · Falta cierre de Súper Noche.`,
        view: 'emotional',
      },
      {
        key: 'fisico' as const,
        label: 'Físico',
        score: physicalScore,
        summary: `IMC ${bmi} · ${todaySteps.toLocaleString()} pasos hoy · ${(waterGlasses * 0.25).toFixed(2)}L agua.`,
        view: 'physical_trainer',
      },
      {
        key: 'intelectual' as const,
        label: 'Intelectual',
        score: intellectualScore,
        summary: `${data.books.length} libros en biblioteca · ${data.wisdomCapsules.length} cápsulas de sabiduría.`,
        view: 'wisdom_library',
      },
      {
        key: 'financiero' as const,
        label: 'Financiero',
        score: financialScore,
        summary: `Liquidez $${totalBankLiquidity.toLocaleString()} · Deudas $${totalDebt.toLocaleString()}.`,
        view: 'personal_finances',
      },
    ];

    // Real diagnostic message when AI hasn't been manually refreshed
    const bottlenecks: string[] = [];
    if (overdueTasks.length > 0) {
      bottlenecks.push(`tienes ${overdueTasks.length} tarea(s) vencida(s) por resolver`);
    }
    if (bmi >= 25) {
      bottlenecks.push(`tu IMC (${bmi}) marca alerta de sobrepeso`);
    }
    if (waterGlasses < 6) {
      bottlenecks.push(`tu hidratación está baja (${waterGlasses}/10 vasos)`);
    }
    if (completedHabitsToday < activeHabits.length) {
      bottlenecks.push(
        `faltan ${activeHabits.length - completedHabitsToday} hábitos diarios por cerrar`
      );
    }

    const defaultDiagnostic =
      bottlenecks.length > 0
        ? `Atención prioritaria: ${bottlenecks.join(', ')}. Tu área más baja hoy es "${weakestDimension.label}" (${weakestDimension.score}%). Enfoca tu próximo bloque en desbloquearla.`
        : `Ejecución sólida en todas tus áreas. Mantén tu ritmo en "${weakestDimension.label}" (${weakestDimension.score}%) para elevar tu promedio global.`;

    return {
      growthDimensions,
      totalGrowthScore,
      weakestDimension,
      focusRatioPct,
      focusPoints500,
      focusLabel,
      morningComponent,
      taskTodayRate,
      habitRate,
      waterPct,
      overdueTasksCount: overdueTasks.length,
      realPillars,
      defaultDiagnostic,
      avgGoalProgress,
    };
  }, [data, todayStr]);

  const handleRefreshAiCopilot = async (customQuestion?: string) => {
    setIsLoadingAi(true);
    const cleanQuestion = (customQuestion ?? aiPromptInput).trim();
    const promptToSend = cleanQuestion
      ? `Estado real del usuario: Score Global ${metrics.totalGrowthScore}/500, Índice de Enfoque Hoy ${metrics.focusRatioPct}%, Área más débil: ${metrics.weakestDimension.label} (${metrics.weakestDimension.score}% - ${metrics.weakestDimension.detail}), Tareas vencidas: ${metrics.overdueTasksCount}, IMC: ${data.profile.calculatedBmi}.\n\nPregunta directa del usuario: ${cleanQuestion}\nResponde con criterio ejecutivo en máximo 70 palabras.`
      : `Analiza mi estado real actual: Score Global ${metrics.totalGrowthScore}/500, Índice de Enfoque Hoy ${metrics.focusRatioPct}%, Área más débil: ${metrics.weakestDimension.label} (${metrics.weakestDimension.score}% - ${metrics.weakestDimension.detail}), Tareas vencidas: ${metrics.overdueTasksCount}, IMC: ${data.profile.calculatedBmi}. Dame un consejo ejecutivo directo de máximo 50 palabras señalando qué corregir hoy.`;

    try {
      const resp = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          pillarData: metrics.realPillars,
        }),
      });
      const result = await resp.json();
      if (result.response) {
        setAiAdvice(result.response);
      }
      if (cleanQuestion) setAiPromptInput('');
    } catch {
      setAiAdvice(metrics.defaultDiagnostic);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const enabledSlots = (data.scheduleSlots || []).filter((s) => s.enabled);

  // Arc stroke calculation (arc length = 204)
  const dashOffset = Math.round(204 - (204 * metrics.focusRatioPct) / 100);

  return (
    <div className="space-y-6">
      {/* 1. Top Header + Wide Interactive AI Co-pilot Estratégico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-stretch">
        <div className="lg:col-span-5 p-4 lg:p-6 rounded-2xl lg:rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl flex flex-col justify-between gap-3 lg:gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                5 Pilares de Crecimiento
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Métricas reales · {data.profile.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 lg:pt-3 border-t border-slate-200/70 dark:border-white/[0.06]">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Avance Promedio Metas
              </span>
              <span className="text-base lg:text-lg font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                {metrics.avgGoalProgress}% acumulado
              </span>
            </div>

            <button
              onClick={() => onNavigate('mi_dia')}
              className="px-3.5 py-2 lg:px-4 lg:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <span>Ir a Mi Día</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wide Interactive AI Co-pilot Estratégico */}
        <div className="lg:col-span-7">
          <MobileCollapsibleCard
            title="AI Co-pilot Estratégico"
            summary={`Score ${metrics.totalGrowthScore}/500 · Diagnóstico y consulta IA`}
            icon={
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
            }
            defaultOpenMobile={false}
          >
            <div className="h-full p-4 lg:p-6 rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-cyan-500/25 lg:shadow-lg lg:dark:shadow-2xl flex flex-col justify-between gap-3.5 lg:gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Co-pilot Estratégico
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRefreshAiCopilot()}
                    disabled={isLoadingAi}
                    className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                    <span>{isLoadingAi ? 'Analizando...' : 'Diagnóstico IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('ai_assistant')}
                    className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Abrir Asistente
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-100/70 dark:bg-black/30 p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
                {aiAdvice || metrics.defaultDiagnostic}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPromptInput.trim()) handleRefreshAiCopilot(aiPromptInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="Escríbele al Co-pilot (ej: ¿Cómo subo mi pilar físico esta semana?)"
                  className="flex-1 bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isLoadingAi || !aiPromptInput.trim()}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Consultar</span>
                </button>
              </form>
            </div>
          </MobileCollapsibleCard>
        </div>
      </div>

      {/* 2. Second Block (Full Width): Estado Real de los 5 Pilares */}
      <div className="space-y-3 lg:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Estado Real de los 5 Pilares
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              Calculado automáticamente según tus registros en cada área. Haz clic para actuar en cualquier pilar.
            </p>
          </div>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 no-scrollbar">
          {metrics.realPillars.map((pillar) => {
            const isHealthy = pillar.score >= 70;
            const getPillarAccent = (key: string) => {
              switch (key) {
                case 'espiritual':
                  return 'hover:border-amber-500/40';
                case 'emocional':
                  return 'hover:border-pink-500/40';
                case 'fisico':
                  return 'hover:border-lime-500/40';
                case 'intelectual':
                  return 'hover:border-cyan-500/40';
                case 'financiero':
                  return 'hover:border-emerald-500/40';
                default:
                  return 'hover:border-blue-500/40';
              }
            };

            return (
              <div
                key={pillar.key}
                onClick={() => onNavigate(pillar.view)}
                className={`min-w-[210px] shrink-0 snap-start sm:min-w-0 sm:shrink rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-md dark:shadow-xl ${getPillarAccent(
                  pillar.key
                )}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase">
                      {pillar.label}
                    </span>
                    <span
                      className={`text-xs font-extrabold tabular-nums ${
                        isHealthy
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {pillar.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {pillar.summary}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  {isHealthy ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Al día
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requiere atención
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Uniform Grid Below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start">
        {/* Left Column (7 Cols): Bloques de Enfoque Hoy + Biblioteca & Meta Principal */}
        <div className="lg:col-span-7 space-y-3 lg:space-y-6">
          <MobileCollapsibleCard
            title="Bloques de Enfoque Hoy"
            summary={`Semana ${currentWeek} · ${enabledSlots.length} bloques programados`}
            icon={
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500">
                <Calendar className="w-4 h-4" />
              </div>
            }
            defaultOpenMobile={false}
          >
            <div className="rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-slate-200/80 lg:dark:border-white/[0.08] p-4 lg:p-6 lg:shadow-lg lg:dark:shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Bloques de Enfoque Hoy
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 tabular-nums">
                    Semana {currentWeek}
                  </span>
                  <button
                    onClick={() => onNavigate('activation_center')}
                    className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-bold hover:bg-blue-500/20 cursor-pointer"
                  >
                    Organizar
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {enabledSlots.map((slot, idx) => {
                  const [hh, mm] = slot.time.split(':').map(Number);
                  const slotMins = (hh || 0) * 60 + (mm || 0);
                  const nextSlot = enabledSlots[idx + 1];
                  const [nh, nm] = nextSlot ? nextSlot.time.split(':').map(Number) : [23, 59];
                  const nextMins = (nh || 23) * 60 + (nm || 59);

                  const status: 'done' | 'active' | 'pending' =
                    currentMinutes >= nextMins
                      ? 'done'
                      : currentMinutes >= slotMins
                      ? 'active'
                      : 'pending';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => onNavigate(slot.view)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        status === 'active'
                          ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/30'
                          : status === 'done'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-slate-100/60 dark:bg-slate-900/35 border-slate-200/80 dark:border-slate-800 hover:border-blue-400/30'
                      }`}
                    >
                      <span className="text-xs text-slate-600 dark:text-slate-300 shrink-0 w-14 font-bold tabular-nums">
                        {slot.time}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          {slot.view === 'super_morning' && <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {slot.view === 'super_night' && <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                          <span className="truncate">{slot.label}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                          {slot.desc}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                          status === 'done'
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15'
                            : status === 'active'
                            ? 'text-blue-700 dark:text-blue-300 bg-blue-500/15 border border-blue-500/20'
                            : 'text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.05]'
                        }`}
                      >
                        {status === 'done' ? 'Transcurrido' : status === 'active' ? 'En curso' : 'Programado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </MobileCollapsibleCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
            <MobileCollapsibleCard
              title="Biblioteca & Lectura"
              summary={
                data.books[0]
                  ? `${data.books[0].title} (${data.books[0].totalPages > 0 ? Math.round((data.books[0].currentPage / data.books[0].totalPages) * 100) : 0}%)`
                  : `${data.books.length} libros en progreso`
              }
              icon={
                <div className="w-8 h-8 rounded-xl bg-yellow-500/15 flex items-center justify-center text-yellow-500">
                  <FileText className="w-4 h-4" />
                </div>
              }
              defaultOpenMobile={false}
            >
              <div className="rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-slate-200/80 lg:dark:border-white/[0.08] p-4 lg:p-5 lg:shadow-lg lg:dark:shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-yellow-500" />
                    Biblioteca & Lectura
                  </span>
                  <button
                    onClick={() => onNavigate('wisdom_library')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                  >
                    Ver todo
                  </button>
                </div>

                <div className="space-y-2">
                  {data.books.slice(0, 2).map((book) => (
                    <div
                      key={book.id}
                      className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">
                          {book.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                          {book.currentPage} / {book.totalPages} pág
                        </span>
                      </div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                        {book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </MobileCollapsibleCard>

            <MobileCollapsibleCard
              title="Meta Principal Activa"
              summary={`Progreso real: ${data.goals[0]?.progressPercent ?? 0}%`}
              icon={
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Target className="w-4 h-4" />
                </div>
              }
              defaultOpenMobile={false}
            >
              <div className="rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-slate-200/80 lg:dark:border-white/[0.08] p-4 lg:p-5 lg:shadow-lg lg:dark:shadow-2xl flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <Target className="w-3.5 h-3.5 text-amber-500" />
                    Meta Principal Activa
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    &quot;{data.goals[0]?.title || 'Define tu meta estratégica principal en Hábitos & Metas.'}&quot;
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Progreso real</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {data.goals[0]?.progressPercent ?? 0}%
                  </span>
                </div>
              </div>
            </MobileCollapsibleCard>
          </div>
        </div>

        {/* Right Column (5 Cols): Puntos de Crecimiento Reales + Índice de Enfoque Hoy */}
        <div className="lg:col-span-5 space-y-3 lg:space-y-6">
          <MobileCollapsibleCard
            title="Puntos de Crecimiento Reales"
            summary={`Score ${metrics.totalGrowthScore}/500 · Mejorar ${metrics.weakestDimension.label}`}
            icon={
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-500">
                <Sparkles className="w-4 h-4" />
              </div>
            }
            defaultOpenMobile={false}
          >
            <div className="rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-slate-200/80 lg:dark:border-white/[0.08] p-4 lg:p-6 lg:shadow-lg lg:dark:shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Puntos de Crecimiento Reales
                </h2>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 tabular-nums">
                  Score {metrics.totalGrowthScore} / 500
                </span>
              </div>

              <div className="space-y-3">
                {metrics.growthDimensions.map((dim) => (
                  <div
                    key={dim.id}
                    onClick={() => onNavigate(dim.targetView)}
                    className="group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {dim.label}
                      </span>
                      <span className={`${dim.textColor} font-bold tabular-nums`}>{dim.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${dim.color}`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{dim.detail}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-900 dark:text-amber-200">
                    <strong className="block">Área más baja: {metrics.weakestDimension.label} ({metrics.weakestDimension.score}%)</strong>
                    <span className="opacity-85">{metrics.weakestDimension.detail}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(metrics.weakestDimension.targetView)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  Mejorar →
                </button>
              </div>
            </div>
          </MobileCollapsibleCard>

          <MobileCollapsibleCard
            title="Índice de Enfoque Hoy"
            summary={`${metrics.focusPoints500}/500 · ${metrics.focusLabel} (${metrics.focusRatioPct}%)`}
            icon={
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            }
            defaultOpenMobile={false}
          >
            <div className="rounded-none lg:rounded-3xl lg:backdrop-blur-2xl lg:bg-white/75 lg:dark:bg-slate-900/60 lg:border lg:border-slate-200/80 lg:dark:border-white/[0.08] p-4 lg:p-6 lg:shadow-lg lg:dark:shadow-2xl flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Índice de Enfoque Hoy
              </span>

              <div className="relative w-40 h-24 flex items-center justify-center my-2">
                <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
                  <path
                    d="M 15 85 A 65 65 0 0 1 145 85"
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-white/[0.08]"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 85 A 65 65 0 0 1 145 85"
                    fill="none"
                    stroke="url(#apple-arc-gradient)"
                    strokeWidth="12"
                    strokeDasharray="204"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="apple-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-8 flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {metrics.focusPoints500}
                  </span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {metrics.focusLabel} ({metrics.focusRatioPct}%)
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-4 gap-1.5 text-[10px] my-2">
                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-black/30">
                  <span className="text-slate-400 block">Mañana</span>
                  <strong className="text-slate-800 dark:text-white tabular-nums">{metrics.morningComponent}%</strong>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-black/30">
                  <span className="text-slate-400 block">Tareas</span>
                  <strong className="text-slate-800 dark:text-white tabular-nums">{metrics.taskTodayRate}%</strong>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-black/30">
                  <span className="text-slate-400 block">Hábitos</span>
                  <strong className="text-slate-800 dark:text-white tabular-nums">{metrics.habitRate}%</strong>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-black/30">
                  <span className="text-slate-400 block">Agua</span>
                  <strong className="text-slate-800 dark:text-white tabular-nums">{metrics.waterPct}%</strong>
                </div>
              </div>

              <button
                onClick={() => onNavigate('mi_dia')}
                className="mt-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Ver Detalles del Día
              </button>
            </div>
          </MobileCollapsibleCard>
        </div>
      </div>
    </div>
  );
};
