import React, { useState, useMemo } from 'react';
import { ISuperMorningRoutine } from '../../types';
import {
  SuperMorningHabit,
  RoutineMode,
  DailyMorningLog,
  SUPER_MANANA_HABITS,
} from '../../types/super-morning';
import { IconRenderer } from '../../components/super-manana/IconRenderer';
import { PromptFieldRenderer } from '../../components/super-manana/PromptFieldRenderer';
import { GuidedSessionModal } from '../../components/super-manana/GuidedSessionModal';
import { HabitBuilderView } from '../../components/super-manana/HabitBuilderView';
import { ProgressView } from '../../components/super-manana/ProgressView';
import { StreakRecoveryProtocolCard } from '../../components/shared/StreakRecoveryProtocolCard';
import {
  Sun,
  Play,
  Sliders,
  Calendar,
  Moon,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  BellPlus,
  Dumbbell,
  RefreshCw,
} from 'lucide-react';

interface SuperMorningModuleProps {
  routine: ISuperMorningRoutine;
  onUpdate: (updated: ISuperMorningRoutine) => void;
  onTriggerActivationCoach?: () => void;
  onNavigateToSuperNight?: () => void;
  onNavigateToPhysicalTrainer?: () => void;
  onSendToReminders?: (title: string, content: string, category?: 'super_manana' | 'frase') => void;
}

export const SuperMorningModule: React.FC<SuperMorningModuleProps> = ({
  routine,
  onUpdate,
  onNavigateToPhysicalTrainer,
  onSendToReminders,
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'builder' | 'progress'>('routine');
  const [showGuidedModal, setShowGuidedModal] = useState(false);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [reminderSavedBanner, setReminderSavedBanner] = useState<string | null>(null);
  const [aiQuotes, setAiQuotes] = useState<Record<string, string>>({});
  const [loadingAiQuoteId, setLoadingAiQuoteId] = useState<string | null>(null);

  // Initialize habits from state or default
  const habits: SuperMorningHabit[] = routine.customHabits && routine.customHabits.length > 0
    ? (routine.customHabits as SuperMorningHabit[])
    : SUPER_MANANA_HABITS;

  const mode: RoutineMode = routine.mode || 'balanced';
  const morningLogs: DailyMorningLog[] = (routine.morningLogs as DailyMorningLog[]) || [];
  const currentStreak = routine.currentStreak ?? 1;
  const bestStreak = routine.bestStreak ?? Math.max(1, currentStreak);
  const totalSessions = morningLogs.length > 0 ? morningLogs.length : 1;
  const savedResponses = routine.responses || {};

  const enabledHabits = habits.filter((h) => h.enabled);
  const completedHabitIds = routine.steps
    ? routine.steps.filter((s) => s.completed).map((s) => s.id)
    : [];

  const completedCount = enabledHabits.filter((h) => completedHabitIds.includes(h.id)).length;
  const todayDateStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const hasCompletedTodayLog = morningLogs.some((l) => l.date === todayDateStr);
  const hasCompletedYesterdayLog = morningLogs.some((l) => l.date === yesterdayStr);
  const isDoneToday =
    (enabledHabits.length > 0 && completedCount === enabledHabits.length) || hasCompletedTodayLog;
  const hasLostMorningStreak =
    !isDoneToday &&
    (currentStreak === 0 || (morningLogs.length > 0 && !hasCompletedYesterdayLog && currentStreak <= 1));

  // Selected duration in minutes based on active mode
  const selectedMinutes = useMemo(() => {
    if (mode === 'express') return 15;
    if (mode === 'deep') return 60;
    return 30; // balanced
  }, [mode]);

  // Estimated finish time
  const finishTimeStr = useMemo(() => {
    const d = new Date(Date.now() + selectedMinutes * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [selectedMinutes]);

  // Formatted date string (ej: "Miércoles, 11 de noviembre")
  const formattedToday = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = today.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const handleToggleHabit = (habitId: string) => {
    let nextCompletedIds: string[];
    if (completedHabitIds.includes(habitId)) {
      nextCompletedIds = completedHabitIds.filter((id) => id !== habitId);
    } else {
      nextCompletedIds = [...completedHabitIds, habitId];
    }

    const updatedSteps = enabledHabits.map((h) => ({
      id: h.id,
      label: h.title,
      durationMinutes: h.defaultMinutes,
      completed: nextCompletedIds.includes(h.id),
    }));

    const allDone = updatedSteps.every((s) => s.completed);

    onUpdate({
      ...routine,
      steps: updatedSteps,
      completedAt: allDone ? (routine.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : undefined,
    });
  };

  const handleUpdateResponse = (habitId: string, fieldId: string, value: any) => {
    const nextResponses = {
      ...savedResponses,
      [habitId]: {
        ...(savedResponses[habitId] || {}),
        [fieldId]: value,
      },
    };

    onUpdate({
      ...routine,
      responses: nextResponses,
    });
  };

  const handleFinishGuidedSession = (
    modalResponses: Record<string, Record<string, any>>,
    totalDurationSeconds: number
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const allEnabledIds = enabledHabits.map((h) => h.id);
    const mergedResponses = { ...savedResponses, ...modalResponses };

    const newLog: DailyMorningLog = {
      date: todayStr,
      mode: mode,
      totalDurationSeconds: totalDurationSeconds,
      completedHabitIds: allEnabledIds,
      responses: mergedResponses,
      wakeUpTime: routine.wakeUpTime || '05:00',
      wakeUpMood: routine.wakeUpMood || 5,
    };

    const nextLogs = [newLog, ...morningLogs.filter((l) => l.date !== todayStr)];

    const updatedSteps = enabledHabits.map((h) => ({
      id: h.id,
      label: h.title,
      durationMinutes: h.defaultMinutes,
      completed: true,
    }));

    onUpdate({
      ...routine,
      steps: updatedSteps,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      morningLogs: nextLogs,
      responses: mergedResponses,
      currentStreak: currentStreak + 1,
      bestStreak: Math.max(bestStreak, currentStreak + 1),
    });

    setShowGuidedModal(false);
  };

  const handleFetchHabitAiQuote = async (habit: SuperMorningHabit) => {
    setLoadingAiQuoteId(habit.id);
    try {
      const res = await fetch('/api/gemini/habit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitTitle: habit.title,
          topic: habit.aiMessageTopic || 'motivacion',
          description: habit.description,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.quote) {
          setAiQuotes((prev) => ({ ...prev, [habit.id]: json.quote }));
        }
      }
    } catch {
      // ignore network error
    } finally {
      setLoadingAiQuoteId(null);
    }
  };

  const handleRecoverStreak = (frictionReason: string, recoveryNote: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const recoveryLog: DailyMorningLog = {
      date: todayStr,
      mode: 'express',
      totalDurationSeconds: 300,
      completedHabitIds: enabledHabits.slice(0, 3).map((h) => h.id),
      responses: {
        rescate: {
          friccion: frictionReason,
          ajuste: recoveryNote || 'Micro-misión de 5 minutos completada para reactivar la inercia.',
        },
      },
      wakeUpTime: routine.wakeUpTime || '06:00',
      wakeUpMood: routine.wakeUpMood || 4,
      isRecovery: true,
    };
    const nextLogs = [recoveryLog, ...morningLogs.filter((l) => l.date !== todayStr)];
    const nextStreak = Math.max(2, currentStreak + 1);
    onUpdate({
      ...routine,
      morningLogs: nextLogs,
      currentStreak: nextStreak,
      bestStreak: Math.max(bestStreak, nextStreak),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Super Mañana Header & Daily Overview - Unified Single Apple Liquid Glass Block */}
      <div className="p-6 md:p-7 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-amber-500/25 shadow-lg dark:shadow-2xl space-y-6">
        {/* Top Control Bar: Brand & Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-amber-500/25 shrink-0">
              <Sun className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Super Mañana
              </h1>
              <p className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  Espiritual
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">+</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  Emocional
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">+</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  Físico
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">+</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  Intelectual
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">+</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                  Financiero
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">=</span>
                <strong className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                  Tu Mejor Versión
                </strong>
              </p>
            </div>
          </div>

          {/* Sub-tabs Nav: exactly 3 tabs (Mi Rutina, Personalizar, Progreso) - spacious without scrollbar */}
          <div className="w-full xl:w-auto sm:min-w-[380px] grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100/90 dark:bg-black/40 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
            <button
              onClick={() => setActiveTab('routine')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'routine'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mi Rutina
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'builder'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Personalizar
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'progress'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Progreso
            </button>
          </div>
        </div>

        {/* Integrated Daily Decision & Metrics Section (Directly inside the same block when in Routine) */}
        {activeTab === 'routine' && (
          <div className="pt-5 border-t border-slate-200/80 dark:border-white/[0.06] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedToday} · Jornada Matutina</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Tu primera decisión cuenta
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Conquista tu primera decisión y define el rumbo del día.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {isDoneToday ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Conquistada hoy</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold shadow-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Pendiente para hoy</span>
                  </span>
                )}
              </div>
            </div>

            {/* 3 Metric Stats Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Racha Actual</span>
                  {hasLostMorningStreak && (
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById('morning-streak-recovery')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                      className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Rescatar
                    </button>
                  )}
                </div>
                <span className="text-lg md:text-xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-0.5 tracking-tight">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Récord de Racha</span>
                <span className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight block">
                  {bestStreak} {bestStreak === 1 ? 'día' : 'días'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Sesiones Conquistadas</span>
                <span className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight block">
                  {totalSessions}
                </span>
              </div>
            </div>

            {hasLostMorningStreak && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  ¿Perdiste tu racha matutina? Aplica la regla &quot;Nunca falles 2 días&quot; con el Protocolo de Rescate (5 min).
                </span>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById('morning-streak-recovery')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 cursor-pointer"
                >
                  Ir al Protocolo de Rescate ↓
                </button>
              </div>
            )}

            {habits.length < 20 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                    Nueva Rutina Épica Disponible (23 Fases + Isra García)
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    Actualiza tu lista actual ({habits.length} fases) a tu secuencia épica completa cuando lo desees.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...routine, customHabits: SUPER_MANANA_HABITS })}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cargar 23 Fases Épicas</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: MI RUTINA (Apple Liquid Glass Solar Look) */}
      {activeTab === 'routine' && (
        <div className="space-y-6">

          {/* Time Selector Card with Finish Clock */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  ¿Cuánto tiempo tienes esta mañana?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Escala automáticamente los tiempos de Vipassana, cuerpo y reflexión.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-xl">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Terminarías a las <strong className="font-semibold text-slate-900 dark:text-white">{finishTimeStr}</strong></span>
              </div>
            </div>

            {/* 3 Interactive Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => onUpdate({ ...routine, mode: 'express' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'express'
                    ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">15 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                    Express
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Rápido y contundente para mañanas con prisa.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ ...routine, mode: 'balanced' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'balanced'
                    ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">30 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Equilibrado
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ritmo óptimo: Vipassana, quietud y cuerpo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ ...routine, mode: 'deep' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'deep'
                    ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                    : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">60 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Profundo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Vipassana completa (20m) e inmersión total.
                </p>
              </button>
            </div>

            {/* Giant Primary Action Button */}
            <button
              onClick={() => setShowGuidedModal(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Iniciar Sesión Guiada con Temporizador ({selectedMinutes} Min)</span>
            </button>
          </div>

          {/* Habit Checklist Preview */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Actividades de la Mañana ({enabledHabits.length})</span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-xl border border-amber-500/30">
                    {completedCount} completadas
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Puedes marcarlas aquí manualmente o ejecutar la sesión guiada con sonido zen.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('builder')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Personalizar Rutina</span>
              </button>
            </div>

            {/* Intención o Frase para Recordar Hoy - INSIDE Actividades de la Mañana */}
            <div className="p-4 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border border-amber-500/20 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Intención o Frase para Recordar Hoy (opcional enviar a Recordatorios)
                </label>
                {onSendToReminders && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!routine.intention?.trim()) return;
                      onSendToReminders('Intención de Súper Mañana', routine.intention.trim(), 'super_manana');
                      setReminderSavedBanner('Intención enviada a Notas & Recordatorios (visible en Mi Día)');
                      setTimeout(() => setReminderSavedBanner(null), 3500);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <BellPlus className="w-3.5 h-3.5" />
                    <span>Enviar a Bandeja de Recordatorios</span>
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                maxLength={7000}
                value={routine.intention || ''}
                onChange={(e) => onUpdate({ ...routine, intention: e.target.value })}
                placeholder="Escribe aquí tu intención, frase o decreto del día. Si deseas que el sistema te la recuerde, presiona el botón de arriba..."
                className="w-full bg-white/85 dark:bg-black/40 border border-amber-500/25 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-y"
              />
              {reminderSavedBanner && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {reminderSavedBanner}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              {enabledHabits.map((habit, index) => {
                const isDone = completedHabitIds.includes(habit.id);
                const isExpanded = expandedHabitId === habit.id;
                const fieldCount = habit.fields?.length || 0;

                const habitDuration = mode === 'express'
                  ? habit.expressMinutes || 1
                  : mode === 'deep'
                  ? habit.deepMinutes || 5
                  : habit.defaultMinutes || 2;

                return (
                  <div
                    key={habit.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isDone
                        ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-slate-700 dark:text-slate-300'
                        : 'bg-white/60 dark:bg-black/30 border-slate-200/80 dark:border-white/[0.06] text-slate-800 dark:text-slate-200 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div
                        onClick={() => handleToggleHabit(habit.id)}
                        className="flex items-center gap-3.5 flex-1 cursor-pointer"
                      >
                        <button className="shrink-0 cursor-pointer">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 hover:text-amber-500 transition-colors" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <IconRenderer name={habit.icon} className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                              #{index + 1}
                            </span>
                            <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                              {habit.title}
                            </span>
                            {fieldCount > 0 && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {habit.instructions?.[0] || habit.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-black/40 px-2.5 py-0.5 rounded-lg border border-slate-300/40 dark:border-white/[0.06]">
                          {habitDuration} min
                        </span>

                        <button
                          onClick={() => {
                            const nextOpen = isExpanded ? null : habit.id;
                            setExpandedHabitId(nextOpen);
                            if (nextOpen && habit.enableAiDailyMessage && !aiQuotes[habit.id]) {
                              handleFetchHabitAiQuote(habit);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Ver pautas y campos"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-3 bg-slate-50/70 dark:bg-black/30">
                        {habit.stoicQuote && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs italic text-amber-900 dark:text-amber-200/90 font-serif">
                              "{habit.stoicQuote}"
                            </span>
                            {onSendToReminders && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSendToReminders(
                                    `Frase · ${habit.title}`,
                                    habit.stoicQuote!,
                                    'frase'
                                  );
                                  setReminderSavedBanner(`Frase de "${habit.title}" enviada a Mi Día`);
                                  setTimeout(() => setReminderSavedBanner(null), 3500);
                                }}
                                className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <BellPlus className="w-3 h-3" />
                                <span>Enviar a Recordatorios</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* AI Daily Message / Meditation Quote Box */}
                        {habit.enableAiDailyMessage && (
                          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Mensaje IA Aleatorio del Día</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFetchHabitAiQuote(habit)}
                                  disabled={loadingAiQuoteId === habit.id}
                                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className={`w-3 h-3 ${loadingAiQuoteId === habit.id ? 'animate-spin' : ''}`} />
                                  <span>{loadingAiQuoteId === habit.id ? 'Generando...' : 'Otra frase IA'}</span>
                                </button>
                                {onSendToReminders && aiQuotes[habit.id] && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSendToReminders(`Mensaje IA · ${habit.title}`, aiQuotes[habit.id], 'frase');
                                      setReminderSavedBanner('Mensaje IA enviado a Bandeja de Recordatorios');
                                      setTimeout(() => setReminderSavedBanner(null), 3500);
                                    }}
                                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <BellPlus className="w-3 h-3" />
                                    <span>Recordar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs italic text-slate-800 dark:text-slate-100">
                              {aiQuotes[habit.id]
                                ? `"${aiQuotes[habit.id]}"`
                                : 'Generando tu mensaje diario personalizado...'}
                            </p>
                          </div>
                        )}

                        {/* Physical Trainer Quick Link */}
                        {habit.linkToFitness && onNavigateToPhysicalTrainer && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                              Conecta este bloque físico con tus series, pesos y rutina en Mi Entrenador Físico.
                            </span>
                            <button
                              type="button"
                              onClick={onNavigateToPhysicalTrainer}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Dumbbell className="w-3.5 h-3.5" />
                              <span>Ir a Entrenador Físico</span>
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-300">{habit.description}</p>

                        {habit.fields && habit.fields.length > 0 && (
                          <div className="p-4 rounded-xl bg-white/70 dark:bg-black/50 border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white block">Tus Registros de la Fase</span>
                              {onSendToReminders &&
                                savedResponses[habit.id] &&
                                Object.values(savedResponses[habit.id]).some((v) =>
                                  typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = Object.values(savedResponses[habit.id])
                                        .flat()
                                        .filter((v) => typeof v === 'string' && v.trim())
                                        .join(' · ');
                                      if (!text) return;
                                      onSendToReminders(habit.title, text, 'super_manana');
                                      setReminderSavedBanner(`Nota de "${habit.title}" enviada a Recordatorios`);
                                      setTimeout(() => setReminderSavedBanner(null), 3500);
                                    }}
                                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <BellPlus className="w-3 h-3" />
                                    <span>Recordar en Mi Día</span>
                                  </button>
                                )}
                            </div>
                            {habit.fields.map((f) => (
                              <PromptFieldRenderer
                                key={f.id}
                                field={f}
                                value={savedResponses[habit.id]?.[f.id]}
                                onChange={(val) => handleUpdateResponse(habit.id, f.id, val)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protocolo de Rescate al final de todos los bloques de Súper Mañana */}
          <StreakRecoveryProtocolCard
            id="morning-streak-recovery"
            theme="amber"
            moduleLabel="Súper Mañana"
            hasLostStreak={hasLostMorningStreak}
            isDoneToday={isDoneToday}
            currentStreak={currentStreak}
            onRecoverStreak={handleRecoverStreak}
          />
        </div>
      )}

      {/* TAB 2: PERSONALIZAR */}
      {activeTab === 'builder' && (
        <HabitBuilderView
          habits={habits}
          onUpdateHabits={(updated) => onUpdate({ ...routine, customHabits: updated })}
          onResetDefaults={() => onUpdate({ ...routine, customHabits: SUPER_MANANA_HABITS })}
        />
      )}

      {/* TAB 3: PROGRESO */}
      {activeTab === 'progress' && (
        <ProgressView
          logs={morningLogs}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          onRecoverStreak={handleRecoverStreak}
        />
      )}

      {/* Guided Session Modal */}
      {showGuidedModal && (
        <GuidedSessionModal
          habits={habits}
          mode={mode}
          onClose={() => setShowGuidedModal(false)}
          onFinishSession={handleFinishGuidedSession}
          aiQuotes={aiQuotes}
          onOpenPhysicalTrainer={onNavigateToPhysicalTrainer}
        />
      )}
    </div>
  );
};
