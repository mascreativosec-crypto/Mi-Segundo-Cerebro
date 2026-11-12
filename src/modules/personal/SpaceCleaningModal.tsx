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
  Flame
} from 'lucide-react';
import { PersonalRitualLog } from '../../types';

interface SpaceCleaningModalProps {
  onClose: () => void;
  onSaveLog: (log: Omit<PersonalRitualLog, 'id' | 'completedAt'>) => void;
}

interface StepItem {
  id: string;
  phase: string;
  title: string;
  description: string;
  tips: string[];
}

const CLEANING_STEPS: StepItem[] = [
  {
    id: 'step_1',
    phase: 'Fase 1 · Ventilación & Luz',
    title: 'Oxigenar el Espacio y Activar el Entorno',
    description: 'Abre las ventanas de par en par, sube las persianas al máximo y deja que la luz y el aire fresco renueven la energía de tu cuarto.',
    tips: [
      'Abre la ventana y la puerta para crear corriente de aire cruzado.',
      'Pon una lista de música suave o instrumental.',
      'Toma un vaso de agua antes de iniciar el movimiento físico.'
    ]
  },
  {
    id: 'step_2',
    phase: 'Fase 2 · Superficies Clave',
    title: 'Hacer la Cama & Vaciar el Escritorio',
    description: 'La cama es el ancla visual de tu habitación y el escritorio es el ancla de tu mente. Despejarlos produce el 80% del impacto visual en 5 minutos.',
    tips: [
      'Tiende la cama estirando bien las sábanas y almohadas.',
      'Lleva toda vajilla, tazas de café o vasos a la cocina de inmediato.',
      'Retira papeles, recibos o envoltorios sueltos del escritorio.'
    ]
  },
  {
    id: 'step_3',
    phase: 'Fase 3 · Método de 3 Destinos',
    title: 'Clasificación Rápida y sin Titubeos',
    description: 'No te detengas a recordar anécdotas. Todo lo que esté fuera de lugar va a uno de 3 destinos: a su sitio, a donar/mover, o a la papelera.',
    tips: [
      'Ropa limpia colgada o guardada; ropa sucia directo al cesto.',
      'Tira a la basura todo objeto roto, empaque o nota que ya no sirva.',
      'Devuelve a cada objeto a su lugar asignado.'
    ]
  },
  {
    id: 'step_4',
    phase: 'Fase 4 · Armonización & Sellado',
    title: 'Sensación de Santuario y Paz Visual',
    description: 'El toque final que transforma una simple limpieza en un ritual de autocuidado y respeto por tu propia energía.',
    tips: [
      'Alinea cables, teclado y silla de trabajo.',
      'Aplica una gota de aceite esencial, enciende incienso o ventila un aroma relajante.',
      'Párate en la puerta, respira profundo y contempla tu santuario en orden.'
    ]
  }
];

export const SpaceCleaningModal: React.FC<SpaceCleaningModalProps> = ({
  onClose,
  onSaveLog
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

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playZenBell = (freq = 432) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    if (!isRunning || secondsRemaining <= 0) return;
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
  }, [isRunning, secondsRemaining]);

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

  const currentStep = CLEANING_STEPS[currentStepIdx];

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
    if (!completedSteps.includes(currentStep.id)) {
      setCompletedSteps((prev) => [...prev, currentStep.id]);
    }
    playZenBell(587);
    if (currentStepIdx < CLEANING_STEPS.length - 1) {
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
      actionTaken: 'archived'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-indigo-500/30 dark:border-white/[0.12] shadow-2xl p-6 md:p-8 space-y-6 my-auto transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Home className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Ritual de Limpieza de mi Cuarto
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tu entorno físico es la extensión de tu mente. 15 minutos de recuperación de tu santuario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
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
        <div className="grid grid-cols-4 gap-2">
          {CLEANING_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = idx === currentStepIdx;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIdx(idx)}
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
                  {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content */}
        {!isFinished ? (
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
                <span>{currentStepIdx < CLEANING_STEPS.length - 1 ? 'Siguiente Fase' : 'Completar Ritual'}</span>
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
                Has completado las 4 fases. Disfruta la claridad mental que produce el orden físico.
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
      </div>
    </div>
  );
};
