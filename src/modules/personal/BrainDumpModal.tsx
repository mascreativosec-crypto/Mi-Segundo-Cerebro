import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Archive,
  ListPlus,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PersonalRitualLog } from '../../types';

interface BrainDumpModalProps {
  onClose: () => void;
  onSaveLog: (log: Omit<PersonalRitualLog, 'id' | 'completedAt'>) => void;
  onConvertToTask?: (title: string, notes: string) => void;
}

const PROMPT_TRIGGERS = [
  '¿Qué pensamiento recurrente te está drenando energía ahora mismo?',
  '¿Qué conversación pendiente o conflicto no resuelto tienes dando vueltas?',
  '¿A qué le tienes miedo o incertidumbre en este proyecto o decisión?',
  '¿Qué autoexigencia o perfeccionismo te está asfixiando hoy?',
  '¿Qué te gustaría decir sin filtros si supieras que nadie te juzgará?'
];

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
  onClose,
  onSaveLog,
  onConvertToTask
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [content, setContent] = useState<string>('');
  const [showPrompts, setShowPrompts] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [burnedSuccess, setBurnedSuccess] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle zen bell
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

  // Words count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Burning animation: visually disintegrate text and release mental burden
  const handleBurnThoughts = () => {
    if (!content.trim()) return;
    setIsBurning(true);
    playZenBell(320);
    setTimeout(() => {
      setIsBurning(false);
      setBurnedSuccess(true);
      onSaveLog({
        type: 'brain_dump',
        title: 'Vómito de Pensamientos (Liberado)',
        durationMinutes: selectedMinutes,
        notes: `Sesión de ${wordCount} palabras liberada y quemada simbólicamente.`,
        rating: 5,
        actionTaken: 'burned'
      });
      setTimeout(() => {
        onClose();
      }, 1600);
    }, 1800);
  };

  // Save as private note
  const handleArchiveThoughts = () => {
    if (!content.trim()) return;
    onSaveLog({
      type: 'brain_dump',
      title: 'Vómito de Pensamientos (Archivado)',
      durationMinutes: selectedMinutes,
      notes: content,
      rating: 5,
      actionTaken: 'archived'
    });
    onClose();
  };

  // Convert to tasks
  const handleExtractTask = () => {
    if (!content.trim()) return;
    if (onConvertToTask) {
      onConvertToTask('Resolver temas de vaciado mental', content);
    }
    onSaveLog({
      type: 'brain_dump',
      title: 'Vómito de Pensamientos (Convertido a Tarea)',
      durationMinutes: selectedMinutes,
      notes: content,
      rating: 5,
      actionTaken: 'converted_to_task'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-rose-500/30 dark:border-white/[0.12] shadow-2xl p-6 md:p-8 space-y-6 my-auto transition-all">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Vómito de Pensamientos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escribe sin filtros ni juicios. Vacía todo el ruido que pesa en tu cabeza.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title={soundEnabled ? 'Silenciar Campanas' : 'Activar Campanas Zen'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timer & Controls Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Tiempo:
            </span>
            {[5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSelectMinutes(mins)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedMinutes === mins
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
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
              title="Reiniciar temporizador"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Prompt Triggers */}
        <div>
          <button
            onClick={() => setShowPrompts((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer mb-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showPrompts ? 'Ocultar disparadores' : '¿No sabes qué escribir? Ver disparadores de desahogo'}</span>
          </button>

          {showPrompts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 mb-3 animate-fade-in">
              {PROMPT_TRIGGERS.map((trigger, i) => (
                <button
                  key={i}
                  onClick={() => setContent((prev) => (prev ? `${prev}\n\n• ${trigger}\n` : `• ${trigger}\n`))}
                  className="p-2 rounded-xl text-left bg-white/60 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 transition-colors text-[11px] leading-relaxed cursor-pointer"
                >
                  {trigger}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Area Writing Zone */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isBurning || burnedSuccess}
            placeholder="Comienza a escribir aquí sin censura... Deja salir todo: lo ridículo, lo doloroso, lo urgente, lo insignificante. Nadie lo leerá si tú decides soltarlo."
            className={`w-full h-64 p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/90 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-sm leading-relaxed resize-none transition-all ${
              isBurning ? 'opacity-0 scale-95 blur-md duration-1000' : 'opacity-100'
            }`}
          />

          {isBurning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 rounded-2xl backdrop-blur-md text-center p-6 space-y-3 animate-fade-in">
              <Flame className="w-12 h-12 text-orange-500 animate-bounce" />
              <h4 className="text-lg font-bold text-white">Disolviendo apego y carga mental...</h4>
              <p className="text-xs text-orange-200 max-w-sm">
                Tus pensamientos han cumplido su función de ser expresados. Ahora son libres y tú estás en paz.
              </p>
            </div>
          )}

          {burnedSuccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 rounded-2xl backdrop-blur-md text-center p-6 space-y-3 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">Mente limpia y espacio recuperado</h4>
              <p className="text-xs text-emerald-200">
                La catarsis ha finalizado con éxito.
              </p>
            </div>
          )}
        </div>

        {/* Footer Meta & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'} escritas
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBurnThoughts}
              disabled={!content.trim() || isBurning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-700 dark:text-orange-300 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Quema simbólica: el texto se disuelve y se libera sin guardar"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Quemar / Soltar</span>
            </button>

            <button
              onClick={handleExtractTask}
              disabled={!content.trim() || isBurning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Convertir en tarea accionable"
            >
              <ListPlus className="w-4 h-4 text-blue-500" />
              <span>Convertir a Tarea</span>
            </button>

            <button
              onClick={handleArchiveThoughts}
              disabled={!content.trim() || isBurning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Guardar en el historial íntimo"
            >
              <Archive className="w-4 h-4" />
              <span>Guardar en Notas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
