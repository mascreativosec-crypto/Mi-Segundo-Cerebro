import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { CapturedBrainItem, PillarKey } from '../../types';
import {
  Brain,
  Search,
  Plus,
  Tag,
  Folder,
  CheckCircle2,
  Circle,
  Lightbulb,
  FileText,
  Quote,
  Sparkles,
  Trash2
} from 'lucide-react';

interface SecondBrainViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture: () => void;
}

export const SecondBrainView: React.FC<SecondBrainViewProps> = ({
  data,
  onUpdateData,
  onOpenQuickCapture,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');

  // New captured item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<CapturedBrainItem['type']>('idea');
  const [newPillar, setNewPillar] = useState<PillarKey | ''>('intelectual');
  const [newTags, setNewTags] = useState('Estrategia, Crecimiento');

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

  const filteredItems = data.capturedItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesPillar = selectedPillar === 'all' || item.pillar === selectedPillar;

    return matchesSearch && matchesType && matchesPillar;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with Violet/Fuchsia squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/25 shrink-0">
              <Brain className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Segundo Cerebro
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Almacena ideas, notas, modelos mentales y aprendizajes vinculados a tus 5 dimensiones y negocios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-violet-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nueva Nota / Idea</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Search and Filter Bar */}
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
          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value="all">Todos los Tipos</option>
            <option value="idea">💡 Ideas</option>
            <option value="note">📝 Notas</option>
            <option value="quote">💬 Citas</option>
            <option value="task">☑️ Tareas</option>
            <option value="document">📄 Documentos</option>
          </select>

          {/* Pillar filter */}
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
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateItem} className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-violet-500/30 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Capturar en Segundo Cerebro</h3>
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

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
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
                <span className="text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                  {item.type}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">{item.content}</p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-black/30 px-2 py-0.5 rounded-md">
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
  );
};
