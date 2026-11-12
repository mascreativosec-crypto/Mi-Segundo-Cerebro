import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ISuperNightReview, FailureSolutionPair, VerbalAwarenessCheck } from '../../types';
import { RoutineMode } from '../../types/super-morning';
import { zenAudio } from '../../utils/audio';
import { appNotifications } from '../../utils/notifications';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  BookOpen,
  Target,
  ShieldCheck,
  Moon,
  Star,
  Plus,
  Trash2,
  Circle,
} from 'lucide-react';

interface SuperNightGuidedModalProps {
  review: ISuperNightReview;
  mode: RoutineMode;
  onClose: () => void;
  onFinishSession: (updatedReview: ISuperNightReview) => void;
}

export const SuperNightGuidedModal: React.FC<SuperNightGuidedModalProps> = ({
  review,
  mode,
  onClose,
  onFinishSession,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Editable review clone state
  const [localReview, setLocalReview] = useState<ISuperNightReview>({ ...review });

  // Inputs for lessons and failures
  const [newLesson, setNewLesson] = useState('');
  const [newFailure, setNewFailure] = useState('');
  const [newSolution, setNewSolution] = useState('');

  // 7 Guided Steps
  const STEPS = [
    {
      id: 'step_victory',
      title: 'Victoria del Día',
      subtitle: 'Reconoce tu conquista interna o ejecutiva más destacada.',
      icon: Award,
    },
    {
      id: 'step_magic_tikun',
      title: 'Momento de Magia & Sentido de Tikún',
      subtitle: 'Saber qué tikún tocar y ser consciente de que muchas personas dependen de que no falles.',
      icon: Sparkles,
    },
    {
      id: 'step_lessons',
      title: 'Aprendizajes que Pasaba por Alto',
      subtitle: 'Aquello que parecía insignificante y fácil de superar, pero requería método.',
      icon: BookOpen,
    },
    {
      id: 'step_failures',
      title: 'Fracasos del Día & Soluciones',
      subtitle: 'Reconoce desvíos (ej: cobranza) y define soluciones operativas.',
      icon: Target,
    },
    {
      id: 'step_verbal',
      title: 'Conciencia Verbal (9 Puntos de Autogobierno)',
      subtitle: 'Evalúa tu coherencia entre lo pensado, dicho y ejecutado hoy.',
      icon: ShieldCheck,
    },
    {
      id: 'step_subconscious',
      title: 'Petición Subconsciente (30 Repeticiones)',
      subtitle: 'Repite tu orden o decreto con intensidad antes de que el sueño te venza.',
      icon: Moon,
    },
    {
      id: 'step_conclusion',
      title: 'Conclusión del Día & Paz Invencible',
      subtitle: 'El día terminó, diste tu máximo esfuerzo. Cierra con serenidad.',
      icon: Star,
    },
  ];

  const currentStep = STEPS[currentIndex];

  // Base minutes per step according to mode
  const getStepDuration = (idx: number): number => {
    const factor = mode === 'express' ? 0.5 : mode === 'deep' ? 1.5 : 1.0;
    // Special steps like subconscious decree
    if (idx === 4 || idx === 5) return Math.round(180 * factor); // 3 minutes
    return Math.round(120 * factor); // 2 minutes
  };

  const [currentStepSecondsLeft, setCurrentStepSecondsLeft] = useState<number>(() => getStepDuration(0));
  const stepTotalDuration = getStepDuration(currentIndex);
  const warnedRef = useRef(false);

  useEffect(() => {
    zenAudio.playDawnBell();
    appNotifications.send('Iniciando Súper Noche', {
      body: `Fase 1: ${STEPS[0].title}`,
    });
  }, []);

  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const timer = setInterval(() => {
      setTotalElapsedSeconds((prev) => prev + 1);

      setCurrentStepSecondsLeft((prev) => {
        if (prev === 11 && !warnedRef.current) {
          zenAudio.playWarningTick();
          warnedRef.current = true;
        }

        if (prev <= 1) {
          handleNextStep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentIndex, isCompleted]);

  const handleNextStep = () => {
    warnedRef.current = false;
    if (currentIndex < STEPS.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextDuration = getStepDuration(nextIdx);
      setCurrentStepSecondsLeft(nextDuration);
      zenAudio.playTransitionChime();
      appNotifications.send(`Paso ${nextIdx + 1} de ${STEPS.length}`, {
        body: STEPS[nextIdx].title,
      });
    } else {
      setIsCompleted(true);
      setIsRunning(false);
      zenAudio.playFinishGong();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#818cf8', '#c084fc', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      warnedRef.current = false;
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevDuration = getStepDuration(prevIdx);
      setCurrentStepSecondsLeft(prevDuration);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    zenAudio.setSoundEnabled(nextVal);
  };

  const handleAddExtraTime = (seconds: number) => {
    setCurrentStepSecondsLeft((prev) => prev + seconds);
  };

  const handleToggleVerbal = (id: string) => {
    const items = localReview.verbalAwareness || [];
    const updated = items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
    setLocalReview({ ...localReview, verbalAwareness: updated });
  };

  const handleIncrementSubconscious = () => {
    const current = localReview.subconsciousRequestCount || 0;
    const nextVal = Math.min(30, current + 1);
    setLocalReview({ ...localReview, subconsciousRequestCount: nextVal });
    if (nextVal === 30) {
      zenAudio.playFinishGong();
    } else {
      zenAudio.playWarningTick();
    }
  };

  const handleAddLessonItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.trim()) return;
    const current = localReview.missedLessons || [];
    setLocalReview({ ...localReview, missedLessons: [...current, newLesson.trim()] });
    setNewLesson('');
  };

  const handleRemoveLessonItem = (idx: number) => {
    const current = localReview.missedLessons || [];
    setLocalReview({ ...localReview, missedLessons: current.filter((_, i) => i !== idx) });
  };

  const handleAddFailureItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFailure.trim() || !newSolution.trim()) return;
    const current = localReview.failuresAndSolutions || [];
    const newPair: FailureSolutionPair = {
      id: `fs_${Date.now()}`,
      failure: newFailure.trim(),
      solution: newSolution.trim(),
    };
    setLocalReview({ ...localReview, failuresAndSolutions: [...current, newPair] });
    setNewFailure('');
    setNewSolution('');
  };

  const handleRemoveFailureItem = (id: string) => {
    const current = localReview.failuresAndSolutions || [];
    setLocalReview({ ...localReview, failuresAndSolutions: current.filter((f) => f.id !== id) });
  };

  const handleFinish = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStreak = (localReview.currentStreak || 0) + 1;
    const updated: ISuperNightReview = {
      ...localReview,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentStreak: newStreak,
      bestStreak: Math.max(localReview.bestStreak || 0, newStreak),
      nightLogs: [
        {
          date: todayStr,
          mode: mode,
          totalDurationSeconds: totalElapsedSeconds,
          completedHabitIds: ['introspeccion', 'tikun', 'aprendizajes', 'fracasos', 'conciencia_verbal', 'subconsciente', 'conclusion'],
          responses: {},
          sleepTargetHours: localReview.plannedSleepHours || 7.5,
          nightRating: localReview.dayRating || 5,
        },
        ...(localReview.nightLogs || []).filter((l) => l.date !== todayStr),
      ],
    };
    onFinishSession(updated);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = stepTotalDuration > 0
    ? Math.max(0, Math.min(100, Math.round(((stepTotalDuration - currentStepSecondsLeft) / stepTotalDuration) * 100)))
    : 0;

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-purple-500/20 bg-slate-50/80 dark:bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Sesión Guiada de la Noche</span>
                <span className="text-[11px] font-semibold bg-purple-500/15 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-lg border border-purple-500/30">
                  Modo {mode === 'express' ? 'Express' : mode === 'deep' ? 'Profundo' : 'Equilibrado'}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Paso {currentIndex + 1} de {STEPS.length} · Tiempo: {formatTime(totalElapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-800 dark:text-purple-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Silenciar campanadas' : 'Activar campanadas zen'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1 flex">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-full flex-1 transition-all ${
                i < currentIndex
                  ? 'bg-purple-600'
                  : i === currentIndex
                  ? 'bg-purple-400 animate-pulse'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        {isCompleted ? (
          <div className="p-8 sm:p-12 text-center space-y-6 overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-purple-500/25">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">¡Súper Noche Conquistada!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-2">
                Has examinado tu día con rectitud y paz. Tu mente descansa en serenidad y mañana despertarás renovado.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-purple-500/20 max-w-md mx-auto grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tiempo de Cierre</span>
                <span className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1 block">
                  {formatTime(totalElapsedSeconds)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Fases Completadas</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {STEPS.length}/{STEPS.length}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleFinish}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                Guardar y Cerrar Jornada
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Split: Timer & Step Details */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-purple-500/20">
              {/* Circular SVG Timer */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="w-44 h-44 transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r={radius}
                    stroke="rgba(168, 85, 247, 0.15)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r={radius}
                    stroke="#a855f7"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {formatTime(currentStepSecondsLeft)}
                  </span>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
                    {progressPercent}% completado
                  </span>
                  <button
                    onClick={() => handleAddExtraTime(60)}
                    className="text-xs text-slate-400 hover:text-purple-600 mt-1 cursor-pointer font-medium"
                  >
                    +1 min
                  </button>
                </div>
              </div>

              {/* Step Information */}
              <div className="flex-1 space-y-2.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-purple-700 dark:text-purple-300">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                    <StepIcon className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Fase {currentIndex + 1} de {STEPS.length}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentStep.subtitle}
                </p>
              </div>
            </div>

            {/* Interactive Step Content */}
            <div className="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-purple-500/20 space-y-4 shadow-xs">
              {/* Step 1: Victoria */}
              {currentIndex === 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    ¿Cuál fue tu mayor victoria o conquista interna hoy?
                  </label>
                  <textarea
                    rows={3}
                    value={localReview.mainVictory || ''}
                    onChange={(e) => setLocalReview({ ...localReview, mainVictory: e.target.value })}
                    placeholder="Escribe tu victoria más clara hoy..."
                    className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-4 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Step 2: Magia & Tikun */}
              {currentIndex === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">
                      Momento de Magia / Sincronicidad
                    </label>
                    <textarea
                      rows={3}
                      value={localReview.magicMoment || ''}
                      onChange={(e) => setLocalReview({ ...localReview, magicMoment: e.target.value })}
                      placeholder="Momento de magia y sincronicidad..."
                      className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-700 dark:text-purple-300 block">
                      Sentido de Tikún & Responsabilidad
                    </label>
                    <textarea
                      rows={3}
                      value={localReview.tikunReflection || ''}
                      onChange={(e) => setLocalReview({ ...localReview, tikunReflection: e.target.value })}
                      placeholder="Personas que dependen de que yo no falle..."
                      className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Aprendizajes */}
              {currentIndex === 2 && (
                <div className="space-y-3">
                  <form onSubmit={handleAddLessonItem} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Añade un aprendizaje que pasabas por alto..."
                      value={newLesson}
                      onChange={(e) => setNewLesson(e.target.value)}
                      className="flex-1 bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </form>

                  <div className="space-y-2">
                    {(localReview.missedLessons || []).map((lesson, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] text-xs text-slate-800 dark:text-slate-200"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                          <span>{lesson}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLessonItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Fracasos & Soluciones */}
              {currentIndex === 3 && (
                <div className="space-y-3">
                  <form onSubmit={handleAddFailureItem} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Fracaso del día..."
                      value={newFailure}
                      onChange={(e) => setNewFailure(e.target.value)}
                      className="bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Solución operativa..."
                        value={newSolution}
                        onChange={(e) => setNewSolution(e.target.value)}
                        className="flex-1 bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {(localReview.failuresAndSolutions || []).map((pair) => (
                      <div
                        key={pair.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            <span className="text-rose-500 font-bold">Desvío:</span> {pair.failure}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300">
                            <span className="text-purple-700 dark:text-purple-300 font-bold">Solución:</span> {pair.solution}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFailureItem(pair.id)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Conciencia Verbal */}
              {currentIndex === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(localReview.verbalAwareness || []).map((item: VerbalAwarenessCheck) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleVerbal(item.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        item.checked
                          ? 'bg-purple-500/15 dark:bg-purple-950/30 border-purple-500/40 text-purple-900 dark:text-purple-200'
                          : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                      )}
                      <span className={item.checked ? 'font-medium' : ''}>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 6: Peticion Subconsciente */}
              {currentIndex === 5 && (
                <div className="space-y-4 text-center">
                  <input
                    type="text"
                    value={localReview.subconsciousRequestText || ''}
                    onChange={(e) => setLocalReview({ ...localReview, subconsciousRequestText: e.target.value })}
                    placeholder="Escribe tu petición o decreto mental..."
                    className="w-full bg-white dark:bg-black/50 border border-purple-500/30 rounded-2xl px-4 py-2.5 text-xs text-purple-900 dark:text-purple-100 focus:outline-none focus:border-purple-500 font-medium"
                  />

                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <button
                      type="button"
                      onClick={handleIncrementSubconscious}
                      className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer active:scale-95 ${
                        (localReview.subconsciousRequestCount || 0) >= 30
                          ? 'bg-purple-600 border-purple-300 text-white shadow-purple-500/50'
                          : 'bg-gradient-to-tr from-purple-200 via-indigo-100 to-purple-300 dark:from-purple-900/60 dark:via-purple-700/40 dark:to-indigo-600/50 border-purple-400/60 text-purple-900 dark:text-purple-200'
                      }`}
                    >
                      <Moon className="w-5 h-5 mb-0.5" />
                      <span className="text-base font-bold">
                        {localReview.subconsciousRequestCount || 0}/30
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
                        {(localReview.subconsciousRequestCount || 0) >= 30 ? '¡Listo!' : 'Tocar'}
                      </span>
                    </button>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                      Repite en tu mente y pulsa en cada repetición hasta llegar a 30.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 7: Conclusión & Calificación */}
              {currentIndex === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Evaluación de tu Jornada
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setLocalReview({ ...localReview, dayRating: star })}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= (localReview.dayRating || 5)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Conclusión del Día & Paz Invencible
                    </label>
                    <textarea
                      rows={3}
                      value={localReview.dayConclusion || ''}
                      onChange={(e) => setLocalReview({ ...localReview, dayConclusion: e.target.value })}
                      placeholder="Cierra tu jornada en paz..."
                      className="w-full bg-white dark:bg-black/50 border border-slate-300 dark:border-purple-500/20 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Playback Controls */}
        {!isCompleted && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-purple-500/20 bg-slate-50/80 dark:bg-black/40">
            <button
              onClick={handlePrevStep}
              disabled={currentIndex === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStepSecondsLeft(getStepDuration(currentIndex))}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Reiniciar temporizador del paso"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/30 transition-transform active:scale-95 cursor-pointer"
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNextStep}
                className="px-4 py-2.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{currentIndex === STEPS.length - 1 ? 'Concluir' : 'Siguiente Paso'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNextStep}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Saltar</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
