import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';

interface StreakRecoveryProtocolCardProps {
  id?: string;
  theme: 'amber' | 'purple';
  moduleLabel: string;
  hasLostStreak: boolean;
  isDoneToday: boolean;
  currentStreak: number;
  onRecoverStreak: (frictionReason: string, recoveryNote: string) => void;
}

const MORNING_FRICTION_OPTIONS = [
  'Sobrecarga de trabajo / fatiga acumulada',
  'Exceso de pantallas tarde / mal descanso',
  'Falta de claridad o exceso de pasos en la rutina',
  'Imprevisto familiar, viaje o emergencia',
  'Procrastinación o negociación mental matutina',
];

const NIGHT_FRICTION_OPTIONS = [
  'Cierre laboral muy tarde / exceso de pendientes',
  'Uso de pantallas o redes hasta muy noche',
  'Cansancio extremo al llegar a la cama',
  'Imprevisto familiar, viaje o evento social',
  'Olvido o falta de desconexión digital previa',
];

const MORNING_RESCUE_STEPS = [
  'Respirar 60 segundos y aceptar sin culpa que ayer falló (cero dramatismo)',
  'Completar la versión mínima de 5 min hoy (Agua + Quietud + 1 Prioridad Innegociable)',
  'Eliminar 1 fricción física de tu entorno para blindar tu mañana siguiente',
];

const NIGHT_RESCUE_STEPS = [
  'Soltar la jornada sin culpa ni autojuicio (acepta lo hecho y cierra el día)',
  'Completar el cierre express de 5 min (1 Victoria + 1 Aprendizaje + Desconexión)',
  'Dejar el celular en modo avión o fuera de la cama y preparar 1 prioridad de mañana',
];

export const StreakRecoveryProtocolCard: React.FC<StreakRecoveryProtocolCardProps> = ({
  id,
  theme,
  moduleLabel,
  hasLostStreak,
  isDoneToday,
  currentStreak,
  onRecoverStreak,
}) => {
  const isPurple = theme === 'purple';
  const frictionOptions = isPurple ? NIGHT_FRICTION_OPTIONS : MORNING_FRICTION_OPTIONS;
  const rescueSteps = isPurple ? NIGHT_RESCUE_STEPS : MORNING_RESCUE_STEPS;

  const [isExpanded, setIsExpanded] = useState<boolean>(hasLostStreak);
  const [frictionReason, setFrictionReason] = useState<string>(frictionOptions[0]);
  const [recoveryNote, setRecoveryNote] = useState<string>('');
  const [rescueChecks, setRescueChecks] = useState<boolean[]>([false, false, false]);
  const [rescueCompletedMsg, setRescueCompletedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (hasLostStreak) {
      setIsExpanded(true);
    }
  }, [hasLostStreak]);

  const allRescueChecked = rescueChecks.every(Boolean);

  const handleToggleRescueCheck = (idx: number) => {
    setRescueChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleExecuteRecovery = () => {
    if (!allRescueChecked) return;
    onRecoverStreak(frictionReason, recoveryNote.trim());
    setRescueCompletedMsg(
      `¡Racha de ${moduleLabel} recuperada! Regla "Nunca falles 2 días" aplicada y aprendizaje guardado.`
    );
    setRescueChecks([false, false, false]);
    setRecoveryNote('');
    setIsExpanded(false);
    setTimeout(() => setRescueCompletedMsg(null), 6000);
  };

  return (
    <div
      id={id}
      className={`p-6 md:p-7 rounded-3xl backdrop-blur-2xl border shadow-xl space-y-4 transition-all ${
        hasLostStreak
          ? isPurple
            ? 'bg-gradient-to-br from-purple-500/15 via-white/85 to-indigo-500/10 dark:from-purple-950/50 dark:via-slate-900/75 dark:to-indigo-950/40 border-purple-500/50 ring-2 ring-purple-500/20'
            : 'bg-gradient-to-br from-amber-500/15 via-white/85 to-orange-500/10 dark:from-amber-950/45 dark:via-slate-900/75 dark:to-orange-950/35 border-amber-500/50 ring-2 ring-amber-500/20'
          : isPurple
          ? 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-purple-500/25'
          : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-amber-500/25'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              hasLostStreak
                ? isPurple
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-600 dark:text-purple-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {hasLostStreak ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Protocolo para Recuperar Racha · {moduleLabel}
              </h3>
              {hasLostStreak ? (
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg border ${
                    isPurple
                      ? 'bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-500/40'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                  }`}
                >
                  Activado por pérdida de racha
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {isDoneToday
                    ? `Racha protegida hoy (${currentStreak}d)`
                    : `En espera · Racha activa (${currentStreak}d)`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hasLostStreak
                ? 'Regla "Nunca falles 2 días": audita la fricción, realiza esta micro-misión de 5 minutos y reactiva tu racha ahora.'
                : 'Se activará automáticamente si llegas a perder tu racha diaria para rescatar tu inercia sin culpa en 5 minutos.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isPurple
              ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
          }`}
        >
          <span>{isExpanded ? 'Ocultar Protocolo' : 'Abrir Protocolo'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {rescueCompletedMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{rescueCompletedMsg}</span>
        </div>
      )}

      {isExpanded && (
        <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                1. ¿Qué causó la caída o fricción?
              </label>
              <select
                value={frictionReason}
                onChange={(e) => setFrictionReason(e.target.value)}
                className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                {frictionOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-white dark:bg-slate-900">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                2. Ajuste concreto para que no se repita hoy
              </label>
              <input
                type="text"
                value={recoveryNote}
                onChange={(e) => setRecoveryNote(e.target.value)}
                placeholder={
                  isPurple
                    ? 'Ej: Dejar celular fuera del cuarto 45 min antes de dormir...'
                    : 'Ej: Dejar vaso de agua y tenis listos desde la noche anterior...'
                }
                className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              3. Micro-Misión de Rescate de 5 minutos (marca los 3 pasos para restaurar tu racha):
            </span>
            <div className="space-y-2">
              {rescueSteps.map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleToggleRescueCheck(idx)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    rescueChecks[idx]
                      ? isPurple
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-200 font-semibold'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'bg-slate-50/90 dark:bg-black/30 border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {rescueChecks[idx] ? (
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${isPurple ? 'text-purple-500' : 'text-amber-500'}`}
                    />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>{step}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!allRescueChecked}
              onClick={handleExecuteRecovery}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Completar Rescate y Recuperar Racha</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
