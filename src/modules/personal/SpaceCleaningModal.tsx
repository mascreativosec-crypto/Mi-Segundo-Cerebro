import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Home,
  Star,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
} from 'lucide-react';
import { CleaningStepItem, PersonalRitualLog } from '../../types';

interface SpaceCleaningModalProps {
  steps: CleaningStepItem[];
  onUpdateSteps: (steps: CleaningStepItem[]) => void;
  onClose: () => void;
  onSaveLog: (log: Omit<PersonalRitualLog, 'id' | 'completedAt'>) => void;
}

export const SpaceCleaningModal: React.FC<SpaceCleaningModalProps> = ({
  steps,
  onUpdateSteps,
  onClose,
  onSaveLog,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Edit / customize steps mode
  const [isEditingSteps, setIsEditingSteps] = useState<boolean>(false);
  const [draftSteps, setDraftSteps] = useState<CleaningStepItem[]>(steps);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setDraftSteps(steps);
  }, [steps]);

  const activeSteps = steps.length > 0 ? steps : draftSteps;
  const safeIdx = Math.min(currentStepIdx, Math.max(activeSteps.length - 1, 0));
  const currentStep = activeSteps[safeIdx];

  const playZenBell = (freq = 432) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3);
    } catch {
      // Audio fallback silent
    }
  };

  useEffect(() => {
    playZenBell(528);
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0 || isEditingSteps) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          playZenBell(396);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, isEditingSteps]);

  const handleSelectMinutes = (mins: number) => {
    setSelectedMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(true);
    playZenBell(440);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const isAlready = prev.includes(stepId);
      const next = isAlready ? prev.filter((id) => id !== stepId) : [...prev, stepId];
      if (!isAlready) {
        playZenBell(660);
      }
      return next;
    });
  };

  const handleNextStep = () => {
    if (!currentStep) return;
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps((prev) => [...prev, currentStep.id]);
    }
    playZenBell(587);
    if (safeIdx < activeSteps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinishRitual = () => {
    onSaveLog({
      type: 'space_cleaning',
      title: 'Ritual de Limpieza de mi Cuarto',
      durationMinutes: selectedMinutes,
      notes: notes || 'Espacio físico oxigenado, cama y escritorio despejados.',
      rating,
      actionTaken: 'archived',
    });
    onClose();
  };

  // --- Editing steps handlers ---
  const updateDraftStep = (id: string, patch: Partial<CleaningStepItem>) => {
    setDraftSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const moveDraftStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= draftSteps.length) return;
    setDraftSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const addDraftStep = () => {
    const nextNum = draftSteps.length + 1;
    setDraftSteps((prev) => [
      ...prev,
      {
        id: `step_${Date.now()}`,
        phase: `Fase ${nextNum} · Nueva Zona`,
        title: 'Nueva actividad de orden',
        description: 'Define qué área o superficie vas a despejar en esta fase.',
        tips: ['Acción rápida 1', 'Acción rápida 2'],
      },
    ]);
  };

  const deleteDraftStep = (id: string) => {
    if (draftSteps.length <= 1) return;
    setDraftSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveEditedSteps = () => {
    const cleaned = draftSteps.filter((s) => s.title.trim() !== '');
    if (cleaned.length > 0) {
      onUpdateSteps(cleaned);
    }
    setCurrentStepIdx(0);
    setIsEditingSteps(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-indigo-500/30 dark:border-white/[0.12] shadow-2xl p-6 md:p-8 space-y-6 my-auto transition-all max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Home className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Ritual de Limpieza de mi Cuarto
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tu entorno físico es la extensión de tu mente. Personaliza tus fases y ejecútalas con calma.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingSteps((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEditingSteps
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingSteps ? 'Volver al Ritual' : 'Editar Fases'}</span>
            </button>
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isEditingSteps ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Personalizar Fases & Pautas ({draftSteps.length})
              </span>
              <button
                type="button"
                onClick={addDraftStep}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Fase</span>
              </button>
            </div>

            <div className="space-y-3">
              {draftSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Paso #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveDraftStep(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDraftStep(idx, 1)}
                        disabled={idx === draftSteps.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {draftSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteDraftStep(step.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={step.phase}
                      onChange={(e) => updateDraftStep(step.id, { phase: e.target.value })}
                      placeholder="Etiqueta de fase"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateDraftStep(step.id, { title: e.target.value })}
                      placeholder="Título de la fase"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => updateDraftStep(step.id, { description: e.target.value })}
                    placeholder="Descripción o propósito..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Pautas de acción (una por línea)
                    </label>
                    <textarea
                      rows={2}
                      value={step.tips.join('\n')}
                      onChange={(e) =>
                        updateDraftStep(step.id, {
                          tips: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDraftSteps(steps);
                  setIsEditingSteps(false);
                }}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSteps}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios de Fases</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Timer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Duración:
                </span>
                {[10, 15, 25].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSelectMinutes(mins)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedMinutes === mins
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {formatTime(secondsRemaining)}
                </span>
                <button
                  onClick={() => setIsRunning((prev) => !prev)}
                  className="p-1.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white transition-all cursor-pointer"
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSelectMinutes(selectedMinutes)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Phase Progress Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activeSteps.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = idx === safeIdx && !isFinished;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setIsFinished(false);
                      setCurrentStepIdx(idx);
                    }}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-100/60 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold">Fase {idx + 1}</span>
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <span className="text-[11px] font-semibold block truncate">
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Content */}
            {!isFinished && currentStep ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/90 dark:border-white/[0.08] space-y-4">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                    {currentStep.phase}
                  </span>
                  <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {currentStep.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Pautas de acción rápida:
                  </span>
                  {currentStep.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => handleToggleStep(currentStep.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                  >
                    {completedSteps.includes(currentStep.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                    <span>Marcar fase como realizada</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <span>{safeIdx < activeSteps.length - 1 ? 'Siguiente Fase' : 'Completar Ritual'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4 text-center">
                <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    ¡Tu santuario está limpio y en armonía!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                    Has completado las {activeSteps.length} fases. Disfruta la claridad mental que produce el orden físico.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    ¿Qué nivel de paz y claridad sientes ahora?
                  </span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nota personal opcional (ej. 'Cama impecable, aroma a lavanda')"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-black/40 border border-slate-200/90 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />

                <button
                  onClick={handleFinishRitual}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Guardar Ritual y Cerrar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
