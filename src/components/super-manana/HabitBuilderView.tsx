import React, { useState } from 'react';
import { SuperMorningHabit, SUPER_MANANA_HABITS } from '../../types/super-morning';
import { IconRenderer } from './IconRenderer';
import { HabitEditModal } from './HabitEditModal';
import {
  Sliders,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Tag,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface HabitBuilderViewProps {
  habits: SuperMorningHabit[];
  onUpdateHabits: (habits: SuperMorningHabit[]) => void;
  onResetDefaults: () => void;
}

export const HabitBuilderView: React.FC<HabitBuilderViewProps> = ({
  habits,
  onUpdateHabits,
  onResetDefaults,
}) => {
  const [editingHabit, setEditingHabit] = useState<SuperMorningHabit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const totalBaseMinutes = habits
    .filter((h) => h.enabled)
    .reduce((sum, h) => sum + (h.defaultMinutes || 2), 0);

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= habits.length) return;

    const list = [...habits];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    onUpdateHabits(list.map((h, i) => ({ ...h, order: i + 1 })));
  };

  const toggleHabitActive = (habitId: string) => {
    onUpdateHabits(
      habits.map((h) => (h.id === habitId ? { ...h, enabled: !h.enabled } : h))
    );
  };

  const deleteHabit = (habitId: string) => {
    onUpdateHabits(
      habits.filter((h) => h.id !== habitId).map((h, i) => ({ ...h, order: i + 1 }))
    );
  };

  const handleOpenAddModal = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit: SuperMorningHabit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleSaveHabit = (saved: SuperMorningHabit) => {
    if (editingHabit) {
      onUpdateHabits(habits.map((h) => (h.id === saved.id ? saved : h)));
    } else {
      onUpdateHabits([...habits, { ...saved, order: habits.length + 1 }]);
    }
  };

  const applyTemplate = (templateName: string) => {
    if (templateName === 'full') {
      onResetDefaults();
    } else if (templateName === 'minimal') {
      // 5 essential habits
      const minimalKeys = ['despertar', 'hidratacion', 'vipassana', 'tarea_domino', 'identidad'];
      const updated = habits.map((h) => ({
        ...h,
        enabled: minimalKeys.includes(h.key),
      }));
      onUpdateHabits(updated);
    } else if (templateName === 'biohacker') {
      // Ice Man, Ducha fría, Movilidad, Hidratación, Despertar
      const bioKeys = ['despertar', 'hidratacion', 'movilidad', 'iceman', 'ducha_fria', 'priming', 'tarea_domino'];
      const updated = habits.map((h) => ({
        ...h,
        enabled: bioKeys.includes(h.key),
      }));
      onUpdateHabits(updated);
    }
    setShowTemplates(false);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mind':
        return 'Mentalidad y Diálogo';
      case 'spirit':
        return 'Silencio y Calma';
      case 'body':
        return 'Físico y Vitalidad';
      case 'focus':
        return 'Enfoque & Intelecto';
      default:
        return 'Hábito';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card matching image_0a4bce81.png */}
      <div className="p-6 md:p-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-amber-500/25 shadow-lg dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Constructor Libre de Hábitos y Campos</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personaliza tus Hábitos y Registros
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-xl">
            Crea, reordena y selecciona qué actividades requieren campos para llenar. Base:{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">{totalBaseMinutes} min</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Plantillas Button */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Plantillas</span>
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-500/30 shadow-2xl p-2 z-30 space-y-1">
                <button
                  onClick={() => applyTemplate('full')}
                  className="w-full text-left p-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  <strong className="block text-slate-900 dark:text-white">Guía Maestra (13 Fases)</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">La experiencia completa</span>
                </button>
                <button
                  onClick={() => applyTemplate('minimal')}
                  className="w-full text-left p-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  <strong className="block text-slate-900 dark:text-white">Ninja Esencial (5 Fases)</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Hidratación, Vipassana, Dominó</span>
                </button>
                <button
                  onClick={() => applyTemplate('biohacker')}
                  className="w-full text-left p-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                >
                  <strong className="block text-slate-900 dark:text-white">Biohacker Térmico (7 Fases)</strong>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Wim Hof, Ducha Fría, Físico</span>
                </button>
              </div>
            )}
          </div>

          {/* Añadir Hábito Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Añadir Hábito</span>
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-amber-500/20 shadow-lg dark:shadow-2xl space-y-4">
        {/* Header of the sequence */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/15">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            SECUENCIA ({habits.length} ACTIVIDADES)
          </span>

          <button
            onClick={onResetDefaults}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Guía Original</span>
          </button>
        </div>

        {/* Habit items matching image_0a4bce81.png */}
        <div className="space-y-3">
          {habits.map((habit, index) => {
            const fieldCount = habit.fields?.length || 0;

            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  habit.enabled
                    ? 'bg-white/80 dark:bg-slate-950/60 border-amber-500/20 text-slate-800 dark:text-slate-200 hover:border-amber-500/40 shadow-xs'
                    : 'bg-slate-100/60 dark:bg-black/40 border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-500 opacity-60'
                }`}
              >
                {/* Left zone: Reorder arrows + Icon + Details */}
                <div className="flex items-center gap-3.5 flex-1">
                  {/* Reorder Arrows */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveHabit(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                      title="Subir posición"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHabit(index, 'down')}
                      disabled={index === habits.length - 1}
                      className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                      title="Bajar posición"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon with warm round background */}
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                    <IconRenderer name={habit.icon} className="w-5 h-5" />
                  </div>

                  {/* Information block */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        #{index + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {habit.title}
                      </h3>

                      {/* Category Badge */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800">
                        {getCategoryLabel(habit.category)}
                      </span>

                      {/* Fields Count Badge */}
                      {fieldCount > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {habit.instructions?.[0] || habit.description}
                    </p>
                  </div>
                </div>

                {/* Right zone: Duration + Status button + Edit + Delete */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                  {/* Duration label */}
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-300/60 dark:border-slate-800">
                    {habit.defaultMinutes} min
                  </span>

                  {/* Active / Inactive Button */}
                  <button
                    type="button"
                    onClick={() => toggleHabitActive(habit.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      habit.enabled
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-200/60 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {habit.enabled ? 'Activo' : 'Inactivo'}
                  </button>

                  {/* Edit Pencil Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(habit)}
                    className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:border-amber-500/40 transition-colors cursor-pointer"
                    title="Editar actividad y campos"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete Trash Button */}
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-800 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                    title="Eliminar actividad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit / Create Modal */}
      <HabitEditModal
        habit={editingHabit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
      />
    </div>
  );
};
