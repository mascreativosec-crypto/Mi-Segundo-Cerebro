import React from 'react';
import { Mic, FileAudio, Sparkles, X, ChevronRight } from 'lucide-react';

interface MobileQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordStrategicMeeting: () => void;
  onUploadStrategicAudio: (file: File) => void;
  onOpenQuickCapture: () => void;
}

export const MobileQuickActionSheet: React.FC<MobileQuickActionSheetProps> = ({
  isOpen,
  onClose,
  onRecordStrategicMeeting,
  onUploadStrategicAudio,
  onOpenQuickCapture,
}) => {
  if (!isOpen) return null;

  const handleAudioSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadStrategicAudio(file);
    }
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-white dark:bg-[#0d121d] border-t border-slate-200/80 dark:border-white/[0.1] p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl space-y-3 animate-in slide-in-from-bottom-6 duration-200"
      >
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              Acceso Rápido Ejecutivo
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Juntas de Dirección Estratégica o captura instantánea
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acciones rápidas"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {/* 1. Grabar Junta Estratégica */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onRecordStrategicMeeting();
            }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/12 via-purple-500/10 to-indigo-500/10 border border-rose-500/25 flex items-center justify-between gap-3 text-left active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Grabar Junta Estratégica
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Inicia grabación en Dirección &amp; Estrategia con acta IA
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* 2. Subir Audio de Junta (Native instant file trigger) */}
          <label className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/12 via-purple-500/10 to-pink-500/10 border border-indigo-500/25 flex items-center justify-between gap-3 text-left active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Subir Audio de Reunión
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Carga .mp3, .wav o .m4a para extraer decisiones clave
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
              onChange={handleAudioSelected}
              className="hidden"
            />
          </label>

          {/* 3. Captura Rápida Universal */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenQuickCapture();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 text-left active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Captura Rápida (Tarea, Idea o Nota)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  Guarda al instante en tu Segundo Cerebro
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
