import React, { useState } from 'react';
import { DailyMorningLog } from '../../types/super-morning';
import {
  Calendar,
  Flame,
  Award,
  Clock,
  Sparkles,
  BookOpen,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface ProgressViewProps {
  logs: DailyMorningLog[];
  currentStreak: number;
  bestStreak: number;
  theme?: 'amber' | 'purple';
  onRecoverStreak?: (frictionReason: string, recoveryNote: string) => void;
}

const FRICTION_OPTIONS = [
  'Sobrecarga de trabajo / fatiga acumulada',
  'Exceso de pantallas tarde / mal descanso',
  'Falta de claridad o exceso de pasos en la rutina',
  'Imprevisto familiar, viaje o emergencia',
  'Procrastinación o negociación mental matutina',
];

const MICRO_RESCUE_STEPS = [
  'Respirar 60 segundos y aceptar sin culpa que ayer falló (cero dramatismo)',
  'Completar la versión mínima de 5 min hoy (Agua + Quietud + 1 Prioridad)',
  'Eliminar 1 fricción física de tu entorno para asegurar mañana',
];

export const ProgressView: React.FC<ProgressViewProps> = ({
  logs,
  currentStreak,
  bestStreak,
  theme = 'amber',
  onRecoverStreak,
}) => {
  const isPurple = theme === 'purple';

  // Streak Recovery Protocol State
  const [showRecoveryProtocol, setShowRecoveryProtocol] = useState<boolean>(currentStreak <= 1);
  const [frictionReason, setFrictionReason] = useState<string>(FRICTION_OPTIONS[0]);
  const [recoveryNote, setRecoveryNote] = useState<string>('');
  const [rescueChecks, setRescueChecks] = useState<boolean[]>([false, false, false]);
  const [rescueCompletedMsg, setRescueCompletedMsg] = useState<string | null>(null);

  // Generate 28 past days
  const today = new Date();
  const past28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  const logsMap = new Map<string, DailyMorningLog>();
  logs.forEach((log) => logsMap.set(log.date, log));

  const totalSessions = logs.length;
  const totalMinutesSpent = Math.round(
    logs.reduce((acc, l) => acc + (l.totalDurationSeconds || 0), 0) / 60
  );

  const allRescueChecked = rescueChecks.every(Boolean);

  const handleToggleRescueCheck = (idx: number) => {
    setRescueChecks((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleExecuteRecovery = () => {
    if (!onRecoverStreak || !allRescueChecked) return;
    onRecoverStreak(frictionReason, recoveryNote.trim());
    setRescueCompletedMsg('Rescate completado: racha reactivada con aprendizaje táctico registrado.');
    setRescueChecks([false, false, false]);
    setRecoveryNote('');
    setTimeout(() => setRescueCompletedMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-sm ${
          isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-emerald-500/15'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-semibold">Racha Actual</span>
            <Flame className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
          </div>
          <span className={`text-2xl font-bold mt-2 block tracking-tight ${
            isPurple ? 'text-purple-700 dark:text-purple-300' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Consistencia ininterrumpida</span>
        </div>

        <div className={`p-4 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-sm ${
          isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-amber-500/15'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-semibold">Mejor Racha</span>
            <Award className={`w-4 h-4 ${isPurple ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500 dark:text-amber-400'}`} />
          </div>
          <span className={`text-2xl font-bold mt-2 block tracking-tight ${
            isPurple ? 'text-indigo-600 dark:text-indigo-300' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {bestStreak} días
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Récord histórico</span>
        </div>

        <div className={`p-4 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-sm ${
          isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-emerald-500/15'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-semibold">Sesiones Conquistadas</span>
            <Calendar className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2 block tracking-tight">
            {totalSessions}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {isPurple ? 'Registros nocturnos' : 'Registros matutinos'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-sm ${
          isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-emerald-500/15'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] uppercase font-semibold">Tiempo Invertido</span>
            <Clock className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
          </div>
          <span className={`text-2xl font-bold mt-2 block tracking-tight ${
            isPurple ? 'text-purple-700 dark:text-purple-300' : 'text-emerald-600 dark:text-emerald-300'
          }`}>
            {totalMinutesSpent} min
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {isPurple ? 'En introspección y cierre' : 'En introspección y energía'}
          </span>
        </div>
      </div>

      {/* Protocolo Productivo de Rescate de Racha */}
      {onRecoverStreak && (
        <div className={`p-5 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/65 border shadow-md space-y-4 ${
          isPurple ? 'border-purple-500/30' : 'border-amber-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isPurple ? 'bg-purple-500/15 text-purple-500' : 'bg-amber-500/15 text-amber-500'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Protocolo Productivo de Rescate de Racha
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Regla de Oro: nunca falles dos días seguidos. Audita la fricción, ejecuta una micro-misión de 5 min y recupera tu inercia.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRecoveryProtocol((s) => !s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                isPurple
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/25'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              {showRecoveryProtocol ? 'Ocultar Protocolo' : 'Activar Rescate de Racha'}
            </button>
          </div>

          {rescueCompletedMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {rescueCompletedMsg}
            </div>
          )}

          {showRecoveryProtocol && (
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.06] space-y-4">
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
                    {FRICTION_OPTIONS.map((opt) => (
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
                    placeholder="Ej: Dejar celular fuera del cuarto desde las 21:30..."
                    className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  3. Micro-Misión de Rescate (marca los 3 pasos para restaurar tu inercia):
                </span>
                <div className="space-y-2">
                  {MICRO_RESCUE_STEPS.map((step, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleRescueCheck(idx)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        rescueChecks[idx]
                          ? isPurple
                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-900 dark:text-purple-200 font-semibold'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {rescueChecks[idx] ? (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPurple ? 'text-purple-500' : 'text-amber-500'}`} />
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
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Completar Rescate y Recuperar Racha</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 28 Days Matrix */}
      <div className={`p-5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-md space-y-4 ${
        isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-emerald-500/15'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {isPurple ? 'Matriz de Consistencia Nocturna (Últimos 28 Días)' : 'Matriz de Consistencia (Últimos 28 Días)'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {isPurple ? 'Ciclo de Calma y Desconexión' : 'Ciclo de Consolidación Neural'}
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {past28Days.map((dateStr) => {
            const log = logsMap.get(dateStr);
            const isCompleted = Boolean(log);
            const isToday = dateStr === today.toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? isPurple
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-800 dark:text-purple-300 shadow-xs'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : isToday
                    ? isPurple
                      ? 'bg-purple-500/25 border-purple-500 text-purple-800 dark:text-white font-bold ring-1 ring-purple-400'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-white font-bold ring-1 ring-amber-400'
                    : 'bg-slate-100/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
                title={log ? `${dateStr}: ${log.completedHabitIds.length} ${isPurple ? 'fases' : 'hábitos'}${log.isRecovery ? ' (Rescate)' : ''}` : dateStr}
              >
                <span className="text-[9px] font-medium block text-slate-500 dark:text-slate-400">
                  {dateStr.slice(8)}
                </span>
                <span className="text-sm font-bold block mt-1">
                  {isCompleted ? (log?.isRecovery ? '↺' : '✓') : '·'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-4 text-[10px] font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded border ${
              isPurple ? 'bg-purple-500/30 border-purple-500/50' : 'bg-emerald-500/30 border-emerald-500/50'
            }`} />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800" />
            <span>Sin Registro</span>
          </div>
        </div>
      </div>

      {/* Recent Reflections / Logs History */}
      <div className={`p-5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border shadow-md space-y-4 ${
        isPurple ? 'border-slate-200/80 dark:border-purple-500/25' : 'border-slate-200/80 dark:border-emerald-500/15'
      }`}>
        <div className="flex items-center gap-2">
          <BookOpen className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {isPurple ? 'Bitácora de Sabiduría Nocturna' : 'Bitácora de Sabiduría Matutina'}
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {isPurple
              ? 'Aún no has completado sesiones guiadas. Realiza tu primera Súper Noche para ver tus reflexiones aquí.'
              : 'Aún no has completado sesiones guiadas. Realiza tu primera Súper Mañana para ver tus reflexiones aquí.'}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 5).map((log, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border space-y-2 shadow-xs ${
                  isPurple ? 'border-slate-200/80 dark:border-purple-500/15' : 'border-slate-200/80 dark:border-emerald-500/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {log.date}
                    </span>
                    {log.isRecovery && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Rescate Productivo
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium bg-slate-200/80 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    Modo {log.mode.toUpperCase()} · {Math.round(log.totalDurationSeconds / 60)} min
                  </span>
                </div>

                {log.responses && Object.entries(log.responses).map(([habitId, data]) => {
                  const values = Object.entries(data).filter(([_, v]) => v && typeof v === 'string');
                  if (values.length === 0) return null;

                  return (
                    <div key={habitId} className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                      {values.map(([k, val]) => (
                        <p key={k} className="text-slate-700 dark:text-slate-300 italic text-[11px]">
                          "{val}"
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
