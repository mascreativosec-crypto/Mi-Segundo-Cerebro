import React, { useState, useMemo } from 'react';
import { AppStoreData } from '../../services/storage';
import { BusinessTask, PillarKey } from '../../types';
import {
  CheckSquare,
  Plus,
  List,
  Columns3,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  UserCheck,
  Building2,
  User,
  AlertCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowRight,
} from 'lucide-react';

interface GeneralTasksViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
}

type ViewMode = 'list' | 'week' | 'calendar';
type TimeFilter = 'all' | 'today' | 'week' | 'overdue' | 'completed';
type ScopeFilter = 'all' | 'personal' | 'business';

export const GeneralTasksView: React.FC<GeneralTasksViewProps> = ({
  data,
  onUpdateData,
}) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>('all');
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('all');

  // Calendar & Week states
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // New task form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [businessId, setBusinessId] = useState<string>(data.businesses[0]?.id || '');
  const [pillar, setPillar] = useState<PillarKey | ''>('intelectual');
  const [priority, setPriority] = useState<BusinessTask['priority']>('important');
  const [dueDate, setDueDate] = useState<string>(todayStr);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [delegatedToId, setDelegatedToId] = useState<string>('');

  // Date math utilities
  const getWeekDates = (offsetWeeks: number) => {
    const current = new Date();
    current.setDate(current.getDate() + offsetWeeks * 7);
    const day = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diffToMonday));

    const weekDays: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split('T')[0];
      weekDays.push({
        dateStr: str,
        dayName: names[i],
        dayNumber: d.getDate(),
        isToday: str === todayStr,
      });
    }
    return weekDays;
  };

  const currentWeekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset, todayStr]);
  const currentWeekDateStrings = useMemo(() => currentWeekDates.map((w) => w.dateStr), [currentWeekDates]);

  // Tasks filtering
  const filteredTasks = useMemo(() => {
    return data.tasks.filter((t) => {
      // 1. Scope filter
      if (scopeFilter === 'personal' && t.scope !== 'personal') return false;
      if (scopeFilter === 'business') {
        if (t.scope !== 'business') return false;
        if (selectedBusinessFilter !== 'all' && t.businessId !== selectedBusinessFilter) return false;
      }
      if (selectedPillarFilter !== 'all' && t.pillar !== selectedPillarFilter) return false;

      // 2. Time & Status filter
      if (timeFilter === 'today') {
        return t.dueDate === todayStr;
      }
      if (timeFilter === 'week') {
        return currentWeekDateStrings.includes(t.dueDate);
      }
      if (timeFilter === 'overdue') {
        return t.dueDate < todayStr && t.status !== 'done';
      }
      if (timeFilter === 'completed') {
        return t.status === 'done';
      }

      return true;
    });
  }, [data.tasks, scopeFilter, selectedBusinessFilter, selectedPillarFilter, timeFilter, todayStr, currentWeekDateStrings]);

  // Status counts for counters
  const tasksForTodayCount = data.tasks.filter((t) => t.dueDate === todayStr).length;
  const tasksThisWeekCount = data.tasks.filter((t) => currentWeekDateStrings.includes(t.dueDate)).length;
  const overdueTasksCount = data.tasks.filter((t) => t.dueDate < todayStr && t.status !== 'done').length;
  const completedTasksCount = data.tasks.filter((t) => t.status === 'done').length;

  // Handlers
  const toggleTaskStatus = (taskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus: BusinessTask['status'] = t.status === 'done' ? 'todo' : 'done';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'done' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          };
        }
        return t;
      }),
    }));
  };

  const deleteTask = (taskId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const rescheduleTask = (taskId: string, newDate: string) => {
    onUpdateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t)),
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetBusiness = scope === 'business' ? data.businesses.find((b) => b.id === businessId) : null;

    const newTask: BusinessTask = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      scope: scope,
      businessId: scope === 'business' ? businessId : undefined,
      pillar: scope === 'personal' && pillar ? (pillar as PillarKey) : undefined,
      priority: priority,
      status: 'todo',
      isDelegated: Boolean(delegatedToId),
      delegatedToId: delegatedToId || undefined,
      dueDate: dueDate || todayStr,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      tags: [
        scope === 'personal' ? 'Personal' : `Empresa: ${targetBusiness?.name || 'General'}`,
      ],
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    setTitle('');
    setShowAddForm(false);
  };

  // Open add form with a preset date
  const openAddFormWithDate = (date: string) => {
    setDueDate(date);
    setShowAddForm(true);
  };

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week: 0 is Sun, make 0 = Mon for ISO
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: false,
        isToday: prevDate.toISOString().split('T')[0] === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curDate = new Date(year, month, d);
      const str = curDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: false,
        isToday: nextDate.toISOString().split('T')[0] === todayStr,
      });
    }

    return days;
  }, [calendarMonth, todayStr]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      {/* Top Main Banner */}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 shrink-0">
              <CheckSquare className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Tareas General</h1>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/15 px-2.5 py-0.5 rounded-xl border border-teal-500/30">
                  Multi-Vista
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.08] px-2.5 py-0.5 rounded-xl border border-slate-300/60 dark:border-white/[0.08]">
                  {data.tasks.length} Registradas
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Control ejecutivo en triple formato: Lista compacta, Tablero Semanal y Calendario mensual. Con etiquetado transparente por empresa y pilares personales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-200/50 dark:bg-black/40 border border-slate-300/40 dark:border-white/[0.06] rounded-2xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendario</span>
              </button>
            </div>

            <button
              onClick={() => {
                setDueDate(todayStr);
                setShowAddForm(!showAddForm);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>
      </div>

      {/* Temporal Status KPI Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setTimeFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'all'
              ? 'bg-teal-500/10 border-teal-500/40 text-teal-800 dark:text-teal-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
          }`}
        >
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 block">Todas</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {data.tasks.length}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Bandeja general</span>
        </button>

        <button
          onClick={() => setTimeFilter('today')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'today'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-emerald-500/30'
          }`}
        >
          <span className="text-xs uppercase text-emerald-600 dark:text-emerald-400 font-bold block">Para Hoy</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block tracking-tight">
            {tasksForTodayCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Compromisos del día</span>
        </button>

        <button
          onClick={() => setTimeFilter('week')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'week'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-800 dark:text-blue-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-blue-500/30'
          }`}
        >
          <span className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold block">Esta Semana</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block tracking-tight">
            {tasksThisWeekCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Ciclo operativo</span>
        </button>

        <button
          onClick={() => setTimeFilter('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'overdue'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-rose-500/30'
          }`}
        >
          <span className="text-xs uppercase text-rose-600 dark:text-rose-400 font-bold block">Vencidas</span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block tracking-tight">
            {overdueTasksCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Requieren reprogramar</span>
        </button>

        <button
          onClick={() => setTimeFilter('completed')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'completed'
              ? 'bg-slate-200/80 dark:bg-slate-800/80 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <span className="text-xs uppercase text-slate-700 dark:text-slate-300 font-bold block">Completadas</span>
          <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1 block tracking-tight">
            {completedTasksCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Historial ejecutado</span>
        </button>
      </div>

      {/* Scope and Filter Bar */}
      <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Scope selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-black/40 border border-slate-300/40 dark:border-white/[0.06] rounded-xl">
          <button
            onClick={() => {
              setScopeFilter('all');
              setSelectedBusinessFilter('all');
              setSelectedPillarFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos los Ámbitos
          </button>
          <button
            onClick={() => setScopeFilter('personal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === 'personal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Vida Personal</span>
          </button>
          <button
            onClick={() => setScopeFilter('business')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === 'business'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Vida Empresarial</span>
          </button>
        </div>

        {/* Company Subfilter */}
        {scopeFilter === 'business' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Empresa:</span>
            <select
              value={selectedBusinessFilter}
              onChange={(e) => setSelectedBusinessFilter(e.target.value)}
              className="bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todas las Empresas</option>
              {data.businesses.map((biz) => (
                <option key={biz.id} value={biz.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {biz.logoEmoji} {biz.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pillar Subfilter for Personal */}
        {scopeFilter === 'personal' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pilar:</span>
            <select
              value={selectedPillarFilter}
              onChange={(e) => setSelectedPillarFilter(e.target.value)}
              className="bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Todos los Pilares</option>
              <option value="fisico">Físico</option>
              <option value="intelectual">Intelectual</option>
              <option value="emocional">Emocional</option>
              <option value="espiritual">Espiritual</option>
              <option value="financiero">Financiero Personal</option>
            </select>
          </div>
        )}
      </div>

      {/* Add Task Modal / Expanded Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Registrar Nueva Tarea (Personal o por Empresa)</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Título de la Tarea / Compromiso</label>
              <input
                type="text"
                placeholder="¿Qué acción debes ejecutar?..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ámbito</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="personal">Vida Personal</option>
                <option value="business">Vida Empresarial</option>
              </select>
            </div>

            {scope === 'business' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">¿A qué empresa pertenece?</label>
                <select
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  {data.businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>
                      {biz.logoEmoji} {biz.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pilar de Crecimiento</label>
                <select
                  value={pillar}
                  onChange={(e) => setPillar(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="fisico">Físico (Salud / Entrenamiento)</option>
                  <option value="intelectual">Intelectual (Estudio / Lectura)</option>
                  <option value="emocional">Emocional (Relaciones / Disciplina)</option>
                  <option value="espiritual">Espiritual (Propósito / Valores)</option>
                  <option value="financiero">Financiero Personal</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Fecha Límite / Día Programado</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nivel de Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="urgent_important">Urgente & Vital (Innegociable)</option>
                <option value="important">Importante (Alto Impacto)</option>
                <option value="urgent">Urgente</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tiempo Estimado (min)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Delegar a Colaborador (Opcional)</label>
              <select
                value={delegatedToId}
                onChange={(e) => setDelegatedToId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Asignar a mí mismo</option>
                {data.teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 cursor-pointer"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-6 space-y-3 shadow-lg dark:shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-white/[0.06]">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Mostrando {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'} filtradas
            </span>
            <button
              onClick={() => openAddFormWithDate(todayStr)}
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir tarea rápida</span>
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
              No se encontraron tareas con los filtros seleccionados.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const isOverdue = task.dueDate < todayStr && !isDone;
              const isDueToday = task.dueDate === todayStr;
              const business = task.businessId ? data.businesses.find((b) => b.id === task.businessId) : null;
              const assignee = task.delegatedToId ? data.teamMembers.find((m) => m.id === task.delegatedToId) : null;

              return (
                <div
                  key={task.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border gap-3 transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-slate-500 dark:text-slate-400'
                      : isOverdue
                      ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-slate-900 dark:text-slate-100'
                      : 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 hover:border-teal-500/40 shadow-xs'
                  }`}
                >
                  <div
                    onClick={() => toggleTaskStatus(task.id)}
                    className="flex items-start sm:items-center gap-3 flex-1 cursor-pointer"
                  >
                    <button className="mt-0.5 sm:mt-0 cursor-pointer">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 hover:text-teal-500 shrink-0 transition-colors" />
                      )}
                    </button>

                    <div>
                      <span className={`text-xs ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'font-semibold text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </span>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {/* Scope & Company Tag */}
                        {task.scope === 'personal' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                            Personal · {task.pillar ? task.pillar.toUpperCase() : 'General'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-semibold text-[10px] flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {business?.name || 'Empresa'}
                          </span>
                        )}

                        <span>·</span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : isDueToday ? 'text-teal-600 dark:text-teal-300 font-semibold' : ''}`}>
                          <CalendarIcon className="w-3 h-3" />
                          {task.dueDate} {isDueToday ? '(Hoy)' : isOverdue ? '(Vencida)' : ''}
                        </span>

                        {task.estimatedMinutes && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes} min
                            </span>
                          </>
                        )}

                        {assignee && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Delegado a {assignee.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    {task.priority === 'urgent_important' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        Urgente & Vital
                      </span>
                    )}
                    {task.priority === 'important' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                        Alto Impacto
                      </span>
                    )}

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: WEEKLY BOARD (7 DAYS) */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          {/* Week Navigator */}
          <div className="p-4 rounded-2xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Semana Anterior</span>
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {currentWeekDates[0]?.dateStr} — {currentWeekDates[6]?.dateStr}
              </span>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer"
              >
                Volver a Semana Actual
              </button>
            </div>

            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Semana Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 7 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {currentWeekDates.map((day) => {
              const dayTasks = data.tasks.filter((t) => t.dueDate === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border p-3 flex flex-col justify-between min-h-[320px] transition-all ${
                    day.isToday
                      ? 'bg-teal-500/10 dark:bg-teal-950/20 border-teal-500/40 shadow-sm'
                      : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">{day.dayName}</span>
                        <span className={`text-base font-bold ${day.isToday ? 'text-teal-600 dark:text-teal-400' : 'text-slate-900 dark:text-white'}`}>
                          {day.dayNumber}
                        </span>
                      </div>
                      {day.isToday && (
                        <span className="text-[10px] font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* Day Task Cards */}
                    <div className="space-y-2 mt-3">
                      {dayTasks.length === 0 ? (
                        <span className="text-[10px] text-slate-400 block text-center py-4">
                          Sin tareas
                        </span>
                      ) : (
                        dayTasks.map((t) => {
                          const isDone = t.status === 'done';
                          const biz = t.businessId ? data.businesses.find((b) => b.id === t.businessId) : null;

                          return (
                            <div
                              key={t.id}
                              className={`p-2 rounded-xl border text-xs transition-all ${
                                isDone
                                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 text-slate-400 dark:text-slate-500'
                                  : 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-900 dark:text-slate-200 hover:border-teal-500/30 shadow-xs'
                              }`}
                            >
                              <div
                                onClick={() => toggleTaskStatus(t.id)}
                                className="flex items-start gap-1.5 cursor-pointer"
                              >
                                <button className="mt-0.5 shrink-0 cursor-pointer">
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hover:text-teal-500" />
                                  )}
                                </button>
                                <span className={`text-[11px] line-clamp-2 ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'font-semibold text-slate-900 dark:text-white'}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                <span>{t.scope === 'personal' ? 'Personal' : biz?.name || 'Empresa'}</span>
                                <button
                                  onClick={() => rescheduleTask(t.id, new Date(new Date(day.dateStr).getTime() + 86400000).toISOString().split('T')[0])}
                                  className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
                                  title="Posponer al día siguiente"
                                >
                                  +1d
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Add task for this day */}
                  <button
                    onClick={() => openAddFormWithDate(day.dateStr)}
                    className="w-full mt-3 py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500/40 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: INTERACTIVE MONTHLY CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month Grid */}
          <div className="lg:col-span-2 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            {/* Month Header Navigation */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Haz clic en cualquier día para inspeccionar o programar tareas.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date())}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/10 cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell) => {
                const dayTasks = data.tasks.filter((t) => t.dueDate === cell.dateStr);
                const hasOverdue = dayTasks.some((t) => cell.dateStr < todayStr && t.status !== 'done');
                const isSelected = selectedDate === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`p-2 rounded-2xl border min-h-[72px] flex flex-col justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-slate-900 dark:text-white shadow-md shadow-teal-500/15'
                        : cell.isToday
                        ? 'bg-teal-500/10 dark:bg-teal-950/30 border-teal-500/40 text-teal-800 dark:text-teal-300'
                        : cell.isCurrentMonth
                        ? 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-800 dark:text-slate-200 hover:border-teal-500/30'
                        : 'bg-slate-100/50 dark:bg-black/10 border-transparent text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cell.isToday ? 'text-teal-600 dark:text-teal-400' : ''}`}>
                        {cell.dayNumber}
                      </span>
                      {hasOverdue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Tareas vencidas" />
                      )}
                    </div>

                    {dayTasks.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                          {dayTasks.length} {dayTasks.length === 1 ? 'tarea' : 'tareas'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Inspector Panel */}
          <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-teal-600 dark:text-teal-400 tracking-wider">Día Seleccionado</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{selectedDate}</h3>
                </div>
                <button
                  onClick={() => openAddFormWithDate(selectedDate)}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Tasks for selected day */}
              <div className="space-y-2 mt-4 max-h-[380px] overflow-y-auto">
                {data.tasks.filter((t) => t.dueDate === selectedDate).length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No hay tareas programadas para esta fecha.
                  </div>
                ) : (
                  data.tasks
                    .filter((t) => t.dueDate === selectedDate)
                    .map((task) => {
                      const isDone = task.status === 'done';
                      const biz = task.businessId ? data.businesses.find((b) => b.id === task.businessId) : null;

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-emerald-500/10 dark:bg-emerald-950/15 border-emerald-500/20 text-slate-500'
                              : 'bg-slate-50/90 dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => toggleTaskStatus(task.id)}
                            className="flex items-start gap-2.5 cursor-pointer"
                          >
                            <button className="mt-0.5 shrink-0 cursor-pointer">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 hover:text-teal-500" />
                              )}
                            </button>
                            <div>
                              <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'font-semibold text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                <span>{task.scope === 'personal' ? 'Personal' : biz?.name || 'Empresa'}</span>
                                {task.estimatedMinutes && <span>· {task.estimatedMinutes} min</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400">
              Usa el botón superior para añadir tareas directamente asignadas a esta fecha seleccionada.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
