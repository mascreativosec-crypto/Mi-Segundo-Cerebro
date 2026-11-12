import React from 'react';
import { DailyMorningLog } from '../../types/super-morning';
import {
  Calendar,
  Flame,
  Award,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ProgressViewProps {
  logs: DailyMorningLog[];
  currentStreak: number;
  bestStreak: number;
  theme?: 'amber' | 'purple';
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  logs,
  currentStreak,
  bestStreak,
  theme = 'amber',
}) => {
  const isPurple = theme === 'purple';

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
                title={log ? `${dateStr}: ${log.completedHabitIds.length} ${isPurple ? 'fases' : 'hábitos'}` : dateStr}
              >
                <span className="text-[9px] font-medium block text-slate-500 dark:text-slate-400">
                  {dateStr.slice(8)}
                </span>
                <span className="text-sm font-bold block mt-1">
                  {isCompleted ? '✓' : '·'}
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
                  <span className={`font-semibold ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {log.date}
                  </span>
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
