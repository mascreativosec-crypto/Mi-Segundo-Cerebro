import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BusinessTask } from '../../types';
import {
  Compass,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
  Flame,
  Calendar
} from 'lucide-react';

interface MiDiaViewProps {
  data: AppStoreData;
  onNavigate: (view: string) => void;
  onOpenQuickCapture: () => void;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const MiDiaView: React.FC<MiDiaViewProps> = ({
  data,
  onNavigate,
  onOpenQuickCapture,
  onUpdateData,
}) => {
  const [taskFilter, setTaskFilter] = useState<'all' | 'personal' | 'business' | 'delegated' | 'urgent'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskScope, setNewTaskScope] = useState<'personal' | 'business'>('business');
  const [newTaskPriority, setNewTaskPriority] = useState<BusinessTask['priority']>('important');

  const todayStr = new Date().toISOString().split('T')[0];

  const toggleTaskStatus = (taskId: string) => {
    onUpdateData((prev) => {
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus: BusinessTask['status'] = t.status === 'done' ? 'todo' : 'done';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'done' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          };
        }
        return t;
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  const toggleHabitToday = (habitId: string) => {
    onUpdateData((prev) => {
      const updatedHabits = prev.habits.map((h) => {
        if (h.id === habitId) {
          const isDoneToday = h.completedDates.includes(todayStr);
          const nextDates = isDoneToday
            ? h.completedDates.filter((d) => d !== todayStr)
            : [...h.completedDates, todayStr];
          return {
            ...h,
            completedDates: nextDates,
            currentStreak: isDoneToday ? Math.max(0, h.currentStreak - 1) : h.currentStreak + 1,
          };
        }
        return h;
      });
      return { ...prev, habits: updatedHabits };
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: BusinessTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      scope: newTaskScope,
      priority: newTaskPriority,
      status: 'todo',
      isDelegated: false,
      dueDate: todayStr,
      tags: [newTaskScope === 'personal' ? 'Personal' : 'Empresarial'],
      businessId: newTaskScope === 'business' ? data.businesses[0]?.id : undefined,
    };
    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    setNewTaskTitle('');
  };

  // Filter tasks
  const filteredTasks = data.tasks.filter((task) => {
    if (taskFilter === 'personal') return task.scope === 'personal';
    if (taskFilter === 'business') return task.scope === 'business';
    if (taskFilter === 'delegated') return task.isDelegated;
    if (taskFilter === 'urgent') return task.priority === 'urgent_important' || task.priority === 'urgent';
    return true;
  });

  const morningProgress = data.superMorning.steps.length > 0
    ? Math.round((data.superMorning.steps.filter((s) => s.completed).length / data.superMorning.steps.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Title & Quick Diagnostic Banner - Apple Liquid Glass */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Compass className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mi Día
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Centro de mando ejecutivo: prioridades innegociables, hábitos diarios y tareas críticas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenQuickCapture}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Captura Rápida (Cmd+K)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Diagnostic Key Questions Cards (Horizontal Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">1. ¿Qué hacer hoy?</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">
            {data.tasks.filter((t) => t.status !== 'done').length} tareas activas
          </span>
        </div>
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">2. Innegociables</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">3 Prioridades</span>
        </div>
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">3. Delegadas</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">
            {data.tasks.filter((t) => t.isDelegated).length} en seguimiento
          </span>
        </div>
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">4. Atrasadas</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">0 Críticas</span>
        </div>
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold block">5. Cinco Pilares</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">En Equilibrio</span>
        </div>
        <div className="p-3.5 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">6. Preparar Mañana</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 block">Súper Noche</span>
        </div>
      </div>

      {/* Routine Blocks: Super Mañana & Super Noche Fast Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Super Mañana Bar */}
        <div
          onClick={() => onNavigate('super_morning')}
          className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all group shadow-sm dark:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Súper Mañana
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {morningProgress}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                {data.superMorning.intention || 'Rutina de intención y 3 prioridades'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Super Noche Bar */}
        <div
          onClick={() => onNavigate('super_night')}
          className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all group shadow-sm dark:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                  Súper Noche
                </span>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Meta {data.superNight.plannedSleepHours}h
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                Cierre de victorias, aprendizajes y foco para mañana
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Top 3 Priorities of the Day */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Tus 3 Prioridades Innegociables de Hoy
            </h2>
          </div>
          <button
            onClick={() => onNavigate('super_morning')}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
          >
            Editar en Súper Mañana
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.superMorning.top3Priorities.map((priority, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                0{idx + 1}
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug font-medium">
                {priority || `Prioridad innegociable #${idx + 1}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section (Combined Personal & Business + Delegated + Urgent) */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tareas & Compromisos de Hoy</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integración total de tareas personales y empresariales con matriz de impacto.
            </p>
          </div>

          {/* Filter segment tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-black/40 rounded-xl border border-slate-300/40 dark:border-white/[0.06]">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                taskFilter === 'all' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({data.tasks.length})
            </button>
            <button
              onClick={() => setTaskFilter('business')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                taskFilter === 'business' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Empresa
            </button>
            <button
              onClick={() => setTaskFilter('personal')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                taskFilter === 'personal' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setTaskFilter('delegated')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                taskFilter === 'delegated' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Delegadas
            </button>
          </div>
        </div>

        {/* Quick Add Task Input */}
        <form onSubmit={handleCreateTask} className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Añadir nueva tarea para hoy..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 min-w-[240px] bg-slate-100/80 dark:bg-black/40 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />

          <select
            value={newTaskScope}
            onChange={(e) => setNewTaskScope(e.target.value as any)}
            className="bg-slate-100/80 dark:bg-black/40 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="business">Empresarial</option>
            <option value="personal">Personal</option>
          </select>

          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="bg-slate-100/80 dark:bg-black/40 border border-slate-300 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="urgent_important">Urgente & Importante</option>
            <option value="important">Importante</option>
            <option value="urgent">Urgente</option>
            <option value="normal">Normal</option>
          </select>

          <button
            type="submit"
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Guardar
          </button>
        </form>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No hay tareas en esta categoría para hoy.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const assignedMember = task.delegatedToId
                ? data.teamMembers.find((m) => m.id === task.delegatedToId)
                : null;

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-500/[0.06] dark:bg-emerald-950/20 border-emerald-500/20 text-slate-400'
                      : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-500/30'
                  }`}
                >
                  <div
                    onClick={() => toggleTaskStatus(task.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 hover:text-blue-500 shrink-0 transition-colors" />
                    )}

                    <div>
                      <span className={`text-xs ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white font-medium'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="uppercase text-[10px] font-semibold text-slate-500 dark:text-slate-400">{task.scope}</span>
                        {task.estimatedMinutes && (
                          <>
                            <span>·</span>
                            <span>{task.estimatedMinutes} min</span>
                          </>
                        )}
                        {assignedMember && (
                          <>
                            <span>·</span>
                            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3" />
                              Delegado a {assignedMember.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.priority === 'urgent_important' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        Urgente & Vital
                      </span>
                    )}
                    {task.priority === 'important' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        Alto Impacto
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Habits of Today (Quick Check) */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hábitos & Disciplina Hoy</h2>
          </div>
          <button
            onClick={() => onNavigate('habits_goals')}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Ver Matriz 28 Días ({data.habits.filter((h) => h.completedDates.includes(todayStr)).length}/{data.habits.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.habits.map((habit) => {
            const isCompletedToday = habit.completedDates.includes(todayStr);
            return (
              <div
                key={habit.id}
                onClick={() => toggleHabitToday(habit.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCompletedToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                    : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCompletedToday ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                  <span className={`text-xs ${isCompletedToday ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                    {habit.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{habit.currentStreak}d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
