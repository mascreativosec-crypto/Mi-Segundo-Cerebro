import React from 'react';
import { NightPrepCheckItem } from '../../types/super-morning';
import {
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NightPrepViewProps {
  items: NightPrepCheckItem[];
  onUpdateItems: (items: NightPrepCheckItem[]) => void;
  onNavigateToSuperNight?: () => void;
}

export const NightPrepView: React.FC<NightPrepViewProps> = ({
  items,
  onUpdateItems,
  onNavigateToSuperNight,
}) => {
  const [newLabel, setNewLabel] = React.useState('');
  const [newHint, setNewHint] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);

  const toggleItem = (id: string) => {
    onUpdateItems(
      items.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newItem: NightPrepCheckItem = {
      id: `np_custom_${Date.now()}`,
      label: newLabel.trim(),
      hint: newHint.trim() || 'Hábito de preparación nocturna',
      completed: false,
    };
    onUpdateItems([...items, newItem]);
    setNewLabel('');
    setNewHint('');
    setShowAdd(false);
  };

  const deleteItem = (id: string) => {
    onUpdateItems(items.filter((it) => it.id !== id));
  };

  const completedCount = items.filter((it) => it.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-500/30 shadow-lg dark:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
            <Moon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Preparación Nocturna (El Éxito de Mañana Empieza Hoy)
              </h2>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                Pre-Rutina
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              La Súper Mañana no inicia a las 5:00 AM; inicia la noche anterior al eliminar fricciones y decidir con antelación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Preparación Lista</span>
            <span className="text-base font-bold text-purple-700 dark:text-purple-300">
              {completedCount}/{items.length} · {progressPercent}%
            </span>
          </div>

          {onNavigateToSuperNight && (
            <button
              onClick={onNavigateToSuperNight}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Ir a Súper Noche</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Checklist items */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-500/20 shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Protocolos de Reducción de Fricción
            </h3>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Protocolo</span>
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddItem} className="p-4 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-300 dark:border-purple-500/20 space-y-3">
            <input
              type="text"
              placeholder="Nombre del protocolo (ej: Libro en mesa de noche con lápiz)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="Razón o consejo (ej: Evitar buscar el libro por la mañana)"
              value={newHint}
              onChange={(e) => setNewHint(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.completed
                  ? 'bg-purple-500/10 dark:bg-purple-950/20 border-purple-500/30 text-slate-500 dark:text-slate-400'
                  : 'bg-white/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-purple-500/30 shadow-xs'
              }`}
            >
              <div
                onClick={() => toggleItem(item.id)}
                className="flex items-start gap-3 flex-1 cursor-pointer"
              >
                <button className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 hover:text-purple-500 shrink-0 transition-colors" />
                  )}
                </button>

                <div>
                  <span className={`text-xs ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.hint && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.hint}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                title="Eliminar protocolo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
