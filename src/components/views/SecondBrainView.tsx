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
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Segundo Cerebro</h1>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  MEMORIA EXTERNA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Almacena ideas, notas, modelos mentales y aprendizajes vinculados a tus 5 dimensiones y negocios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Nota / Idea
            </button>
          </div>
        </div>
      </div>

      {/* Global Search and Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1812] border border-emerald-500/15 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por palabra clave, contenido o etiqueta (#IA, #Ventas)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#08100c] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#08100c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
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
            className="bg-[#08100c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
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
        <form onSubmit={handleCreateItem} className="p-5 rounded-2xl bg-[#0c1812] border border-emerald-500/25 space-y-3">
          <h3 className="text-sm font-bold text-white">Capturar en Segundo Cerebro</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Título / Concepto clave"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
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
              className="bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
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
            className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Etiquetas separadas por coma (ej: IA, Ventas, Liderazgo)"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full sm:flex-1 bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
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
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              item.processed
                ? 'bg-[#08100c]/60 border-slate-900 text-slate-400'
                : 'bg-[#0c1812] border-slate-800/90 text-slate-200 hover:border-emerald-500/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-[10px] uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[10px] text-slate-400 font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => toggleProcessed(item.id)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-400 cursor-pointer"
              >
                {item.processed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Procesado</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-slate-600" />
                    <span>Marcar Procesado</span>
                  </>
                )}
              </button>

              <button
                onClick={() => deleteItem(item.id)}
                className="text-slate-600 hover:text-red-400 p-1 cursor-pointer"
                title="Eliminar elemento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
