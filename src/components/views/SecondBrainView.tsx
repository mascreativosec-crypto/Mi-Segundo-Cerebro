import React, { useMemo, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import {
  CapturedBrainItem,
  NoteReminderItem,
  PillarKey,
  ReminderOriginModule,
} from '../../types';
import {
  Brain,
  Search,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  BellRing,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Pin,
  CheckSquare,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  DollarSign,
} from 'lucide-react';

interface SecondBrainViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
  onNavigate: (view: string) => void;
  initialTab?: 'reminders' | 'knowledge';
}

export const ORIGIN_MODULE_META: Record<
  ReminderOriginModule,
  { label: string; textClass: string; bgClass: string }
> = {
  personal: {
    label: 'Personal',
    textClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
  },
  business: {
    label: 'Empresarial',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
  },
  super_manana: {
    label: 'Súper Mañana',
    textClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
  },
  super_noche: {
    label: 'Súper Noche',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10 border-indigo-500/20',
  },
  finanzas: {
    label: 'Finanzas',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  fisico: {
    label: 'Entrenador Físico',
    textClass: 'text-lime-600 dark:text-lime-400',
    bgClass: 'bg-lime-500/10 border-lime-500/20',
  },
  sabiduria: {
    label: 'Sabiduría',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
  },
  sistema: {
    label: 'Sistema',
    textClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-500/10 border-violet-500/20',
  },
  general: {
    label: 'General',
    textClass: 'text-slate-600 dark:text-slate-300',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
  },
};

export const resolveReminderOrigin = (rem: NoteReminderItem): ReminderOriginModule => {
  if (rem.originModule) return rem.originModule;
  if (rem.source === 'super_morning' || rem.category === 'super_manana') return 'super_manana';
  if (rem.source === 'system' || rem.source === 'ai_assistant') return 'sistema';
  if (rem.category === 'tarea') return 'business';
  return 'personal';
};

export const SecondBrainView: React.FC<SecondBrainViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
  initialTab = 'reminders',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'reminders' | 'knowledge'>(initialTab);

  // --- Tab 1: Recordatorios & Bandeja del Sistema ---
  const [remFilter, setRemFilter] = useState<'all' | 'mi_dia' | 'pending' | 'completed'>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [remTitle, setRemTitle] = useState('');
  const [remContent, setRemContent] = useState('');
  const [remOrigin, setRemOrigin] = useState<ReminderOriginModule>('personal');
  const [remDate, setRemDate] = useState(todayStr);
  const [remTime, setRemTime] = useState('');
  const [remShowInMiDia, setRemShowInMiDia] = useState(true);

  // --- Tab 2: Captura & Conocimiento ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<CapturedBrainItem['type']>('idea');
  const [newPillar, setNewPillar] = useState<PillarKey | ''>('intelectual');
  const [newTags, setNewTags] = useState('Estrategia, Crecimiento');

  const reminders = data.notesReminders || [];

  // Unified Task Reminders Inbox: tasks that are overdue, due today, urgent, or flagged with remindInInbox
  const taskInboxReminders = useMemo(() => {
    return data.tasks
      .filter(
        (t) =>
          t.status !== 'done' &&
          (t.remindInInbox ||
            t.dueDate <= todayStr ||
            t.priority === 'urgent_important' ||
            t.priority === 'urgent')
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.tasks, todayStr]);

  // Financial obligations due reminder feed
  const activeDebts = useMemo(
    () => (data.personalFinances.creditAccounts || []).filter((c) => c.currentBalanceRemaining > 0),
    [data.personalFinances.creditAccounts]
  );

  // Unread notifications feed
  const unreadNotifs = useMemo(
    () => (data.notifications || []).filter((n) => !n.read),
    [data.notifications]
  );

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() && !remContent.trim()) return;

    const targetMap: Partial<Record<ReminderOriginModule, string>> = {
      personal: 'personal',
      business: 'business',
      super_manana: 'super_morning',
      super_noche: 'super_night',
      finanzas: 'personal_finances',
      fisico: 'physical_trainer',
      sabiduria: 'wisdom_library',
      sistema: 'activation_center',
    };

    const newItem: NoteReminderItem = {
      id: `nr_${Date.now()}`,
      title: remTitle.trim() || 'Nota rápida',
      content: remContent.trim(),
      category:
        remOrigin === 'super_manana'
          ? 'super_manana'
          : remOrigin === 'business'
          ? 'tarea'
          : 'general',
      originModule: remOrigin,
      targetView: targetMap[remOrigin] || 'second_brain',
      reminderDate: remDate || todayStr,
      reminderTime: remTime || undefined,
      showInMiDia: remShowInMiDia,
      completed: false,
      pinned: false,
      source: remOrigin === 'super_manana' ? 'super_morning' : 'user',
      createdAt: new Date().toISOString(),
    };

    onUpdateData((prev) => ({
      ...prev,
      notesReminders: [newItem, ...(prev.notesReminders || [])],
    }));

    setRemTitle('');
    setRemContent('');
    setRemTime('');
  };

  const handleToggleReminderComplete = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleToggleMiDia = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((item) =>
        item.id === id ? { ...item, showInMiDia: !item.showInMiDia } : item
      ),
    }));
  };

  const handleTogglePin = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item
      ),
    }));
  };

  const handleDeleteReminder = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).filter((item) => item.id !== id),
    }));
  };

  const handleMarkNotifRead = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const filteredReminders = useMemo(() => {
    const list = reminders.filter((item) => {
      const origin = resolveReminderOrigin(item);
      if (originFilter !== 'all' && origin !== originFilter) return false;
      if (remFilter === 'mi_dia') return item.showInMiDia && !item.completed;
      if (remFilter === 'pending') return !item.completed;
      if (remFilter === 'completed') return item.completed;
      return true;
    });

    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [reminders, remFilter, originFilter]);

  // Knowledge capture handlers
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: CapturedBrainItem = {
      id: `brain_${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      pillar: newPillar ? (newPillar as PillarKey) : undefined,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      processed: false,
    };

    onUpdateData((prev) => ({
      ...prev,
      capturedItems: [newItem, ...prev.capturedItems],
    }));

    setShowAddForm(false);
    setNewTitle('');
    setNewContent('');
  };

  const toggleProcessed = (itemId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      capturedItems: prev.capturedItems.map((item) =>
        item.id === itemId ? { ...item, processed: !item.processed } : item
      ),
    }));
  };

  const deleteItem = (itemId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      capturedItems: prev.capturedItems.filter((item) => item.id !== itemId),
    }));
  };

  const filteredKnowledgeItems = data.capturedItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesPillar = selectedPillar === 'all' || item.pillar === selectedPillar;

    return matchesSearch && matchesType && matchesPillar;
  });

  const activeInMiDiaCount = reminders.filter((i) => i.showInMiDia && !i.completed).length;

  return (
    <div className="space-y-6">
      {/* Unified Header Banner - Segundo Cerebro Violet/Fuchsia Palette */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/25 shrink-0">
              <Brain className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Segundo Cerebro & Recordatorios
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Bandeja central de recordatorios del sistema, alertas de tareas e ideas de conocimiento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-1 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('reminders')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Recordatorios ({reminders.filter((r) => !r.completed).length + taskInboxReminders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('knowledge')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'knowledge'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Conocimiento ({data.capturedItems.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('mi_dia')}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-violet-500/15 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Mi Día ({activeInMiDiaCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-violet-500" />
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: RECORDATORIOS UNIFICADOS DEL SISTEMA */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          {/* Bloque 1 (Full Width): Nuevo Recordatorio o Nota */}
          <form
            onSubmit={handleAddReminder}
            className="w-full p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-500" />
                <span>Nuevo Recordatorio o Nota</span>
              </h2>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remShowInMiDia}
                  onChange={(e) => setRemShowInMiDia(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span>Mostrar en &quot;Recordatorios del Día&quot; en Mi Día</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Título o recordatorio breve
                </label>
                <input
                  type="text"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Ej: Enviar contrato, comprar suplemento o frase de enfoque..."
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Área / Módulo
                </label>
                <select
                  value={remOrigin}
                  onChange={(e) => setRemOrigin(e.target.value as ReminderOriginModule)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="personal">Personal</option>
                  <option value="business">Empresarial</option>
                  <option value="super_manana">Súper Mañana</option>
                  <option value="super_noche">Súper Noche</option>
                  <option value="finanzas">Finanzas</option>
                  <option value="fisico">Entrenador Físico</option>
                  <option value="sabiduria">Sabiduría</option>
                  <option value="sistema">Sistema</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Detalle, frase o contexto
                </label>
                <textarea
                  rows={2}
                  value={remContent}
                  onChange={(e) => setRemContent(e.target.value)}
                  placeholder="Escribe el detalle o nota que deseas tener presente..."
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="md:w-56 py-3 px-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99] shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Recordatorio</span>
              </button>
            </div>
          </form>

          {/* Distribución Uniforme Inferior */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda (7 cols): Todos los Recordatorios del Sistema */}
            <div className="lg:col-span-7 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Todos los Recordatorios del Sistema ({filteredReminders.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Centralizados por área de origen. Activa el ojo para mostrar en Mi Día.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={originFilter}
                    onChange={(e) => setOriginFilter(e.target.value)}
                    className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Todas las Áreas</option>
                    <option value="personal">Personal</option>
                    <option value="business">Empresarial</option>
                    <option value="super_manana">Súper Mañana</option>
                    <option value="super_noche">Súper Noche</option>
                    <option value="finanzas">Finanzas</option>
                    <option value="fisico">Entrenador Físico</option>
                    <option value="sistema">Sistema</option>
                  </select>

                  <div className="p-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-1 text-xs font-semibold">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'mi_dia', label: 'Mi Día' },
                      { id: 'pending', label: 'Pendientes' },
                      { id: 'completed', label: 'Hechos' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRemFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          remFilter === tab.id
                            ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredReminders.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-300/80 dark:border-white/[0.1] rounded-2xl space-y-2">
                  <Sparkles className="w-6 h-6 text-violet-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No hay recordatorios en este filtro.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crea un recordatorio arriba o desde cualquier módulo del sistema.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                  {filteredReminders.map((item) => {
                    const originKey = resolveReminderOrigin(item);
                    const originMeta = ORIGIN_MODULE_META[originKey] || ORIGIN_MODULE_META.general;
                    return (
                      <div
                        key={item.id}
                        className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleReminderComplete(item.id)}
                            className="mt-0.5 text-slate-400 hover:text-violet-500 transition-colors cursor-pointer shrink-0"
                            title={item.completed ? 'Marcar como pendiente' : 'Completar recordatorio'}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${originMeta.bgClass} ${originMeta.textClass}`}
                              >
                                {originMeta.label}
                              </span>
                              <span
                                onClick={() => item.targetView && onNavigate(item.targetView)}
                                className={`text-sm font-bold ${
                                  item.targetView ? 'cursor-pointer hover:text-violet-600 dark:hover:text-violet-400' : ''
                                } ${
                                  item.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.pinned && !item.completed && (
                                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                                  · Fijado
                                </span>
                              )}
                            </div>

                            {item.content && (
                              <p
                                className={`text-xs leading-relaxed ${
                                  item.completed
                                    ? 'text-slate-400 dark:text-slate-500'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {item.content}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {item.reminderDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {item.reminderDate}
                                </span>
                              )}
                              {item.reminderTime && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.reminderTime}
                                  </span>
                                </>
                              )}
                              {item.targetView && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(item.targetView!)}
                                    className="text-violet-600 dark:text-violet-400 font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Ir al módulo
                                    <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleMiDia(item.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.showInMiDia
                                ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                            }`}
                            title={item.showInMiDia ? 'Visible en Mi Día' : 'Mostrar en Mi Día'}
                          >
                            {item.showInMiDia ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePin(item.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.pinned
                                ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                            }`}
                            title={item.pinned ? 'Quitar fijado' : 'Fijar arriba'}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna Derecha (5 cols): Bandeja de Tareas Programadas, Vencimientos Financieros y Alertas */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Bandeja de Tareas Programadas ({taskInboxReminders.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tareas por vencer, vencidas o con recordatorio. Clic para ir a la tarea.
                    </p>
                  </div>
                </div>

                {taskInboxReminders.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-3 px-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.02]">
                    No tienes tareas por vencer ni recordatorios de tareas pendientes.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06] max-h-72 overflow-y-auto pr-1">
                    {taskInboxReminders.map((task) => {
                      const isOverdue = Boolean(task.dueDate && task.dueDate < todayStr);
                      const originMeta =
                        task.scope === 'business'
                          ? ORIGIN_MODULE_META.business
                          : ORIGIN_MODULE_META.personal;

                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onNavigate('tasks_general')}
                          className="w-full py-2.5 text-left flex items-start justify-between gap-2.5 hover:bg-violet-500/[0.06] -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums">
                              <span
                                className={`px-1.5 py-0.5 rounded-md border font-semibold ${originMeta.bgClass} ${originMeta.textClass}`}
                              >
                                {originMeta.label}
                              </span>
                              {isOverdue ? (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Vencida ({task.dueDate})
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">
                                  Vence: {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 shrink-0 mt-0.5" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeDebts.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Vencimientos Financieros Activos
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('personal_finances')}
                        className="hover:underline cursor-pointer"
                      >
                        Ir a Finanzas
                      </button>
                    </div>
                    {activeDebts.slice(0, 3).map((debt) => (
                      <div
                        key={debt.id}
                        onClick={() => onNavigate('personal_finances')}
                        className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-xs cursor-pointer hover:border-violet-500/40"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {debt.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Corte / Límite: {debt.dueDate}
                          </p>
                        </div>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
                          ${debt.currentBalanceRemaining.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {unreadNotifs.length > 0 && (
                <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-violet-500/20 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Alertas Recientes del Sistema ({unreadNotifs.length})
                  </h3>
                  <div className="space-y-2">
                    {unreadNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotifRead(n.id)}
                        className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3 cursor-pointer hover:border-violet-500/40"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300">
                              {n.category === 'business'
                                ? 'Empresarial'
                                : n.category === 'personal'
                                ? 'Personal'
                                : 'Sistema'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                          Marcar leída
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAPTURA & CONOCIMIENTO (SEGUNDO CEREBRO) */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="p-4 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por palabra clave, contenido o etiqueta (#IA, #Ventas)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Todos los Tipos</option>
                <option value="idea">Ideas</option>
                <option value="note">Notas</option>
                <option value="quote">Citas</option>
                <option value="task">Tareas</option>
                <option value="document">Documentos</option>
              </select>

              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
                className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Todas las Dimensiones</option>
                <option value="espiritual">Espiritual</option>
                <option value="emocional">Emocional</option>
                <option value="fisico">Físico</option>
                <option value="intelectual">Intelectual</option>
                <option value="financiero">Financiero</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-violet-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nueva Nota / Idea</span>
              </button>
            </div>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateItem}
              className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-violet-500/30 shadow-xl space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Capturar en Segundo Cerebro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Título / Concepto clave"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="idea">Idea de Alto Impacto</option>
                  <option value="note">Nota de Aprendizaje</option>
                  <option value="quote">Cita Trascendental</option>
                  <option value="task">Tarea / Compromiso</option>
                  <option value="document">Documento / Enlace</option>
                </select>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as any)}
                  className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="intelectual">Pilar Intelectual</option>
                  <option value="espiritual">Pilar Espiritual</option>
                  <option value="emocional">Pilar Emocional</option>
                  <option value="fisico">Pilar Físico</option>
                  <option value="financiero">Pilar Financiero</option>
                </select>
              </div>

              <textarea
                rows={3}
                placeholder="Desarrolla el contenido o insight..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Etiquetas separadas por coma (ej: IA, Ventas, Liderazgo)"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full sm:flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Guardar en Memoria
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledgeItems.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all shadow-sm ${
                  item.processed
                    ? 'bg-slate-100/60 dark:bg-black/20 border-slate-200/60 dark:border-white/[0.04] text-slate-500 dark:text-slate-400'
                    : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 hover:border-violet-400/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-lg">
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium tabular-nums">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {item.content}
                  </p>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-black/30 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleProcessed(item.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
                  >
                    {item.processed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Procesado</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        <span>Marcar Procesado</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                    title="Eliminar elemento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

