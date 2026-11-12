import React, { useState } from 'react';
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
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(habit);

  const [title, setTitle] = useState(habit?.title || '');
  const [defaultMinutes, setDefaultMinutes] = useState(habit?.defaultMinutes || 2);
  const [category, setCategory] = useState<HabitCategory>(habit?.category || 'mind');
  const [description, setDescription] = useState(habit?.description || '');
  const [practicalTip, setPracticalTip] = useState(habit?.instructions?.[0] || '');
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon || 'Sun');

  // Fields management
  const [enableFields, setEnableFields] = useState<boolean>(
    Boolean(habit?.fields && habit.fields.length > 0)
  );
  const [fields, setFields] = useState<PromptField[]>(habit?.fields ? [...habit.fields] : []);

  // New field input
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<PromptFieldType>('text');

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newField: PromptField = {
      id: `fld_${Date.now()}`,
      type: newFieldType,
      label: newFieldLabel.trim(),
      placeholder: newFieldType === 'text' ? 'Escribe aquí tu respuesta...' : undefined,
    };

    setFields([...fields, newField]);
    setNewFieldLabel('');
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
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-[#0c131a]/95 border border-slate-200/80 dark:border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-amber-500/20 bg-slate-50/80 dark:bg-black/40">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? 'Editar Hábito y Campos' : 'Crear Nuevo Hábito y Campos'}
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
              className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
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
                className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Breve descripción */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Breve descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hacer lo que NO nos gusta: nuestro cerebro buscará sabotear el progreso."
              className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-amber-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Consejo práctico */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Consejo práctico para la sesión guiada
            </label>
            <textarea
              rows={2}
              value={practicalTip}
              onChange={(e) => setPracticalTip(e.target.value)}
              placeholder="Antes de negociar con la pereza o mirar el teléfono, toma la decisión consciente de dominar tu día."
              className="w-full bg-slate-100/80 dark:bg-slate-950/80 border border-slate-300 dark:border-amber-500/20 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Icono Representativo Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Icono Representativo
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-950/80 border border-slate-200 dark:border-amber-500/20">
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
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
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

          {/* Sección Campos para llenar */}
          <div className="pt-3 border-t border-slate-200 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Campos para llenar en esta actividad</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFields}
                  onChange={(e) => setEnableFields(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span>Habilitar campos</span>
              </label>
            </div>

            {enableFields && (
              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/80 border border-slate-200 dark:border-amber-500/25 space-y-4">
                {/* Campos configurados list */}
                <div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block mb-2">
                    CAMPOS CONFIGURADOS ({fields.length}):
                  </span>
                  {fields.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic block">
                      No hay campos agregados todavía.
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((f, idx) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                              #{idx + 1}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200">{f.label}</span>
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {f.type}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(f.id)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Eliminar campo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Añadir nueva pregunta o campo */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">
                    AÑADIR NUEVA PREGUNTA O CAMPO DE REGISTRO:
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ej: ¿Cuál es tu decisión transcendental hoy?"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as PromptFieldType)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
                    >
                      <option value="text">Texto corto</option>
                      <option value="textarea">Texto largo / Reflexión</option>
                      <option value="bullets">Lista de viñetas</option>
                      <option value="pair">Par Estoico (Control / No control)</option>
                      <option value="checkboxes">Casillas de verificación</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer w-full sm:w-auto justify-center shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-amber-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
