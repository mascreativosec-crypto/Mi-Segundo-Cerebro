import React, { useState, useMemo } from 'react';
import { ISuperNightReview, FailureSolutionPair, VerbalAwarenessCheck } from '../../types';
import {
  SuperNightHabit,
  SUPER_NOCHE_HABITS,
  DEFAULT_VERBAL_AWARENESS_ITEMS,
} from '../../types/super-night';
import { RoutineMode, NightPrepCheckItem, DEFAULT_NIGHT_PREP_ITEMS } from '../../types/super-morning';
import { IconRenderer } from '../../components/super-manana/IconRenderer';
import { HabitBuilderView } from '../../components/super-manana/HabitBuilderView';
import { ProgressView } from '../../components/super-manana/ProgressView';
import { NightPrepView } from '../../components/super-manana/NightPrepView';
import { SuperNightGuidedModal } from '../../components/super-night/SuperNightGuidedModal';
import { zenAudio } from '../../utils/audio';
import {
  Moon,
  Star,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Play,
  Sliders,
  Calendar,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Target,
  Heart,
  Sun,
  Bed,
} from 'lucide-react';

interface SuperNightModuleProps {
  review: ISuperNightReview;
  onUpdate: (updated: ISuperNightReview) => void;
  onTriggerReflectionCoach?: () => void;
  onNavigateToSuperMorning?: () => void;
}

export const SuperNightModule: React.FC<SuperNightModuleProps> = ({
  review,
  onUpdate,
  onTriggerReflectionCoach,
  onNavigateToSuperMorning,
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'builder' | 'progress' | 'prep'>('routine');
  const [showGuidedModal, setShowGuidedModal] = useState(false);

  // Mode and streak
  const mode: RoutineMode = review.mode || 'balanced';
  const currentStreak = review.currentStreak || 8;
  const bestStreak = review.bestStreak || 20;

  // Habits configuration
  const habits = (review.customHabits as any[]) || SUPER_NOCHE_HABITS;

  // Night prep checklist items (moved from morning!)
  const nightPrepItems: NightPrepCheckItem[] = (review.nightPrepItems as NightPrepCheckItem[]) || DEFAULT_NIGHT_PREP_ITEMS;

  // Introspective states with robust fallbacks
  const mainVictory = review.mainVictory || 'Tener una introspección más clara de mí mismo y qué debo mejorar con firmeza.';
  const magicMoment = review.magicMoment || 'Saber qué tikún tocar y ser consciente de que muchas personas dependen de que yo no falle.';
  const tikunReflection = review.tikunReflection || 'Mi responsabilidad no es solo operativa, sino de sostén ético y moral para el equipo.';
  const missedLessons = review.missedLessons || [
    'Que hay cosas que parecían insignificantes y fáciles de superar, y no lo son; requieren método.',
  ];
  const newThingsDone = review.newThingsDone || 'Contar mis experiencias y abrirme con mayor vulnerabilidad estratégica.';
  const subconsciousText = review.subconsciousRequestText || 'Duermo en paz, mi mente se regenera y mañana despierto a las 5:00 AM con energía y claridad invencible.';
  const subconsciousCount = review.subconsciousRequestCount || 0;
  const dayConclusion = review.dayConclusion || 'Cierro el día habiendo dado mi máximo esfuerzo. Lo que quedó pendiente se conquistará mañana.';

  // Failures & Solutions
  const failuresList: FailureSolutionPair[] = review.failuresAndSolutions && review.failuresAndSolutions.length > 0
    ? review.failuresAndSolutions
    : [
        {
          id: 'fs_1',
          failure: 'No cobrar más en la cobranza oportuna',
          solution: 'Motivar al departamento de cobranza, implementar recordatorios automáticos e incentivos de recuperación.',
        },
      ];

  // Verbal Awareness items (9 items)
  const verbalItems: VerbalAwarenessCheck[] = review.verbalAwareness && review.verbalAwareness.length > 0
    ? review.verbalAwareness
    : DEFAULT_VERBAL_AWARENESS_ITEMS;

  // New item inputs
  const [newLessonInput, setNewLessonInput] = useState('');
  const [newFailureInput, setNewFailureInput] = useState('');
  const [newSolutionInput, setNewSolutionInput] = useState('');

  // Selected duration
  const selectedMinutes = useMemo(() => {
    if (mode === 'express') return 15;
    if (mode === 'deep') return 45;
    return 30; // balanced
  }, [mode]);

  // Estimated sleep time
  const sleepTimeStr = useMemo(() => {
    const d = new Date(Date.now() + selectedMinutes * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [selectedMinutes]);

  // Formatted date string
  const formattedToday = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = today.toLocaleDateString('es-ES', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  // Handlers
  const handleToggleVerbalItem = (id: string) => {
    const updated = verbalItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onUpdate({
      ...review,
      verbalAwareness: updated,
    });
  };

  const handleIncrementSubconscious = () => {
    const nextCount = Math.min(30, subconsciousCount + 1);
    onUpdate({
      ...review,
      subconsciousRequestCount: nextCount,
    });
    if (nextCount === 30) {
      zenAudio.playFinishGong();
    } else {
      zenAudio.playWarningTick();
    }
  };

  const handleResetSubconscious = () => {
    onUpdate({
      ...review,
      subconsciousRequestCount: 0,
    });
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonInput.trim()) return;
    onUpdate({
      ...review,
      missedLessons: [...missedLessons, newLessonInput.trim()],
    });
    setNewLessonInput('');
  };

  const handleRemoveLesson = (idx: number) => {
    onUpdate({
      ...review,
      missedLessons: missedLessons.filter((_, i) => i !== idx),
    });
  };

  const handleAddFailureSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFailureInput.trim() || !newSolutionInput.trim()) return;
    const newPair: FailureSolutionPair = {
      id: `fs_${Date.now()}`,
      failure: newFailureInput.trim(),
      solution: newSolutionInput.trim(),
    };
    onUpdate({
      ...review,
      failuresAndSolutions: [...failuresList, newPair],
    });
    setNewFailureInput('');
    setNewSolutionInput('');
  };

  const handleRemoveFailureSolution = (id: string) => {
    onUpdate({
      ...review,
      failuresAndSolutions: failuresList.filter((f) => f.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview - Unified Single Apple Liquid Glass Block */}
      <div className="p-6 md:p-7 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-500/30 shadow-lg dark:shadow-2xl space-y-6">
        {/* Top Control Bar: Brand & Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-400 flex items-center justify-center text-white font-extrabold shadow-lg shadow-purple-500/25 shrink-0">
              <Moon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Super Noche
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
                <strong className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs">
                  Paz Interior & Rectificación
                </strong>
              </p>
            </div>
          </div>

          {/* Sub-tabs Navigation - spacious without scrollbar */}
          <div className="w-full xl:w-auto sm:min-w-[480px] grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-100/90 dark:bg-black/40 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
            <button
              onClick={() => setActiveTab('routine')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'routine'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mi Rutina
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'builder'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Personalizar
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'progress'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Progreso
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              className={`w-full py-2.5 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'prep'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Preparación de Mañana
            </button>
          </div>
        </div>

        {/* Integrated Introspection & Stats Section inside the same block */}
        {activeTab === 'routine' && (
          <div className="pt-5 border-t border-slate-200/80 dark:border-white/[0.06] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedToday} · Cierre de Jornada</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Introspección & Autogobierno
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Examina tus actos, celebra tus victorias y rectifica tu rumbo.
                </p>
              </div>

              {/* Day Rating with 5 Stars */}
              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-purple-500/25 flex flex-col items-end">
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mb-1">Evaluación del Día</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => onUpdate({ ...review, dayRating: star })}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= review.dayRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Metric Stats Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Racha Nocturna</span>
                <span className="text-lg md:text-xl font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mt-0.5 tracking-tight">
                  <Flame className="w-4 h-4 fill-purple-500 text-purple-500" />
                  {currentStreak} {currentStreak === 1 ? 'noche' : 'noches'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Récord</span>
                <span className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight block">
                  {bestStreak} noches
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Meta de Sueño</span>
                <span className="text-lg md:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5 tracking-tight block">
                  {review.plannedSleepHours || 7.5} horas
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: MI RUTINA (Deep Introspection & Conscience) */}
      {activeTab === 'routine' && (
        <div className="space-y-6">

          {/* Time Selector Card with Sleep Target Clock */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  ¿Cuánto tiempo dedicarás a tu introspección nocturna?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Escala los tiempos de conciencia verbal, lecciones y petición subconsciente.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-purple-800 dark:text-purple-300 font-medium bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-xl">
                <Bed className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Estarías durmiendo a las <strong className="font-semibold text-slate-900 dark:text-white">{sleepTimeStr}</strong></span>
              </div>
            </div>

            {/* 3 Interactive Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => onUpdate({ ...review, mode: 'express' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'express'
                    ? 'bg-purple-500/20 border-purple-500 text-slate-900 dark:text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-400'
                    : 'bg-white/60 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">15 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    Express
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cierre sintético y descarga rápida de tensiones.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ ...review, mode: 'balanced' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'balanced'
                    ? 'bg-purple-500/20 border-purple-500 text-slate-900 dark:text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-400'
                    : 'bg-white/60 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">30 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    Equilibrado
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ritmo óptimo: Magia, Tikún y Conciencia Verbal completa.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onUpdate({ ...review, mode: 'deep' })}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mode === 'deep'
                    ? 'bg-purple-500/20 border-purple-500 text-slate-900 dark:text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-400'
                    : 'bg-white/60 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">45 Minutos</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                    Profundo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Autocrítica rigurosa y reprogramación subconsciente profunda.
                </p>
              </button>
            </div>

            {/* Giant Primary Action Button */}
            <button
              onClick={() => setShowGuidedModal(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Iniciar Sesión Guiada de Noche con Temporizador ({selectedMinutes} Min)</span>
            </button>
          </div>

          {/* SECTION 1: QUÉ VICTORIA TUVE EL DÍA DE HOY */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">¿Qué victoria tuve el día de hoy?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reconoce tu conquista interna o ejecutiva más destacada.</p>
              </div>
            </div>

            <textarea
              rows={3}
              value={mainVictory}
              onChange={(e) => onUpdate({ ...review, mainVictory: e.target.value })}
              placeholder="Tener una introspección más clara de mí mismo y qué debo mejorar..."
              className="w-full bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-4 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* SECTION 2: QUÉ MOMENTO DE MAGIA TUVE & TIKÚN */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">¿Qué momento de magia tuve?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Saber qué tikún tocar y ser consciente de que muchas personas dependen de que no falles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">Momento de Magia / Sincronicidad</label>
                <textarea
                  rows={3}
                  value={magicMoment}
                  onChange={(e) => onUpdate({ ...review, magicMoment: e.target.value })}
                  placeholder="Saber qué tikún tocar y sentir el fluir de la providencia..."
                  className="w-full bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">Sentido de Tikún & Responsabilidad</label>
                <textarea
                  rows={3}
                  value={tikunReflection}
                  onChange={(e) => onUpdate({ ...review, tikunReflection: e.target.value })}
                  placeholder="Saber que muchas familias y personas dependen de que yo no falle..."
                  className="w-full bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: APRENDIZAJES (COSAS QUE PASABA POR ALTO) */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Aprendizajes (Cosas que pasaba por alto)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aquello que parecía insignificante y fácil de superar, pero requería enfoque.</p>
              </div>
            </div>

            <form onSubmit={handleAddLesson} className="flex gap-2">
              <input
                type="text"
                placeholder="Añade una lección que pasabas por alto..."
                value={newLessonInput}
                onChange={(e) => setNewLessonInput(e.target.value)}
                className="flex-1 bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir</span>
              </button>
            </form>

            <div className="space-y-2">
              {missedLessons.map((lesson, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{lesson}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveLesson(idx)}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: FRACASOS DEL DÍA (3) & POSIBLES SOLUCIONES */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Fracasos del Día (3) & Posibles Soluciones</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Registra desvíos sin autoengaño (ej: cobranza) y define soluciones operativas.</p>
              </div>
            </div>

            <form onSubmit={handleAddFailureSolution} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200 dark:border-purple-500/20">
              <input
                type="text"
                placeholder="Fracaso (ej: No cobrar más en la cobranza)..."
                value={newFailureInput}
                onChange={(e) => setNewFailureInput(e.target.value)}
                className="bg-white dark:bg-black/60 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Posible Solución (ej: Motivar al dpto de cobranza)..."
                  value={newSolutionInput}
                  onChange={(e) => setNewSolutionInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-black/60 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {failuresList.map((pair, idx) => (
                <div
                  key={pair.id || idx}
                  className="p-4 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-500 dark:text-rose-400">Fracaso #{idx + 1}:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{pair.failure}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-purple-700 dark:text-purple-300">Solución:</span>
                      <span className="text-purple-900 dark:text-purple-200/90">{pair.solution}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFailureSolution(pair.id)}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer self-end sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: CONCIENCIA VERBAL (CHECKLIST INTERACTIVO DE 9 PUNTOS) */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Conciencia Verbal (9 Puntos de Autogobierno)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Evalúa tu coherencia entre lo pensado, dicho y ejecutado.</p>
                </div>
              </div>

              <span className="text-xs font-bold text-purple-800 dark:text-purple-300 bg-purple-500/15 dark:bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                {verbalItems.filter((i) => i.checked).length} / {verbalItems.length} cumplidos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {verbalItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleVerbalItem(item.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                    item.checked
                      ? 'bg-purple-500/15 dark:bg-purple-950/30 border-purple-500/40 text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'bg-slate-100/60 dark:bg-black/40 border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:border-purple-500/30'
                  }`}
                >
                  <div className="shrink-0">
                    {item.checked ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 hover:text-purple-500" />
                    )}
                  </div>
                  <span className={`flex-1 ${item.checked ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 6: QUÉ HICE HOY QUE NUNCA ANTES HACÍA */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">¿Qué hice hoy que nunca antes hacía?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Expansión de tus límites (ej. contar tus experiencias y abrirte con los tuyos).</p>
              </div>
            </div>

            <textarea
              rows={2}
              value={newThingsDone}
              onChange={(e) => onUpdate({ ...review, newThingsDone: e.target.value })}
              placeholder="Contar mis experiencias, atreverme a liderar desde la vulnerabilidad..."
              className="w-full bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-4 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* SECTION 7: PETICIÓN SUBCONSCIENTE (30 VECES EN LA MENTE) */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-100/80 via-white/80 to-purple-50/50 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-[#080b11] border border-purple-500/35 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-700 dark:text-purple-300">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Petición Subconsciente (30 Veces en la Mente)</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Repite tu orden o decreto con intensidad antes de que el sueño te venza.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-purple-800 dark:text-purple-300 bg-purple-500/20 px-3 py-1 rounded-xl border border-purple-500/30">
                  {subconsciousCount} / 30
                </span>
                <button
                  type="button"
                  onClick={handleResetSubconscious}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Reiniciar contador a 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Decree Text Input */}
            <input
              type="text"
              value={subconsciousText}
              onChange={(e) => onUpdate({ ...review, subconsciousRequestText: e.target.value })}
              placeholder="Escribe aquí tu petición o decreto mental..."
              className="w-full bg-white dark:bg-black/50 border border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-purple-900 dark:text-purple-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />

            {/* Interactive Pulse Button to Tap 30 Times */}
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <button
                type="button"
                onClick={handleIncrementSubconscious}
                className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer select-none active:scale-95 ${
                  subconsciousCount >= 30
                    ? 'bg-purple-600 border-purple-300 text-white shadow-purple-500/50'
                    : 'bg-gradient-to-tr from-purple-200 via-indigo-100 to-purple-300 dark:from-purple-900/60 dark:via-purple-700/40 dark:to-indigo-600/50 border-purple-400/60 hover:border-purple-500 dark:hover:border-purple-300 text-purple-900 dark:text-purple-200 hover:scale-105'
                }`}
              >
                <Moon className="w-6 h-6 mb-1" />
                <span className="text-xl font-extrabold tracking-tight">
                  {subconsciousCount}/30
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                  {subconsciousCount >= 30 ? '¡Listo!' : 'Tocar'}
                </span>
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-sm">
                Cierra los ojos, repite la orden en tu mente y pulsa en cada repetición hasta completar las 30.
              </p>
            </div>
          </div>

          {/* SECTION 8: CONCLUSIÓN DEL DÍA */}
          <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Conclusión del Día & Paz Invencible</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">El día concluyó. Has dado lo mejor de ti. Descansa con serenidad.</p>
              </div>
            </div>

            <textarea
              rows={3}
              value={dayConclusion}
              onChange={(e) => onUpdate({ ...review, dayConclusion: e.target.value })}
              placeholder="Conclusión del día..."
              className="w-full bg-slate-100/70 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-4 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* TAB 2: PERSONALIZAR (Twin Constructor for Night Phases) */}
      {activeTab === 'builder' && (
        <HabitBuilderView
          habits={habits}
          onUpdateHabits={(updated) => onUpdate({ ...review, customHabits: updated })}
          onResetDefaults={() => onUpdate({ ...review, customHabits: SUPER_NOCHE_HABITS })}
          theme="purple"
        />
      )}

      {/* TAB 3: PROGRESO */}
      {activeTab === 'progress' && (
        <ProgressView
          logs={review.nightLogs || []}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          theme="purple"
        />
      )}

      {/* TAB 4: PREPARACIÓN DE MAÑANA (Moved here from morning!) */}
      {activeTab === 'prep' && (
        <NightPrepView
          items={nightPrepItems}
          onUpdateItems={(items) => onUpdate({ ...review, nightPrepItems: items })}
          onNavigateToSuperNight={undefined}
        />
      )}

      {/* Guided Night Introspection Modal */}
      {showGuidedModal && (
        <SuperNightGuidedModal
          review={review}
          mode={mode}
          onClose={() => setShowGuidedModal(false)}
          onFinishSession={(updated) => {
            onUpdate(updated);
            setShowGuidedModal(false);
          }}
        />
      )}
    </div>
  );
};
