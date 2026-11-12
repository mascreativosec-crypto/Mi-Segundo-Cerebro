import React, { useState, useMemo, useEffect } from 'react';
import { AppStoreData } from '../../services/storage';
import { Habit, Goal, PillarKey } from '../../types';
import { zenAudio } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Flame,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  X,
  Calendar,
  Layers,
  TrendingUp,
  Dumbbell,
  BookOpen,
  DollarSign,
  Heart,
  Smile,
  Check,
} from 'lucide-react';

interface HabitsAndGoalsViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
}

export const HabitsAndGoalsView: React.FC<HabitsAndGoalsViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [activeTab, setActiveTab] = useState<'habits' | 'goals'>('habits');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [durationTypeFilter, setDurationTypeFilter] = useState<'all' | 'micro' | 'regular'>('all');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Zen Timer State
  const [activeTimerHabit, setActiveTimerHabit] = useState<Habit | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(120);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(120);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerCompleted, setIsTimerCompleted] = useState<boolean>(false);

  // New Habit Modal State
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitPillar, setNewHabitPillar] = useState<PillarKey>('fisico');
  const [newHabitMinutes, setNewHabitMinutes] = useState<number>(2);
  const [newHabitIsMicro, setNewHabitIsMicro] = useState<boolean>(true);
  const [newHabitDescription, setNewHabitDescription] = useState('');

  // New Goal Modal State
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalHorizon, setNewGoalHorizon] = useState<Goal['horizon']>('quarterly');
  const [newGoalPillar, setNewGoalPillar] = useState<PillarKey>('financiero');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-12-31');
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [goalMilestones, setGoalMilestones] = useState<{ id: string; text: string; done: boolean }[]>([]);

  // Calculation of the past 28 days (4 full weeks ending with today)
  const past28Days = useMemo(() => {
    const list: { dateStr: string; dayNum: number; dayLetter: string; isToday: boolean }[] = [];
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // 0 = Sunday
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        dateStr,
        dayNum: d.getDate(),
        dayLetter: dayNames[d.getDay()],
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Toggle habit on any arbitrary date in the 28-day matrix and recalculate streaks
  const handleToggleHabitDate = (habitId: string, targetDateStr: string) => {
    onUpdateData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const alreadyDone = h.completedDates.includes(targetDateStr);
        const nextDates = alreadyDone
          ? h.completedDates.filter((d) => d !== targetDateStr)
          : [...h.completedDates, targetDateStr];

        // Recalculate streak
        const datesSet = new Set(nextDates);
        let streak = 0;
        const check = new Date();
        const today = check.toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];

        if (datesSet.has(today)) {
          while (datesSet.has(check.toISOString().split('T')[0])) {
            streak++;
            check.setDate(check.getDate() - 1);
          }
        } else if (datesSet.has(yesterday)) {
          check.setDate(check.getDate() - 1);
          while (datesSet.has(check.toISOString().split('T')[0])) {
            streak++;
            check.setDate(check.getDate() - 1);
          }
        }

        return {
          ...h,
          completedDates: nextDates,
          currentStreak: streak,
          bestStreak: Math.max(h.bestStreak, streak),
        };
      }),
    }));
  };

  // Toggle habit completion today
  const handleToggleHabitCompletionToday = (habitId: string) => {
    handleToggleHabitDate(habitId, todayStr);
  };

  // Launch Zen Timer
  const handleStartTimer = (habit: Habit) => {
    const durationMins = habit.targetDurationMinutes || (habit.isMicrohabit ? 2 : 15);
    const secs = durationMins * 60;
    setActiveTimerHabit(habit);
    setTimerTotalSeconds(secs);
    setTimerSecondsLeft(secs);
    setIsTimerRunning(true);
    setIsTimerCompleted(false);
    zenAudio.playDawnBell();
  };

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning || !activeTimerHabit || isTimerCompleted) return;

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev === 11) {
          zenAudio.playWarningTick();
        }
        if (prev <= 1) {
          // Timer finished!
          setIsTimerCompleted(true);
          setIsTimerRunning(false);
          zenAudio.playFinishGong();

          // Mark habit as completed today
          handleToggleHabitCompletionToday(activeTimerHabit.id);

          try {
            confetti({
              particleCount: 120,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
            });
          } catch {
            // ignore
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerHabit, isTimerCompleted]);

  // Handle Add Habit
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      title: newHabitTitle.trim(),
      pillar: newHabitPillar,
      targetFrequency: 'daily',
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      isArchived: false,
      isMicrohabit: newHabitIsMicro,
      targetDurationMinutes: Math.max(1, Number(newHabitMinutes) || 2),
      description: newHabitDescription.trim() || undefined,
    };

    onUpdateData((prev) => ({
      ...prev,
      habits: [newHabit, ...prev.habits],
    }));

    setNewHabitTitle('');
    setNewHabitDescription('');
    setShowAddHabitModal(false);
  };

  // Handle Add Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: `g_${Date.now()}`,
      title: newGoalTitle.trim(),
      horizon: newGoalHorizon,
      pillar: newGoalPillar,
      targetDate: newGoalTargetDate,
      progressPercent: 0,
      status: 'in_progress',
      milestones: goalMilestones,
    };

    onUpdateData((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));

    setNewGoalTitle('');
    setGoalMilestones([]);
    setShowAddGoalModal(false);
  };

  // Toggle milestone in goal
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done: !m.done } : m
        );
        const doneCount = updatedMilestones.filter((m) => m.done).length;
        const percent = updatedMilestones.length > 0 ? Math.round((doneCount / updatedMilestones.length) * 100) : g.progressPercent;
        return {
          ...g,
          milestones: updatedMilestones,
          progressPercent: percent,
          status: percent === 100 ? 'achieved' : 'in_progress',
        };
      }),
    }));
  };

  // Filtered habits
  const filteredHabits = data.habits.filter((h) => {
    if (selectedPillar !== 'all' && h.pillar !== selectedPillar) return false;
    if (durationTypeFilter === 'micro' && !h.isMicrohabit && (h.targetDurationMinutes || 10) > 5) return false;
    if (durationTypeFilter === 'regular' && (h.isMicrohabit || (h.targetDurationMinutes || 2) <= 5)) return false;
    return true;
  });

  // Filtered goals
  const filteredGoals = data.goals.filter((g) => {
    if (selectedHorizon !== 'all' && g.horizon !== selectedHorizon) return false;
    if (selectedPillar !== 'all' && g.pillar !== selectedPillar) return false;
    return true;
  });

  // Pillar styling helper with Apple Liquid Glass accents
  const getPillarColorBadge = (pillar: PillarKey) => {
    switch (pillar) {
      case 'espiritual':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'emocional':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'fisico':
        return 'bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/30';
      case 'intelectual':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
      case 'financiero':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-200/50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  // Timer format mm:ss
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const timerRadius = 78;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = timerTotalSeconds > 0
    ? Math.max(0, Math.min(100, Math.round(((timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds) * 100)))
    : 0;
  const timerDashoffset = timerCircumference - (timerCircumference * timerProgress) / 100;

  return (
    <div className="space-y-6">
      {/* Top Banner - Apple Liquid Glass Header */}
      <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-emerald-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-500/20 shrink-0">
            <Flame className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hábitos & Metas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Arquitectura de cambio de conducta: microhábitos de 1 a 5 minutos, matriz de consistencia de 28 días y horizontes estratégicos.
            </p>
          </div>
        </div>

        {/* View Switcher: Hábitos vs Metas & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-200/50 dark:bg-black/40 backdrop-blur-md border border-slate-300/40 dark:border-white/[0.06] rounded-2xl">
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'habits'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/[0.04] dark:border-white/[0.1]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Hábitos & Microhábitos</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-black/[0.04] dark:border-white/[0.1]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 text-amber-500" />
              <span>Metas & Horizontes</span>
            </button>
          </div>

          {activeTab === 'habits' ? (
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Hábito</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Meta</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HÁBITOS & MICROHÁBITOS */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Pillar Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-200/50 dark:bg-black/40 rounded-xl border border-slate-300/40 dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedPillar('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'all'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos los Pilares
              </button>
              <button
                onClick={() => setSelectedPillar('fisico')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'fisico'
                    ? 'bg-lime-500/20 text-lime-800 dark:text-lime-300 border border-lime-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Físico
              </button>
              <button
                onClick={() => setSelectedPillar('intelectual')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'intelectual'
                    ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Intelectual
              </button>
              <button
                onClick={() => setSelectedPillar('emocional')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'emocional'
                    ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Emocional
              </button>
              <button
                onClick={() => setSelectedPillar('espiritual')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'espiritual'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Espiritual
              </button>
              <button
                onClick={() => setSelectedPillar('financiero')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPillar === 'financiero'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Financiero
              </button>
            </div>

            {/* Microhabits vs Regular Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-black/40 rounded-xl border border-slate-300/40 dark:border-white/[0.06]">
              <button
                onClick={() => setDurationTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  durationTypeFilter === 'all'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({data.habits.length})
              </button>
              <button
                onClick={() => setDurationTypeFilter('micro')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  durationTypeFilter === 'micro'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Microhábitos (≤ 5 min)</span>
              </button>
              <button
                onClick={() => setDurationTypeFilter('regular')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  durationTypeFilter === 'regular'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hábitos Regulares
              </button>
            </div>
          </div>

          {/* Habit Cards Grid with Matriz de Consistencia (Últimos 28 Días) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHabits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(todayStr);
              const durationMins = habit.targetDurationMinutes || (habit.isMicrohabit ? 2 : 15);
              const isMicro = habit.isMicrohabit || durationMins <= 5;

              // Compute 28-day consistency metrics
              const completedIn28 = past28Days.filter((d) => habit.completedDates.includes(d.dateStr)).length;
              const percent28 = Math.round((completedIn28 / 28) * 100);

              return (
                <div
                  key={habit.id}
                  className={`p-5 rounded-3xl backdrop-blur-2xl border transition-all flex flex-col justify-between gap-4 ${
                    isCompletedToday
                      ? 'bg-emerald-500/[0.08] dark:bg-emerald-950/20 border-emerald-500/30 shadow-md shadow-emerald-500/10'
                      : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/30 dark:hover:border-blue-500/30 shadow-lg dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/40'
                  }`}
                >
                  <div>
                    {/* Top Badges & Streak */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase ${getPillarColorBadge(habit.pillar)}`}>
                          {habit.pillar}
                        </span>
                        {isMicro ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-500" />
                            <span>{durationMins}m Micro</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold">
                            {durationMins}m
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span>{habit.currentStreak}d</span>
                        </div>
                        {habit.bestStreak > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium" title={`Mejor Racha: ${habit.bestStreak} días`}>
                            (max {habit.bestStreak}d)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Checkbox for Today */}
                    <div
                      onClick={() => handleToggleHabitCompletionToday(habit.id)}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <button className="mt-0.5 shrink-0" type="button">
                        {isCompletedToday ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
                        )}
                      </button>

                      <div>
                        <h3 className={`text-sm font-bold tracking-tight ${isCompletedToday ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {habit.title}
                        </h3>
                        {habit.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MATRIZ DE CONSISTENCIA (ÚLTIMOS 28 DÍAS) */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
                    {/* Matrix Quantitative Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        <span>Matriz 28 Días</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                          {completedIn28}/28
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                          ({percent28}%)
                        </span>
                      </div>
                    </div>

                    {/* 4x7 Interactive Matrix Grid */}
                    <div className="space-y-1">
                      {/* Weekday indicator labels */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400 dark:text-slate-500 font-semibold select-none">
                        <span>L</span>
                        <span>M</span>
                        <span>X</span>
                        <span>J</span>
                        <span>V</span>
                        <span>S</span>
                        <span>D</span>
                      </div>

                      {/* 28 Interactive Day Cells (4 rows of 7 days) */}
                      <div className="grid grid-cols-7 gap-1">
                        {past28Days.map((day) => {
                          const isDone = habit.completedDates.includes(day.dateStr);
                          return (
                            <button
                              key={day.dateStr}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHabitDate(habit.id, day.dateStr);
                              }}
                              title={`${day.dateStr}: ${isDone ? 'Completado (Click para alternar)' : 'Pendiente (Click para marcar)'}`}
                              className={`h-7 rounded-lg flex flex-col items-center justify-center text-[9px] font-medium transition-all cursor-pointer border ${
                                isDone
                                  ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                                  : day.isToday
                                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-800 dark:text-amber-300 font-bold animate-pulse'
                                  : 'bg-slate-100/70 dark:bg-black/30 border-transparent text-slate-400 dark:text-slate-600 hover:border-slate-300 dark:hover:border-white/20'
                              }`}
                            >
                              <span className="leading-none text-[8px] opacity-75">{day.dayNum}</span>
                              <span className="leading-none text-[10px] font-bold">
                                {isDone ? '✓' : '·'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timer CTA */}
                    <button
                      type="button"
                      onClick={() => handleStartTimer(habit)}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-emerald-500/15 hover:from-blue-500/25 hover:to-emerald-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Temporizador Zen ({durationMins} min)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: METAS & HORIZONTES */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Horizon Selector */}
          <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-black/40 rounded-xl border border-slate-300/40 dark:border-white/[0.06]">
              <button
                onClick={() => setSelectedHorizon('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === 'all'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos los Horizontes
              </button>
              <button
                onClick={() => setSelectedHorizon('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === 'monthly'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setSelectedHorizon('quarterly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === 'quarterly'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Trimestral
              </button>
              <button
                onClick={() => setSelectedHorizon('annual')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === 'annual'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Anual
              </button>
              <button
                onClick={() => setSelectedHorizon('5_years')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedHorizon === '5_years'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                5 Años
              </button>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGoals.map((goal) => {
              const doneMilestones = goal.milestones.filter((m) => m.done).length;

              return (
                <div
                  key={goal.id}
                  className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase font-bold">
                      {goal.horizon.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Límite: {goal.targetDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {goal.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Progreso</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        {goal.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-black/40 overflow-hidden border border-slate-300/40 dark:border-white/[0.06]">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  {goal.milestones.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.06]">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                        Hitos ({doneMilestones}/{goal.milestones.length}):
                      </span>
                      <div className="space-y-1.5">
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(goal.id, m.id)}
                            className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          >
                            <button className="shrink-0" type="button">
                              {m.done ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 hover:text-emerald-500" />
                              )}
                            </button>
                            <span className={m.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                              {m.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ZEN TIMER MODAL */}
      {activeTimerHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#0c1219] border border-emerald-500/30 p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setActiveTimerHabit(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                Temporizador Zen de Hábito
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                {activeTimerHabit.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Respira en calma, enfócate en el presente y ejecuta con devoción.
              </p>
            </div>

            {/* Circular SVG Timer Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r={timerRadius}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/[0.08]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r={timerRadius}
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300"
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {formatTimer(timerSecondsLeft)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  {timerProgress}% completado
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTimerSecondsLeft((prev) => prev + 60)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                +1 min
              </button>

              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer"
              >
                {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimerSecondsLeft(timerTotalSeconds);
                  setIsTimerRunning(false);
                }}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE HABIT MODAL */}
      {showAddHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateHabit}
            className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#0c1219] border border-emerald-500/30 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Crear Nuevo Hábito / Microhábito</h3>
              <button
                type="button"
                onClick={() => setShowAddHabitModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre del Hábito *</label>
              <input
                type="text"
                required
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Ej: 2 min de Respiración Consciente"
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pilar de Vida</label>
                <select
                  value={newHabitPillar}
                  onChange={(e) => setNewHabitPillar(e.target.value as PillarKey)}
                  className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="fisico">Físico</option>
                  <option value="intelectual">Intelectual</option>
                  <option value="emocional">Emocional</option>
                  <option value="espiritual">Espiritual</option>
                  <option value="financiero">Financiero</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={newHabitMinutes}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setNewHabitMinutes(m);
                    setNewHabitIsMicro(m <= 5);
                  }}
                  className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-sans"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newHabitIsMicro}
                onChange={(e) => setNewHabitIsMicro(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-400"
              />
              <span>Es un Microhábito Atómico (≤ 5 min para reducir fricción)</span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Disparador o Contexto</label>
              <input
                type="text"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                placeholder="Ej: Justo después de servirme mi primer café..."
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowAddHabitModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Guardar Hábito
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateGoal}
            className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-[#0c1219] border border-amber-500/30 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registrar Nueva Meta Estratégica</h3>
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Título de la Meta *</label>
              <input
                type="text"
                required
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Ej: Facturar $50,000 netos mensuales..."
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Horizonte</label>
                <select
                  value={newGoalHorizon}
                  onChange={(e) => setNewGoalHorizon(e.target.value as Goal['horizon'])}
                  className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                  <option value="5_years">5 Años</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pilar</label>
                <select
                  value={newGoalPillar}
                  onChange={(e) => setNewGoalPillar(e.target.value as PillarKey)}
                  className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="financiero">Financiero</option>
                  <option value="fisico">Físico</option>
                  <option value="intelectual">Intelectual</option>
                  <option value="emocional">Emocional</option>
                  <option value="espiritual">Espiritual</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Fecha Límite</label>
              <input
                type="date"
                value={newGoalTargetDate}
                onChange={(e) => setNewGoalTargetDate(e.target.value)}
                className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Guardar Meta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
