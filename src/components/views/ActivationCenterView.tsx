import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { AutomationRule, ReminderOriginModule, ScheduleSlot } from '../../types';
import {
  Sliders,
  Clock,
  Sun,
  Flame,
  Dumbbell,
  Coffee,
  Building2,
  BookOpen,
  Moon,
  Bell,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Edit3,
  Check,
  X,
  Send,
  Compass,
  CheckSquare,
  DollarSign,
  Brain,
  Heart,
  Layers,
  Bot,
  Sparkles,
} from 'lucide-react';

interface ActivationCenterViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate: (view: string) => void;
}

const SYSTEM_MODULES: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  origin: ReminderOriginModule;
}[] = [
  { id: 'mi_dia', label: 'Mi Día', icon: Compass, color: 'text-emerald-500', origin: 'sistema' },
  { id: 'super_morning', label: 'Súper Mañana', icon: Sun, color: 'text-amber-500', origin: 'super_manana' },
  { id: 'super_night', label: 'Súper Noche', icon: Moon, color: 'text-indigo-500', origin: 'super_noche' },
  { id: 'mindset', label: 'Mentalidad & IA Coach', icon: Flame, color: 'text-orange-500', origin: 'sistema' },
  { id: 'physical_trainer', label: 'Mi Entrenador Físico', icon: Dumbbell, color: 'text-lime-500', origin: 'fisico' },
  { id: 'tasks_general', label: 'Gestión de Tareas', icon: CheckSquare, color: 'text-teal-500', origin: 'personal' },
  { id: 'personal_finances', label: 'Finanzas Personales', icon: DollarSign, color: 'text-emerald-500', origin: 'finanzas' },
  { id: 'business', label: 'Multi-Negocio & Proyectos', icon: Building2, color: 'text-blue-500', origin: 'business' },
  { id: 'strategy', label: 'Dirección & Estrategia', icon: Layers, color: 'text-indigo-500', origin: 'business' },
  { id: 'wisdom_library', label: 'Biblioteca de Sabiduría', icon: BookOpen, color: 'text-yellow-500', origin: 'sabiduria' },
  { id: 'second_brain', label: 'Segundo Cerebro & Recordatorios', icon: Brain, color: 'text-violet-500', origin: 'sistema' },
  { id: 'personal', label: 'Personal (Rituales)', icon: Heart, color: 'text-rose-500', origin: 'personal' },
  { id: 'habits_goals', label: 'Hábitos & Metas', icon: Sparkles, color: 'text-rose-500', origin: 'personal' },
  { id: 'ai_assistant', label: 'Asistente IA del Sistema', icon: Bot, color: 'text-cyan-500', origin: 'sistema' },
];

const getModuleMeta = (viewId?: string) => {
  return (
    SYSTEM_MODULES.find((m) => m.id === viewId) || {
      id: viewId || 'mi_dia',
      label: 'Mi Día',
      icon: Coffee,
      color: 'text-amber-500',
      origin: 'sistema' as ReminderOriginModule,
    }
  );
};

export const ActivationCenterView: React.FC<ActivationCenterViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const slots = data.scheduleSlots || [];

  // Drag & drop state for chronological schedule
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // Add/Edit slot form state
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotTime, setSlotTime] = useState('10:00');
  const [slotLabel, setSlotLabel] = useState('');
  const [slotDesc, setSlotDesc] = useState('');
  const [slotView, setSlotView] = useState('business');

  // Add/Edit automation rule state
  const [showAutoForm, setShowAutoForm] = useState(false);
  const [editingAutoId, setEditingAutoId] = useState<string | null>(null);
  const [autoName, setAutoName] = useState('');
  const [autoTime, setAutoTime] = useState('08:00');
  const [autoType, setAutoType] = useState<AutomationRule['type']>('activation');
  const [autoTargetModule, setAutoTargetModule] = useState('super_morning');
  const [autoMessage, setAutoMessage] = useState('');
  const [autoDesc, setAutoDesc] = useState('');

  // Feedback banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- Chronological Slots Handlers ---
  const handleDropSlot = (targetIdx: number) => {
    if (draggedSlotIndex === null || draggedSlotIndex === targetIdx) {
      setDraggedSlotIndex(null);
      setDragOverSlotIndex(null);
      return;
    }
    onUpdateData((prev) => {
      const next = [...(prev.scheduleSlots || [])];
      const [moved] = next.splice(draggedSlotIndex, 1);
      next.splice(targetIdx, 0, moved);
      return { ...prev, scheduleSlots: next };
    });
    setDraggedSlotIndex(null);
    setDragOverSlotIndex(null);
  };

  const moveSlot = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= slots.length) return;
    onUpdateData((prev) => {
      const next = [...(prev.scheduleSlots || [])];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return { ...prev, scheduleSlots: next };
    });
  };

  const openNewSlotForm = () => {
    setEditingSlotId(null);
    setSlotTime('10:00');
    setSlotLabel('');
    setSlotDesc('');
    setSlotView('business');
    setShowSlotForm(true);
  };

  const openEditSlotForm = (slot: ScheduleSlot) => {
    setEditingSlotId(slot.id);
    setSlotTime(slot.time);
    setSlotLabel(slot.label);
    setSlotDesc(slot.desc);
    setSlotView(slot.view);
    setShowSlotForm(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotLabel.trim()) return;

    if (editingSlotId) {
      onUpdateData((prev) => ({
        ...prev,
        scheduleSlots: (prev.scheduleSlots || []).map((s) =>
          s.id === editingSlotId
            ? { ...s, time: slotTime, label: slotLabel.trim(), desc: slotDesc.trim(), view: slotView }
            : s
        ),
      }));
      showToast('Bloque horario actualizado.');
    } else {
      const newSlot: ScheduleSlot = {
        id: `slot_${Date.now()}`,
        time: slotTime,
        label: slotLabel.trim(),
        desc: slotDesc.trim() || `Bloque vinculado a ${getModuleMeta(slotView).label}.`,
        view: slotView,
        enabled: true,
      };
      onUpdateData((prev) => ({
        ...prev,
        scheduleSlots: [...(prev.scheduleSlots || []), newSlot],
      }));
      showToast('Nuevo bloque agregado a tu día ideal.');
    }
    setShowSlotForm(false);
    setEditingSlotId(null);
  };

  const handleDeleteSlot = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      scheduleSlots: (prev.scheduleSlots || []).filter((s) => s.id !== id),
    }));
  };

  const handleToggleSlot = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      scheduleSlots: (prev.scheduleSlots || []).map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  // --- Automation Rules Handlers ---
  const toggleAutomation = (ruleId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === ruleId ? { ...a, enabled: !a.enabled } : a
      ),
    }));
  };

  const openNewAutoForm = () => {
    setEditingAutoId(null);
    setAutoName('');
    setAutoTime('08:00');
    setAutoType('reminder');
    setAutoTargetModule('mi_dia');
    setAutoMessage('');
    setAutoDesc('');
    setShowAutoForm(true);
  };

  const openEditAutoForm = (rule: AutomationRule) => {
    setEditingAutoId(rule.id);
    setAutoName(rule.name);
    setAutoTime(rule.triggerTime);
    setAutoType(rule.type);
    setAutoTargetModule(rule.targetModule || 'mi_dia');
    setAutoMessage(rule.messageTemplate || rule.description);
    setAutoDesc(rule.description);
    setShowAutoForm(true);
  };

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim() || !autoMessage.trim()) return;
    const mod = getModuleMeta(autoTargetModule);
    const computedDesc = autoDesc.trim() || `Disparo a las ${autoTime} hacia ${mod.label}`;

    if (editingAutoId) {
      onUpdateData((prev) => ({
        ...prev,
        automations: prev.automations.map((a) =>
          a.id === editingAutoId
            ? {
                ...a,
                name: autoName.trim(),
                triggerTime: autoTime,
                type: autoType,
                targetModule: autoTargetModule,
                messageTemplate: autoMessage.trim(),
                description: computedDesc,
              }
            : a
        ),
      }));
      showToast('Regla automática actualizada.');
    } else {
      const newRule: AutomationRule = {
        id: `auto_${Date.now()}`,
        name: autoName.trim(),
        description: computedDesc,
        triggerTime: autoTime,
        type: autoType,
        targetModule: autoTargetModule,
        messageTemplate: autoMessage.trim(),
        enabled: true,
      };
      onUpdateData((prev) => ({
        ...prev,
        automations: [newRule, ...prev.automations],
      }));
      showToast('Nueva regla automática creada.');
    }
    setShowAutoForm(false);
    setEditingAutoId(null);
  };

  const handleDeleteAutomation = (ruleId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      automations: prev.automations.filter((a) => a.id !== ruleId),
    }));
  };

  const handleTriggerAutomationNow = (rule: AutomationRule) => {
    const mod = getModuleMeta(rule.targetModule);
    const messageBody = rule.messageTemplate || rule.description;
    const todayStr = new Date().toISOString().split('T')[0];

    onUpdateData((prev) => ({
      ...prev,
      notifications: [
        {
          id: `notif_auto_${Date.now()}`,
          title: rule.name,
          message: messageBody,
          category: mod.origin === 'business' ? 'business' : 'reminder',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          actionUrl: rule.targetModule,
        },
        ...prev.notifications,
      ],
      notesReminders: [
        {
          id: `nr_auto_${Date.now()}`,
          title: rule.name,
          content: messageBody,
          category: mod.origin === 'super_manana' ? 'super_manana' : 'general',
          originModule: mod.origin,
          targetView: rule.targetModule || 'mi_dia',
          reminderTime: rule.triggerTime,
          reminderDate: todayStr,
          showInMiDia: true,
          completed: false,
          pinned: false,
          source: 'system',
          createdAt: new Date().toISOString(),
        },
        ...(prev.notesReminders || []),
      ],
    }));

    showToast(`Mensaje automático "${rule.name}" enviado a Notificaciones y Recordatorios.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with Amber/Orange squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
              <Sliders className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Centro de Activación Personal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ordena tu día ideal arrastrando bloques y programa mensajes automáticos conectados a cada módulo.
              </p>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="mt-4 px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Ideal Daily Execution Timeline (Draggable & Editable) */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Estructura Cronológica del Día Ideal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Arrastra los bloques para reordenarlos, edita horarios o crea bloques vinculados a cualquier módulo.
            </p>
          </div>

          <button
            onClick={openNewSlotForm}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Bloque Horario</span>
          </button>
        </div>

        {showSlotForm && (
          <form
            onSubmit={handleSaveSlot}
            className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-amber-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {editingSlotId ? 'Editar Bloque Horario' : 'Nuevo Bloque del Día Ideal'}
              </span>
              <button
                type="button"
                onClick={() => setShowSlotForm(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Título del Bloque
                </label>
                <input
                  type="text"
                  placeholder="Ej: Revisión Financiera & Pagos"
                  value={slotLabel}
                  onChange={(e) => setSlotLabel(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Módulo Vinculado
                </label>
                <select
                  value={slotView}
                  onChange={(e) => setSlotView(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {SYSTEM_MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Descripción / Enfoque
              </label>
              <input
                type="text"
                placeholder="¿Qué acción clave ejecutas en este bloque?"
                value={slotDesc}
                onChange={(e) => setSlotDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSlotForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Bloque</span>
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {slots.map((slot, idx) => {
            const mod = getModuleMeta(slot.view);
            const Icon = mod.icon;
            const isDragging = draggedSlotIndex === idx;
            const isDragOver = dragOverSlotIndex === idx && draggedSlotIndex !== idx;

            return (
              <div
                key={slot.id}
                draggable
                onDragStart={() => setDraggedSlotIndex(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlotIndex(idx);
                }}
                onDragLeave={() => setDragOverSlotIndex(null)}
                onDrop={() => handleDropSlot(idx)}
                onDragEnd={() => {
                  setDraggedSlotIndex(null);
                  setDragOverSlotIndex(null);
                }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all shadow-sm ${
                  isDragging
                    ? 'opacity-50 scale-[0.99] border-amber-500'
                    : isDragOver
                    ? 'border-amber-500 bg-amber-500/10'
                    : slot.enabled
                    ? 'bg-slate-50/90 dark:bg-black/30 border-slate-200/80 dark:border-white/[0.06] hover:border-amber-400/40'
                    : 'bg-slate-100/50 dark:bg-black/15 border-slate-200/50 dark:border-white/[0.04] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-amber-500 p-1 shrink-0"
                    title="Arrastra para reordenar"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span className="w-14 text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                    {slot.time}
                  </span>

                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className={`w-4 h-4 ${mod.color}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {slot.label}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                        {mod.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{slot.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => moveSlot(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Subir"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSlot(idx, 1)}
                    disabled={idx === slots.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Bajar"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditSlotForm(slot)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
                    title="Editar bloque"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleSlot(slot.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      slot.enabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {slot.enabled ? 'Activo' : 'Pausado'}
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate(slot.view)}
                    className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold cursor-pointer"
                  >
                    Abrir →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automations Engine (Custom Rules & Custom Messages) */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Motor Central de Automatizaciones & Mensajes Programables
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crea qué mensajes automáticos o reglas de notificación deseas recibir y vincúlalos a tus módulos.
            </p>
          </div>

          <button
            onClick={openNewAutoForm}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Regla / Mensaje</span>
          </button>
        </div>

        {showAutoForm && (
          <form
            onSubmit={handleSaveAutomation}
            className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-amber-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {editingAutoId ? 'Editar Regla Automática' : 'Crear Mensaje Automático Personalizado'}
              </span>
              <button
                type="button"
                onClick={() => setShowAutoForm(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Nombre de la Regla
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alerta de Agua & Postura"
                  value={autoName}
                  onChange={(e) => setAutoName(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Hora de Disparo
                </label>
                <input
                  type="time"
                  value={autoTime}
                  onChange={(e) => setAutoTime(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Tipo de Regla
                </label>
                <select
                  value={autoType}
                  onChange={(e) => setAutoType(e.target.value as AutomationRule['type'])}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="activation">Activación</option>
                  <option value="focus">Enfoque</option>
                  <option value="reminder">Recordatorio</option>
                  <option value="capsule">Sabiduría</option>
                  <option value="reflection">Reflexión</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Módulo Destino
                </label>
                <select
                  value={autoTargetModule}
                  onChange={(e) => setAutoTargetModule(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {SYSTEM_MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Descripción corta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Objetivo de esta automatización"
                  value={autoDesc}
                  onChange={(e) => setAutoDesc(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Mensaje Automático que Recibirás
              </label>
              <textarea
                rows={2}
                required
                placeholder="Escribe exactamente el mensaje o llamada al orden que quieres recibir..."
                value={autoMessage}
                onChange={(e) => setAutoMessage(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAutoForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Regla</span>
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {data.automations.map((rule) => {
            const mod = getModuleMeta(rule.targetModule);
            return (
              <div
                key={rule.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] shadow-sm"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{rule.name}</h3>
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
                      {rule.triggerTime}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-white/[0.06] px-2 py-0.5 rounded-md">
                      {mod.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rule.description}</p>
                  {rule.messageTemplate && (
                    <div className="text-xs text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/[0.06] rounded-xl px-3 py-2 mt-1.5">
                      <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 mr-1.5">
                        Mensaje:
                      </span>
                      "{rule.messageTemplate}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleTriggerAutomationNow(rule)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Probar y enviar este mensaje ahora a Notificaciones & Recordatorios"
                  >
                    <Send className="w-3 h-3" />
                    <span>Probar Ahora</span>
                  </button>

                  <button
                    onClick={() => openEditAutoForm(rule)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
                    title="Editar regla"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteAutomation(rule.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Eliminar regla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleAutomation(rule.id)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      rule.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm ${
                        rule.enabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
