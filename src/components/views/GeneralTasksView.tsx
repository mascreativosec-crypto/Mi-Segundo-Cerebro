import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppStoreData } from '../../services/storage';
import { BusinessTask, PillarKey, TaskSubtask } from '../../types';
import {
  CheckSquare,
  Square,
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Link2,
  ExternalLink,
  X,
  BellRing,
  FolderKanban,
  ArrowUpRight,
  FileText,
} from 'lucide-react';

interface GeneralTasksViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
  onOpenBusinessTaskKanban?: (task: BusinessTask) => void;
}

type ViewMode = 'list' | 'week' | 'calendar';
type TimeFilter = 'all' | 'today' | 'week' | 'overdue' | 'completed';
type ScopeFilter = 'all' | 'personal' | 'business';

export const GeneralTasksView: React.FC<GeneralTasksViewProps> = ({
  data,
  onUpdateData,
  onOpenBusinessTaskKanban,
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
  const [newDescription, setNewDescription] = useState('');
  const [newResourceLink, setNewResourceLink] = useState('');
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [businessId, setBusinessId] = useState<string>(data.businesses[0]?.id || '');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [pillar, setPillar] = useState<PillarKey | ''>('intelectual');
  const [priority, setPriority] = useState<BusinessTask['priority']>('important');
  const [dueDate, setDueDate] = useState<string>(todayStr);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [delegatedToId, setDelegatedToId] = useState<string>('');
  const [newSubtasks, setNewSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskDraft, setNewSubtaskDraft] = useState('');
  const [newRemindInInbox, setNewRemindInInbox] = useState<boolean>(false);

  // Personal Task Detail Modal State (also acts as fallback if business callback absent)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [detailResourceLink, setDetailResourceLink] = useState('');
  const [detailPillar, setDetailPillar] = useState<PillarKey | ''>('intelectual');
  const [detailPriority, setDetailPriority] = useState<BusinessTask['priority']>('important');
  const [detailStatus, setDetailStatus] = useState<BusinessTask['status']>('todo');
  const [detailDueDate, setDetailDueDate] = useState<string>(todayStr);
  const [detailEstimatedMinutes, setDetailEstimatedMinutes] = useState<number>(30);
  const [detailSubtasks, setDetailSubtasks] = useState<TaskSubtask[]>([]);
  const [detailSubtaskDraft, setDetailSubtaskDraft] = useState('');
  const [detailRemindInInbox, setDetailRemindInInbox] = useState<boolean>(false);

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

  const handleOpenTaskDetail = (task: BusinessTask) => {
    if ((task.scope === 'business' || Boolean(task.businessId)) && onOpenBusinessTaskKanban) {
      onOpenBusinessTaskKanban(task);
      return;
    }

    setDetailTaskId(task.id);
    setDetailTitle(task.title);
    setDetailDescription(task.description || '');
    setDetailResourceLink(task.resourceLink || '');
    setDetailPillar(task.pillar || 'intelectual');
    setDetailPriority(task.priority);
    setDetailStatus(task.status);
    setDetailDueDate(task.dueDate || todayStr);
    setDetailEstimatedMinutes(task.estimatedMinutes || 30);
    setDetailSubtasks((task.subtasks || []).map((st) => ({ ...st })));
    setDetailSubtaskDraft('');
    setDetailRemindInInbox(Boolean(task.remindInInbox));
  };

  const handleAddDetailSubtask = () => {
    if (!detailSubtaskDraft.trim()) return;
    setDetailSubtasks((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text: detailSubtaskDraft.trim(),
        done: false,
      },
    ]);
    setDetailSubtaskDraft('');
  };

  const handleSaveTaskDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTaskId || !detailTitle.trim()) return;

    const finalSubtasks: TaskSubtask[] = detailSubtaskDraft.trim()
      ? [
          ...detailSubtasks,
          {
            id: `sub_${Date.now()}_pending`,
            text: detailSubtaskDraft.trim(),
            done: false,
          },
        ]
      : detailSubtasks;

    onUpdateData((prev) => {
      const nextTasks = prev.tasks.map((t) =>
        t.id === detailTaskId
          ? {
              ...t,
              title: detailTitle.trim(),
              description: detailDescription.trim() || undefined,
              resourceLink: detailResourceLink.trim() || undefined,
              pillar: t.scope === 'personal' && detailPillar ? (detailPillar as PillarKey) : t.pillar,
              priority: detailPriority,
              status: detailStatus,
              completedAt:
                detailStatus === 'done'
                  ? t.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : undefined,
              dueDate: detailDueDate || t.dueDate,
              estimatedMinutes: Number(detailEstimatedMinutes) || 30,
              subtasks: finalSubtasks.length > 0 ? finalSubtasks : undefined,
              remindInInbox: detailRemindInInbox,
            }
          : t
      );

      const alreadyReminded = (prev.notesReminders || []).some((r) => r.linkedTaskId === detailTaskId);
      const nextReminders =
        detailRemindInInbox && !alreadyReminded
          ? [
              {
                id: `nr_task_${Date.now()}`,
                title: detailTitle.trim(),
                content: detailDescription.trim() || `Tarea personal · Vence: ${detailDueDate}`,
                category: 'tarea' as const,
                originModule: 'personal' as const,
                targetView: 'tasks_general',
                linkedTaskId: detailTaskId,
                reminderDate: detailDueDate,
                showInMiDia: true,
                completed: detailStatus === 'done',
                pinned: detailPriority === 'urgent_important',
                source: 'user' as const,
                createdAt: new Date().toISOString(),
              },
              ...(prev.notesReminders || []),
            ]
          : prev.notesReminders;

      return {
        ...prev,
        tasks: nextTasks,
        notesReminders: nextReminders,
      };
    });

    setDetailTaskId(null);
    setDetailSubtaskDraft('');
  };

  const handleAddNewSubtask = () => {
    if (!newSubtaskDraft.trim()) return;
    setNewSubtasks((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text: newSubtaskDraft.trim(),
        done: false,
      },
    ]);
    setNewSubtaskDraft('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetBusiness = scope === 'business' ? data.businesses.find((b) => b.id === businessId) : null;
    const finalSubtasks: TaskSubtask[] = newSubtaskDraft.trim()
      ? [
          ...newSubtasks,
          {
            id: `sub_${Date.now()}_pending`,
            text: newSubtaskDraft.trim(),
            done: false,
          },
        ]
      : newSubtasks;

    const taskId = `task_${Date.now()}`;
    const newTask: BusinessTask = {
      id: taskId,
      title: title.trim(),
      description: newDescription.trim() || undefined,
      resourceLink: newResourceLink.trim() || undefined,
      scope: scope,
      businessId: scope === 'business' ? businessId : undefined,
      projectId: scope === 'business' && newProjectId ? newProjectId : undefined,
      pillar: scope === 'personal' && pillar ? (pillar as PillarKey) : undefined,
      priority: priority,
      status: 'todo',
      isDelegated: Boolean(delegatedToId),
      delegatedToId: delegatedToId || undefined,
      dueDate: dueDate || todayStr,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      subtasks: finalSubtasks.length > 0 ? finalSubtasks : undefined,
      remindInInbox: newRemindInInbox,
      tags: [
        scope === 'personal' ? 'Personal' : `Empresa: ${targetBusiness?.name || 'General'}`,
      ],
    };

    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      notesReminders: newRemindInInbox
        ? [
            {
              id: `nr_task_${Date.now()}`,
              title: newTask.title,
              content:
                newTask.description ||
                `${scope === 'personal' ? 'Tarea personal' : targetBusiness?.name || 'Empresa'} · Vence: ${newTask.dueDate}`,
              category: 'tarea',
              originModule: scope === 'business' ? 'business' : 'personal',
              targetView: scope === 'business' ? 'business' : 'tasks_general',
              linkedTaskId: taskId,
              reminderDate: newTask.dueDate,
              showInMiDia: true,
              completed: false,
              pinned: newTask.priority === 'urgent_important',
              source: 'user',
              createdAt: new Date().toISOString(),
            },
            ...(prev.notesReminders || []),
          ]
        : prev.notesReminders,
    }));

    setTitle('');
    setNewDescription('');
    setNewResourceLink('');
    setNewProjectId('');
    setNewSubtasks([]);
    setNewSubtaskDraft('');
    setNewRemindInInbox(false);
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
      <div className="rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-white/85 via-sky-50/50 to-indigo-50/40 dark:from-slate-900/75 dark:via-sky-950/20 dark:to-indigo-950/25 border border-sky-200/70 dark:border-sky-500/20 p-6 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <CheckSquare className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestión de Tareas General</h1>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 px-2.5 py-0.5 rounded-xl border border-sky-500/30">
                  Multi-Vista
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-white/[0.08] px-2.5 py-0.5 rounded-xl border border-slate-300/60 dark:border-white/[0.08]">
                  {data.tasks.length} Registradas
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Control ejecutivo en triple formato: Lista compacta, Tablero Semanal y Calendario mensual. Con etiquetado transparente por empresa y pilares personales.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-200/50 dark:bg-black/40 border border-slate-300/40 dark:border-white/[0.06] rounded-2xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm font-bold'
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
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm font-bold'
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
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm font-bold'
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
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
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
              ? 'bg-gradient-to-br from-sky-500/15 to-blue-600/10 border-sky-500/45 text-sky-800 dark:text-sky-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-sky-500/30'
          }`}
        >
          <span className="text-xs font-semibold uppercase text-sky-600 dark:text-sky-400 block">Todas</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {data.tasks.length}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Bandeja general</span>
        </button>

        <button
          onClick={() => setTimeFilter('today')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'today'
              ? 'bg-gradient-to-br from-blue-500/15 to-indigo-600/10 border-blue-500/45 text-blue-800 dark:text-blue-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-blue-500/30'
          }`}
        >
          <span className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold block">Para Hoy</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block tracking-tight">
            {tasksForTodayCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Compromisos del día</span>
        </button>

        <button
          onClick={() => setTimeFilter('week')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'week'
              ? 'bg-gradient-to-br from-indigo-500/15 to-violet-600/10 border-indigo-500/45 text-indigo-800 dark:text-indigo-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-indigo-500/30'
          }`}
        >
          <span className="text-xs uppercase text-indigo-600 dark:text-indigo-400 font-bold block">Esta Semana</span>
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block tracking-tight">
            {tasksThisWeekCount}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Ciclo operativo</span>
        </button>

        <button
          onClick={() => setTimeFilter('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            timeFilter === 'overdue'
              ? 'bg-gradient-to-br from-rose-500/15 to-orange-500/10 border-rose-500/45 text-rose-800 dark:text-rose-300 shadow-sm'
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
              ? 'bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 border-violet-500/45 text-violet-800 dark:text-violet-300 shadow-sm'
              : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:border-violet-500/30'
          }`}
        >
          <span className="text-xs uppercase text-violet-700 dark:text-violet-300 font-bold block">Completadas</span>
          <span className="text-2xl font-extrabold text-violet-700 dark:text-violet-300 mt-1 block tracking-tight">
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
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos los Ámbitos
          </button>
          <button
            onClick={() => setScopeFilter('personal')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === 'personal'
                ? 'bg-gradient-to-r from-sky-500/25 to-blue-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Vida Personal</span>
          </button>
          <button
            onClick={() => setScopeFilter('business')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              scopeFilter === 'business'
                ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
              className="bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
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
              className="bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
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
              <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
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
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
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

            {scope === 'business' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proyecto del Kanban (Opcional)</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Tablero general de la empresa</option>
                  {data.projects
                    .filter((p) => p.businessId === businessId)
                    .map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Descripción / Qué toca hacer
              </label>
              <textarea
                rows={2}
                placeholder="Detalla qué hay que hacer, pasos o criterios clave..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 resize-y"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Link de Recurso / Archivo (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={newResourceLink}
                onChange={(e) => setNewResourceLink(e.target.value)}
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={newRemindInInbox}
                  onChange={(e) => setNewRemindInInbox(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded"
                />
                <span>Enviar también a Bandeja de Recordatorios</span>
              </label>
            </div>

            <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5 text-sky-500" />
                <span>Subtareas / Pasos ({newSubtasks.length})</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Añadir paso o subtarea..."
                  value={newSubtaskDraft}
                  onChange={(e) => setNewSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSubtask();
                    }
                  }}
                  className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddNewSubtask}
                  className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold cursor-pointer shrink-0"
                >
                  + Paso
                </button>
              </div>
              {newSubtasks.length > 0 && (
                <div className="space-y-1">
                  {newSubtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-black/30 text-xs"
                    >
                      <span className="text-slate-800 dark:text-slate-200 truncate">{st.text}</span>
                      <button
                        type="button"
                        onClick={() => setNewSubtasks((prev) => prev.filter((item) => item.id !== st.id))}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              className="px-4 py-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 cursor-pointer"
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
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
              const project = task.projectId ? data.projects.find((p) => p.id === task.projectId) : null;
              const assignee = task.delegatedToId ? data.teamMembers.find((m) => m.id === task.delegatedToId) : null;
              const subtasks = task.subtasks || [];
              const doneSubs = subtasks.filter((s) => s.done).length;
              const isBusinessTask = task.scope === 'business' || Boolean(task.businessId);

              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenTaskDetail(task)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border gap-3 transition-all cursor-pointer group ${
                    isDone
                      ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-950/25 dark:to-violet-950/20 border-indigo-500/30 text-slate-500 dark:text-slate-400'
                      : isOverdue
                      ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-slate-900 dark:text-slate-100 hover:border-rose-500/60'
                      : 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 hover:border-sky-500/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskStatus(task.id);
                      }}
                      title={isDone ? 'Reabrir tarea' : 'Marcar como completada'}
                      className="mt-0.5 sm:mt-0 cursor-pointer shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 hover:text-sky-500 shrink-0 transition-colors" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs block transition-colors ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'font-semibold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400'
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {/* Scope & Company Tag */}
                        {task.scope === 'personal' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-sky-500/15 to-blue-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-semibold text-[10px]">
                            Personal · {task.pillar ? task.pillar.toUpperCase() : 'General'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold text-[10px] flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {business?.name || 'Empresa'}
                          </span>
                        )}

                        {project && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-[10px] font-semibold">
                            {project.name}
                          </span>
                        )}

                        <span>·</span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : isDueToday ? 'text-sky-600 dark:text-sky-300 font-semibold' : ''}`}>
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

                        {subtasks.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                              <ListChecks className="w-3 h-3" />
                              {doneSubs}/{subtasks.length}
                            </span>
                          </>
                        )}

                        {task.resourceLink && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                              <Link2 className="w-3 h-3" />
                              Recurso
                            </span>
                          </>
                        )}

                        {assignee && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {assignee.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      {task.priority === 'urgent_important' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          Urgente &amp; Vital
                        </span>
                      )}
                      {task.priority === 'important' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                          Alto Impacto
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenTaskDetail(task)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          isBusinessTask
                            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                            : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                        }`}
                      >
                        <span>{isBusinessTask ? 'Kanban' : 'Detalle'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
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
                      ? 'bg-gradient-to-b from-sky-500/15 to-indigo-500/10 dark:from-sky-950/30 dark:to-indigo-950/20 border-sky-500/45 shadow-sm'
                      : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  {/* Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">{day.dayName}</span>
                        <span className={`text-base font-bold ${day.isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
                          {day.dayNumber}
                        </span>
                      </div>
                      {day.isToday && (
                        <span className="text-[10px] font-semibold bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30">
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
                              onClick={() => handleOpenTaskDetail(t)}
                              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-indigo-500/10 dark:bg-indigo-950/20 border-indigo-500/25 text-slate-400 dark:text-slate-500'
                                  : 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-900 dark:text-slate-200 hover:border-sky-500/45 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskStatus(t.id);
                                  }}
                                  className="mt-0.5 shrink-0 cursor-pointer"
                                  title={isDone ? 'Reabrir tarea' : 'Completar tarea'}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hover:text-sky-500" />
                                  )}
                                </button>
                                <span className={`text-[11px] line-clamp-2 ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'font-semibold text-slate-900 dark:text-white'}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div
                                className="mt-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="truncate">{t.scope === 'personal' ? 'Personal' : biz?.name || 'Empresa'}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTaskDetail(t)}
                                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                                  >
                                    {t.scope === 'business' || t.businessId ? 'Kanban' : 'Ver'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => rescheduleTask(t.id, new Date(new Date(day.dateStr).getTime() + 86400000).toISOString().split('T')[0])}
                                    className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
                                    title="Posponer al día siguiente"
                                  >
                                    +1d
                                  </button>
                                </div>
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
                    className="w-full mt-3 py-1.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-sky-500/45 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
                  className="px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-400 border border-sky-500/30 rounded-lg hover:bg-sky-500/10 cursor-pointer"
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
                        ? 'bg-gradient-to-br from-sky-500/20 to-indigo-500/15 border-sky-500 text-slate-900 dark:text-white shadow-md shadow-sky-500/15'
                        : cell.isToday
                        ? 'bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/40 text-sky-800 dark:text-sky-300'
                        : cell.isCurrentMonth
                        ? 'bg-white dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] text-slate-800 dark:text-slate-200 hover:border-sky-500/35'
                        : 'bg-slate-100/50 dark:bg-black/10 border-transparent text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cell.isToday ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                        {cell.dayNumber}
                      </span>
                      {hasOverdue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Tareas vencidas" />
                      )}
                    </div>

                    {dayTasks.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/25">
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
                  <span className="text-[10px] font-semibold uppercase text-sky-600 dark:text-sky-400 tracking-wider">Día Seleccionado</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{selectedDate}</h3>
                </div>
                <button
                  onClick={() => openAddFormWithDate(selectedDate)}
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1 cursor-pointer"
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
                          onClick={() => handleOpenTaskDetail(task)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isDone
                              ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-950/20 dark:to-violet-950/15 border-indigo-500/25 text-slate-500'
                              : 'bg-slate-50/90 dark:bg-black/30 border-slate-200/90 dark:border-white/[0.06] hover:border-sky-500/45 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskStatus(task.id);
                                }}
                                className="mt-0.5 shrink-0 cursor-pointer"
                                title={isDone ? 'Reabrir tarea' : 'Completar tarea'}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 hover:text-sky-500" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <span className={`text-xs block ${isDone ? 'line-through text-slate-400' : 'font-semibold text-slate-900 dark:text-white'}`}>
                                  {task.title}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  <span>{task.scope === 'personal' ? 'Personal' : biz?.name || 'Empresa'}</span>
                                  {task.estimatedMinutes && <span>· {task.estimatedMinutes} min</span>}
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-slate-400">
              Toca cualquier tarea para abrir su detalle completo o su tablero Kanban correspondiente.
            </div>
          </div>
        </div>
      )}

      {/* Personal Task Detail & Edit Modal (Portal — Web & Mobile responsive) */}
      {detailTaskId &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
            onClick={() => setDetailTaskId(null)}
          >
            <form
              onSubmit={handleSaveTaskDetail}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-sky-500/30 shadow-2xl space-y-4 sm:my-auto"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Detalle de Tarea Personal
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Consulta y actualiza qué toca hacer, subtareas, tiempo, recurso y estado.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailTaskId(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Título de la Tarea
                </label>
                <input
                  type="text"
                  required
                  value={detailTitle}
                  onChange={(e) => setDetailTitle(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Status selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Estado:
                </span>
                {([
                  { id: 'inbox', label: 'Bandeja' },
                  { id: 'todo', label: 'Por Hacer' },
                  { id: 'in_progress', label: 'En Progreso' },
                  { id: 'done', label: 'Completada' },
                ] as const).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDetailStatus(st.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      detailStatus === st.id
                        ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                        : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Pillar, Priority, Due Date, Estimated Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Pilar de Crecimiento
                  </label>
                  <select
                    value={detailPillar}
                    onChange={(e) => setDetailPillar(e.target.value as PillarKey | '')}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="fisico">Físico</option>
                    <option value="intelectual">Intelectual</option>
                    <option value="emocional">Emocional</option>
                    <option value="espiritual">Espiritual</option>
                    <option value="financiero">Financiero</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Prioridad
                  </label>
                  <select
                    value={detailPriority}
                    onChange={(e) => setDetailPriority(e.target.value as BusinessTask['priority'])}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="urgent_important">Urgente &amp; Vital</option>
                    <option value="important">Alto Impacto</option>
                    <option value="urgent">Urgente</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={detailDueDate}
                    onChange={(e) => setDetailDueDate(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Tiempo Estimado (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={detailEstimatedMinutes}
                    onChange={(e) => setDetailEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Description / What needs to be done */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción / Qué toca hacer
                </label>
                <textarea
                  rows={3}
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  placeholder="Describe exactamente qué pasos seguir, notas de contexto o resultado esperado..."
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white resize-y focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Resource Link + Reminder */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Link de Recurso / Referencia
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={detailResourceLink}
                      onChange={(e) => setDetailResourceLink(e.target.value)}
                      placeholder="https://drive.google.com/... o https://..."
                      className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                    {detailResourceLink.trim() && (
                      <a
                        href={detailResourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={detailRemindInInbox}
                    onChange={(e) => setDetailRemindInInbox(e.target.checked)}
                    className="w-4 h-4 accent-violet-600 rounded"
                  />
                  <span className="flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5 text-violet-500" />
                    Recordatorios
                  </span>
                </label>
              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      Checklist / Subtareas ({detailSubtasks.filter((s) => s.done).length}/{detailSubtasks.length})
                    </span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Añadir paso o subtarea..."
                    value={detailSubtaskDraft}
                    onChange={(e) => setDetailSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDetailSubtask();
                      }
                    }}
                    className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddDetailSubtask}
                    className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold cursor-pointer shrink-0"
                  >
                    + Subtarea
                  </button>
                </div>

                {detailSubtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {detailSubtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.06] text-xs"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setDetailSubtasks((prev) =>
                              prev.map((item) => (item.id === st.id ? { ...item, done: !item.done } : item))
                            )
                          }
                          className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                        >
                          {st.done ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={
                              st.done
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                          >
                            {st.text}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDetailSubtasks((prev) => prev.filter((item) => item.id !== st.id))
                          }
                          className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                          title="Quitar subtarea"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    deleteTask(detailTaskId);
                    setDetailTaskId(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setDetailTaskId(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
};
