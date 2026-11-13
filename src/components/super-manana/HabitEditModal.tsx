import React, { useState, useEffect } from 'react';
import { SuperMorningHabit, HabitCategory, PromptField, PromptFieldType } from '../../types/super-morning';
import {
  X,
  Plus,
  Trash2,
  Moon,
  Sparkles,
  Eye,
  Zap,
  BookOpen,
  CheckSquare,
  Droplets,
  Activity,
  Wind,
  Target,
  Feather,
  Sun,
  Heart,
  Flame,
  Coffee,
  Smile,
  Dumbbell,
  Compass,
  Headphones,
  Shield,
  Tag,
} from 'lucide-react';

interface HabitEditModalProps {
  habit: SuperMorningHabit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedHabit: SuperMorningHabit) => void;
  theme?: 'amber' | 'purple';
}

const AVAILABLE_ICONS = [
  { name: 'Moon', icon: Moon },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Eye', icon: Eye },
  { name: 'Zap', icon: Zap },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'CheckSquare', icon: CheckSquare },
  { name: 'Droplets', icon: Droplets },
  { name: 'Activity', icon: Activity },
  { name: 'Wind', icon: Wind },
  { name: 'Target', icon: Target },
  { name: 'Feather', icon: Feather },
  { name: 'Sun', icon: Sun },
  { name: 'Heart', icon: Heart },
  { name: 'Flame', icon: Flame },
  { name: 'Coffee', icon: Coffee },
  { name: 'Smile', icon: Smile },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Compass', icon: Compass },
  { name: 'Headphones', icon: Headphones },
  { name: 'Shield', icon: Shield },
];

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: 'mind', label: 'Mentalidad / Diálogo Interno' },
  { value: 'spirit', label: 'Silencio, Calma & Espiritualidad' },
  { value: 'body', label: 'Físico, Respiración & Vitalidad' },
  { value: 'focus', label: 'Enfoque, Tarea Dominó & Intelecto' },
];

export const HabitEditModal: React.FC<HabitEditModalProps> = ({
  habit,
  isOpen,
  onClose,
  onSave,
  theme = 'amber',
}) => {
  const isPurple = theme === 'purple';
  const isEditing = Boolean(habit);

  const [title, setTitle] = useState(habit?.title || '');
  const [defaultMinutes, setDefaultMinutes] = useState(habit?.defaultMinutes || 2);
  const [category, setCategory] = useState<HabitCategory>(habit?.category || 'mind');
  const [description, setDescription] = useState(habit?.description || '');
  const [practicalTip, setPracticalTip] = useState(habit?.instructions?.[0] || '');
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon || 'Sun');
  const [enableAiDailyMessage, setEnableAiDailyMessage] = useState<boolean>(
    Boolean(habit?.enableAiDailyMessage)
  );
  const [aiMessageTopic, setAiMessageTopic] = useState<'motivacion' | 'meditacion' | 'isra' | 'general'>(
    (habit?.aiMessageTopic as 'motivacion' | 'meditacion' | 'isra' | 'general') || 'motivacion'
  );
  const [linkToFitness, setLinkToFitness] = useState<boolean>(Boolean(habit?.linkToFitness));

  // Fields management
  const [enableFields, setEnableFields] = useState<boolean>(
    Boolean(habit?.fields && habit.fields.length > 0)
  );
  const [fields, setFields] = useState<PromptField[]>(habit?.fields ? [...habit.fields] : []);

  // New field contextual inputs
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<PromptFieldType>('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldOptionsText, setNewFieldOptionsText] = useState('Opción 1, Opción 2, Opción 3');
  const [newFieldLeftLabel, setNewFieldLeftLabel] = useState('Bajo mi control');
  const [newFieldRightLabel, setNewFieldRightLabel] = useState('Fuera de mi control');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(habit?.title || '');
    setDefaultMinutes(habit?.defaultMinutes || 2);
    setCategory(habit?.category || 'mind');
    setDescription(habit?.description || '');
    setPracticalTip(habit?.instructions?.[0] || '');
    setSelectedIcon(habit?.icon || 'Sun');
    setEnableAiDailyMessage(Boolean(habit?.enableAiDailyMessage));
    setAiMessageTopic(
      (habit?.aiMessageTopic as 'motivacion' | 'meditacion' | 'isra' | 'general') || 'motivacion'
    );
    setLinkToFitness(Boolean(habit?.linkToFitness));
    setEnableFields(Boolean(habit?.fields && habit.fields.length > 0));
    setFields(habit?.fields ? JSON.parse(JSON.stringify(habit.fields)) : []);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldPlaceholder('');
    setNewFieldOptionsText('Opción 1, Opción 2, Opción 3');
    setNewFieldLeftLabel('Bajo mi control');
    setNewFieldRightLabel('Fuera de mi control');
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;

    const parsedOptions = newFieldOptionsText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newField: PromptField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: newFieldType,
      label: newFieldLabel.trim(),
      placeholder:
        newFieldPlaceholder.trim() ||
        (newFieldType === 'bullets'
          ? 'Escribe un punto por línea...'
          : newFieldType === 'textarea'
          ? 'Escribe tu reflexión extendida...'
          : newFieldType === 'text'
          ? 'Escribe aquí tu respuesta...'
          : undefined),
      options: newFieldType === 'checkboxes' ? (parsedOptions.length > 0 ? parsedOptions : ['Paso 1', 'Paso 2']) : undefined,
      leftLabel: newFieldType === 'pair' ? newFieldLeftLabel.trim() || 'Bajo mi control' : undefined,
      rightLabel: newFieldType === 'pair' ? newFieldRightLabel.trim() || 'Fuera de mi control' : undefined,
    };

    setFields([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldPlaceholder('');
  };

  const handleUpdateExistingField = (id: string, patch: Partial<PromptField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const saved: SuperMorningHabit = {
      id: habit?.id || `sm_custom_${Date.now()}`,
      order: habit?.order || 99,
      key: habit?.key || `custom_${Date.now()}`,
      title: title.trim(),
      subtitle: habit?.subtitle || `${defaultMinutes} min · ${category}`,
      icon: selectedIcon,
      category: category,
      defaultMinutes: Math.max(1, Number(defaultMinutes) || 2),
      expressMinutes: Math.max(1, Math.round(Number(defaultMinutes) / 2)),
      deepMinutes: Math.max(2, Number(defaultMinutes) * 2),
      enabled: habit?.enabled ?? true,
      description: description.trim(),
      instructions: practicalTip.trim() ? [practicalTip.trim()] : (habit?.instructions || []),
      stoicQuote: habit?.stoicQuote,
      fields: enableFields ? fields : [],
      enableAiDailyMessage,
      aiMessageTopic: enableAiDailyMessage ? aiMessageTopic : undefined,
      linkToFitness,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-[#0c131a]/95 border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isPurple ? 'border-slate-200/80 dark:border-purple-500/30' : 'border-slate-200/80 dark:border-amber-500/30'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b bg-slate-50/80 dark:bg-black/40 ${
          isPurple ? 'border-slate-200/80 dark:border-purple-500/20' : 'border-slate-200/80 dark:border-amber-500/20'
        }`}>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? 'Editar Hábito y Campos Interactivos' : 'Crear Nuevo Hábito y Campos Interactivos'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
          {/* Nombre de la Actividad */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Primera Decisión al Abrir los Ojos"
              className={`w-full bg-slate-100/80 dark:bg-slate-950/80 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-colors ${
                isPurple ? 'border-slate-300 dark:border-purple-500/30 focus:border-purple-500' : 'border-slate-300 dark:border-amber-500/30 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Duración Base y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Duración Base (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={defaultMinutes}
                onChange={(e) => setDefaultMinutes(Number(e.target.value))}
                className={`w-full bg-slate-100/80 dark:bg-slate-950/80 border rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 font-sans focus:outline-none ${
                  isPurple ? 'border-slate-300 dark:border-purple-500/30 focus:border-purple-500' : 'border-slate-300 dark:border-amber-500/30 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className={`w-full bg-slate-100/80 dark:bg-slate-950/80 border rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none ${
                  isPurple ? 'border-slate-300 dark:border-purple-500/30 focus:border-purple-500' : 'border-slate-300 dark:border-amber-500/30 focus:border-amber-500'
                }`}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breve descripción y Consejo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Breve descripción
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Introspección, meditación o propósito de este hábito..."
                className={`w-full bg-slate-100/80 dark:bg-slate-950/80 border rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none resize-y ${
                  isPurple ? 'border-slate-300 dark:border-purple-500/20 focus:border-purple-500' : 'border-slate-300 dark:border-amber-500/20 focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Consejo práctico para la sesión guiada
              </label>
              <textarea
                rows={3}
                value={practicalTip}
                onChange={(e) => setPracticalTip(e.target.value)}
                placeholder="Consejo para ejecutar esta fase con serenidad y presencia..."
                className={`w-full bg-slate-100/80 dark:bg-slate-950/80 border rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none resize-y ${
                  isPurple ? 'border-slate-300 dark:border-purple-500/20 focus:border-purple-500' : 'border-slate-300 dark:border-amber-500/20 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Smart Automation Options (AI Daily Message & Fitness Integration) */}
          {!isPurple && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/20">
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAiDailyMessage}
                    onChange={(e) => setEnableAiDailyMessage(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Frase / Mensaje IA aleatorio cada día
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      La IA generará un mensaje diario distinto según la descripción o enfoque del hábito.
                    </span>
                  </div>
                </label>

                {enableAiDailyMessage && (
                  <select
                    value={aiMessageTopic}
                    onChange={(e) => setAiMessageTopic(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="motivacion">Motivación y Disciplina Diaria</option>
                    <option value="meditacion">Meditación, Silencio y Calma</option>
                    <option value="isra">Incomodidad Voluntaria (Isra García)</option>
                    <option value="general">Sabiduría y Enfoque General</option>
                  </select>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkToFitness}
                  onChange={(e) => setLinkToFitness(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Enlazar a Entrenador Físico
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Muestra acceso directo para registrar series o ir al módulo Mi Entrenador Físico.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Icono Representativo Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Icono Representativo
            </label>
            <div className={`grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-950/80 border ${
              isPurple ? 'border-slate-200 dark:border-purple-500/20' : 'border-slate-200 dark:border-amber-500/20'
            }`}>
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? isPurple
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md font-bold'
                          : 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                        : isPurple
                        ? 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-purple-500/40'
                        : 'bg-white/80 dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-amber-500/40'
                    }`}
                    title={item.name}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección Campos para llenar (AMPLIADA Y CONTEXTUAL) */}
          <div className={`pt-4 border-t space-y-4 ${
            isPurple ? 'border-slate-200 dark:border-purple-500/20' : 'border-slate-200 dark:border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className={`w-4 h-4 ${isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-amber-500'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Campos para llenar en esta actividad (Casillas, Listas o Textos)
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFields}
                  onChange={(e) => setEnableFields(e.target.checked)}
                  className={`rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-4 h-4 ${
                    isPurple ? 'text-purple-600 focus:ring-purple-400' : 'text-amber-500 focus:ring-amber-400'
                  }`}
                />
                <span>Habilitar campos</span>
              </label>
            </div>

            {enableFields && (
              <div className={`p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/80 border space-y-5 ${
                isPurple ? 'border-slate-200 dark:border-purple-500/25' : 'border-slate-200 dark:border-amber-500/25'
              }`}>
                {/* Campos configurados list (editable inline!) */}
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2.5">
                    Campos configurados ({fields.length}):
                  </span>
                  {fields.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic block">
                      No hay campos agregados todavía. Crea uno abajo eligiendo el tipo de campo.
                    </span>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((f, idx) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className={`text-xs font-bold ${
                                isPurple ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={f.label}
                                onChange={(e) => handleUpdateExistingField(f.id, { label: e.target.value })}
                                className="flex-1 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                              />
                              <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                {f.type}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteField(f.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 cursor-pointer"
                              title="Eliminar campo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {f.type === 'checkboxes' && (
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                                Casillas / Opciones (separadas por coma o salto de línea):
                              </label>
                              <textarea
                                rows={2}
                                value={(f.options || []).join(', ')}
                                onChange={(e) =>
                                  handleUpdateExistingField(f.id, {
                                    options: e.target.value
                                      .split(/\n|,/)
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                placeholder="Ej: Flexiones x20, Sentadillas x30, Estiramiento 3 min"
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                              />
                            </div>
                          )}

                          {(f.type === 'text' || f.type === 'textarea' || f.type === 'bullets') && (
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                                Guía o placeholder de ayuda:
                              </label>
                              <input
                                type="text"
                                value={f.placeholder || ''}
                                onChange={(e) => handleUpdateExistingField(f.id, { placeholder: e.target.value })}
                                placeholder="Texto de ejemplo dentro del recuadro..."
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Añadir nueva pregunta o campo - Spacious Contextual Builder */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 uppercase font-bold block">
                    Añadir nueva casilla, lista o campo de texto:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Título o pregunta del campo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Serie de ejercicios o Reflexión de la fase"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none ${
                          isPurple ? 'focus:border-purple-500' : 'focus:border-amber-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Tipo de campo
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as PromptFieldType)}
                        className={`w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none ${
                          isPurple ? 'focus:border-purple-500' : 'focus:border-amber-500'
                        }`}
                      >
                        <option value="text">Texto corto</option>
                        <option value="textarea">Texto largo (hasta 1000 palabras)</option>
                        <option value="bullets">Lista de viñetas</option>
                        <option value="checkboxes">Casillas de verificación (Checklist)</option>
                        <option value="pair">Par Estoico (Control / No control)</option>
                      </select>
                    </div>
                  </div>

                  {/* Contextual options based on chosen newFieldType */}
                  {newFieldType === 'checkboxes' && (
                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Casillas a incluir (escríbelas separadas por coma o una por línea):
                      </label>
                      <textarea
                        rows={3}
                        value={newFieldOptionsText}
                        onChange={(e) => setNewFieldOptionsText(e.target.value)}
                        placeholder="Ej: Serie 1 · 15 Flexiones, Serie 2 · 20 Sentadillas, Plancha 60 seg"
                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  )}

                  {(newFieldType === 'text' || newFieldType === 'textarea' || newFieldType === 'bullets') && (
                    <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Texto guía o placeholder (opcional):
                      </label>
                      <input
                        type="text"
                        value={newFieldPlaceholder}
                        onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                        placeholder={
                          newFieldType === 'bullets'
                            ? 'Ej: Escribe 3 acciones concretas, una por línea...'
                            : 'Ej: Escribe aquí con total libertad...'
                        }
                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  )}

                  {newFieldType === 'pair' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Columna Izquierda</label>
                        <input
                          type="text"
                          value={newFieldLeftLabel}
                          onChange={(e) => setNewFieldLeftLabel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">Columna Derecha</label>
                        <input
                          type="text"
                          value={newFieldRightLabel}
                          onChange={(e) => setNewFieldRightLabel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddField}
                      className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                        isPurple ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir Campo a la Actividad</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
            isPurple ? 'border-slate-200 dark:border-purple-500/20' : 'border-slate-200 dark:border-amber-500/20'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/25'
              }`}
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
