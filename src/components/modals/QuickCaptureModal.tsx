import React, { useState, useEffect } from 'react';
import { AppStoreData } from '../../services/storage';
import { CapturedBrainItem, BusinessTask, PillarKey } from '../../types';
import { Sparkles, X, Plus, Brain, CheckSquare, Lightbulb, Quote } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  data,
  onUpdateData,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [captureType, setCaptureType] = useState<'task' | 'idea' | 'note' | 'quote' | 'reflection'>('task');
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | ''>('intelectual');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(data.businesses[0]?.id || '');
  const [isTask, setIsTask] = useState(true);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (captureType === 'task') {
      const newTask: BusinessTask = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        scope: selectedBusinessId ? 'business' : 'personal',
        businessId: selectedBusinessId || undefined,
        pillar: selectedPillar ? (selectedPillar as PillarKey) : undefined,
        priority: 'important',
        status: 'todo',
        isDelegated: false,
        dueDate: new Date().toISOString().split('T')[0],
        tags: ['Captura Rápida'],
      };
      onUpdateData((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
    } else {
      const newItem: CapturedBrainItem = {
        id: `brain_${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        type: captureType,
        pillar: selectedPillar ? (selectedPillar as PillarKey) : undefined,
        businessId: selectedBusinessId || undefined,
        tags: ['Captura Rápida', captureType],
        createdAt: new Date().toISOString(),
        processed: false,
      };
      onUpdateData((prev) => ({
        ...prev,
        capturedItems: [newItem, ...prev.capturedItems],
      }));
    }

    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl bg-[#0c1812] border border-emerald-500/30 p-6 shadow-2xl shadow-emerald-950/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">Captura Rápida Universal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#08100c] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setCaptureType('task')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                captureType === 'task' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tarea
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('idea')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                captureType === 'idea' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Idea
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('quote')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                captureType === 'quote' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              Cita
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('note')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                captureType === 'note' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Nota
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Título / Concepto</label>
            <input
              type="text"
              placeholder={captureType === 'task' ? '¿Qué debes ejecutar?...' : 'Concepto o pensamiento...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
              className="w-full bg-[#08100c] border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {captureType !== 'task' && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Detalle o Explicación</label>
              <textarea
                rows={3}
                placeholder="Escribe el desarrollo de la idea o nota..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Vincular a Dimensión</label>
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value as any)}
                className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="">Ninguna</option>
                <option value="intelectual">Intelectual</option>
                <option value="financiero">Financiero</option>
                <option value="fisico">Físico</option>
                <option value="espiritual">Espiritual</option>
                <option value="emocional">Emocional</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Vincular a Empresa</label>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="">Personal (Sin empresa)</option>
                {data.businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Atajo: Esc para salir</span>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-md shadow-emerald-950 transition-colors cursor-pointer"
            >
              Guardar Captura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
