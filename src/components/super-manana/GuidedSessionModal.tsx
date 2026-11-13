import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SuperMorningHabit, RoutineMode } from '../../types/super-morning';
import { zenAudio } from '../../utils/audio';
import { appNotifications } from '../../utils/notifications';
import { IconRenderer } from './IconRenderer';
import { PromptFieldRenderer } from './PromptFieldRenderer';
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
  Dumbbell,
} from 'lucide-react';

interface GuidedSessionModalProps {
  habits: SuperMorningHabit[];
  mode: RoutineMode;
  onClose: () => void;
  onFinishSession: (responses: Record<string, Record<string, any>>, totalSeconds: number) => void;
  aiQuotes?: Record<string, string>;
  onOpenPhysicalTrainer?: () => void;
}

export const GuidedSessionModal: React.FC<GuidedSessionModalProps> = ({
  habits,
  mode,
  onClose,
  onFinishSession,
  aiQuotes = {},
  onOpenPhysicalTrainer,
}) => {
  const activeHabits = habits.filter((h) => h.enabled);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [responses, setResponses] = useState<Record<string, Record<string, any>>>({});
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Determine current habit target duration in seconds based on mode
  const currentHabit = activeHabits[currentIndex];

  const getDurationForHabit = (h: SuperMorningHabit): number => {
    if (!h) return 60;
    if (mode === 'express') return (h.expressMinutes || 1) * 60;
    if (mode === 'deep') return (h.deepMinutes || 5) * 60;
    return (h.defaultMinutes || 2) * 60;
  };

  const [currentStepSecondsLeft, setCurrentStepSecondsLeft] = useState<number>(() => {
    return activeHabits.length > 0 ? getDurationForHabit(activeHabits[0]) : 60;
  });

  const stepTotalDuration = currentHabit ? getDurationForHabit(currentHabit) : 60;
  const warnedRef = useRef(false);

  // Play start sound on initial mount
  useEffect(() => {
    zenAudio.playDawnBell();
    appNotifications.send('Iniciando Súper Mañana', {
      body: `Fase 1: ${activeHabits[0]?.title || 'Activación'}`,
    });
  }, []);

  // Timer interval
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const timer = setInterval(() => {
      setTotalElapsedSeconds((prev) => prev + 1);

      setCurrentStepSecondsLeft((prev) => {
        // Warning chime at 10 seconds remaining
        if (prev === 11 && !warnedRef.current) {
          zenAudio.playWarningTick();
          warnedRef.current = true;
        }

        if (prev <= 1) {
          // Time expired for this habit, advance automatically or wait
          handleNextHabit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentIndex, isCompleted]);

  // When switching habits, reset step timer and play transition chime
  const handleNextHabit = () => {
    warnedRef.current = false;
    if (currentIndex < activeHabits.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextDuration = getDurationForHabit(activeHabits[nextIdx]);
      setCurrentStepSecondsLeft(nextDuration);
      zenAudio.playTransitionChime();
      appNotifications.send(`Fase ${nextIdx + 1} de ${activeHabits.length}`, {
        body: activeHabits[nextIdx].title,
      });
    } else {
      // Completed all habits!
      setIsCompleted(true);
      setIsRunning(false);
      zenAudio.playFinishGong();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#38bdf8'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handlePrevHabit = () => {
    if (currentIndex > 0) {
      warnedRef.current = false;
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevDuration = getDurationForHabit(activeHabits[prevIdx]);
      setCurrentStepSecondsLeft(prevDuration);
    }
  };

  const handleFieldChange = (fieldId: string, val: any) => {
    if (!currentHabit) return;
    setResponses((prev) => ({
      ...prev,
      [currentHabit.id]: {
        ...(prev[currentHabit.id] || {}),
        [fieldId]: val,
      },
    }));
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    zenAudio.setSoundEnabled(nextVal);
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    setCurrentStepSecondsLeft((prev) => Math.max(5, prev + deltaSeconds));
  };

  const handleFinish = () => {
    onFinishSession(responses, totalElapsedSeconds);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Circular progress math (Larger timer ring)
  const progressPercent = stepTotalDuration > 0
    ? Math.max(0, Math.min(100, Math.round(((stepTotalDuration - currentStepSecondsLeft) / stepTotalDuration) * 100)))
    : 0;

  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-amber-500/20 bg-slate-50/80 dark:bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-black shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Sesión Guiada de la Mañana</span>
                <span className="text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  Modo {mode === 'express' ? 'Express' : mode === 'deep' ? 'Profundo' : 'Equilibrado'}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Paso {currentIndex + 1} de {activeHabits.length} · Tiempo: {formatTime(totalElapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
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
          {activeHabits.map((h, i) => (
            <div
              key={h.id}
              className={`h-full flex-1 transition-all ${
                i < currentIndex
                  ? 'bg-amber-500'
                  : i === currentIndex
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        {isCompleted ? (
          <div className="p-8 sm:p-12 text-center space-y-6 overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 mx-auto flex items-center justify-center text-black shadow-xl shadow-amber-500/25">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">¡Súper Mañana Conquistada!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mt-2">
                Has iniciado tu jornada alineando tu mente, cuerpo y espíritu. Tu claridad y temple están al máximo.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-amber-500/20 max-w-md mx-auto grid grid-cols-2 gap-4 text-center">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tiempo Invertido</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                  {formatTime(totalElapsedSeconds)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Hábitos Cumplidos</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {activeHabits.length}/{activeHabits.length}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleFinish}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                Guardar y Concluir Rutina
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Split: Timer & Habit Identity */}
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-amber-500/20">
              {/* Enlarged Circular SVG Timer with -15s / +15s / +1 min controls */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative w-56 h-56 flex items-center justify-center">
                  <svg className="w-56 h-56 transform -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r={radius}
                      stroke="rgba(245, 158, 11, 0.15)"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r={radius}
                      stroke="#f59e0b"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-300"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {formatTime(currentStepSecondsLeft)}
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      {progressPercent}% completado
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-15)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
                  >
                    -15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(15)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/30 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(60)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    +1 min
                  </button>
                </div>
              </div>

              {/* Habit Details */}
              <div className="flex-1 space-y-2.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-amber-600 dark:text-amber-400">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <IconRenderer name={currentHabit?.icon || 'Sparkles'} className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Fase {currentIndex + 1} · {currentHabit?.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentHabit?.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentHabit?.subtitle}
                </p>

                {currentHabit?.stoicQuote && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 text-xs italic text-amber-800 dark:text-amber-200/90 font-serif">
                    "{currentHabit.stoicQuote}"
                  </div>
                )}

                {currentHabit && aiQuotes[currentHabit.id] && (
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                    <span className="text-[10px] font-bold uppercase block text-indigo-600 dark:text-indigo-400 mb-0.5">
                      Mensaje IA del Día
                    </span>
                    "{aiQuotes[currentHabit.id]}"
                  </div>
                )}

                {currentHabit?.linkToFitness && onOpenPhysicalTrainer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPhysicalTrainer();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 cursor-pointer"
                  >
                    <Dumbbell className="w-3.5 h-3.5" />
                    <span>Abrir Mi Entrenador Físico</span>
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            {currentHabit?.instructions && currentHabit.instructions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Pautas de Ejecución</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {currentHabit.instructions.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-amber-500/15 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Interactive Fields */}
            {currentHabit?.fields && currentHabit.fields.length > 0 && (
              <div className="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-amber-500/20 space-y-4 shadow-xs">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Registro & Reflexión de la Fase</span>
                {currentHabit.fields.map((f) => (
                  <PromptFieldRenderer
                    key={f.id}
                    field={f}
                    value={responses[currentHabit.id]?.[f.id]}
                    onChange={(val) => handleFieldChange(f.id, val)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Playback Controls */}
        {!isCompleted && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/80 dark:border-amber-500/20 bg-slate-50/80 dark:bg-black/40">
            <button
              onClick={handlePrevHabit}
              disabled={currentIndex === 0}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStepSecondsLeft(getDurationForHabit(currentHabit))}
                className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Reiniciar temporizador del paso"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform active:scale-95 cursor-pointer"
              >
                {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleNextHabit}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{currentIndex === activeHabits.length - 1 ? 'Concluir' : 'Siguiente Paso'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNextHabit}
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
