import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BusinessTask, CapturedBrainItem, PillarKey } from '../../types';
import { Sparkles, X, CheckSquare, Lightbulb, Quote, Brain } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  data: AppStoreData;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onUpdateData,
  data,
}) => {
  const [captureType, setCaptureType] = useState<'task' | 'idea' | 'quote' | 'note'>('task');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | ''>('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

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
        priority: 'urgent_important',
        status: 'todo',
        isDelegated: false,
        dueDate: new Date().toISOString().split('T')[0],
        estimatedMinutes: 30,
        tags: ['Captura Rápida', 'Acción Inmediata'],
      };
      onUpdateData((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
    } else {
      const newItem: CapturedBrainItem = {
        id: `item_${Date.now()}`,
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
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full lg:max-w-lg rounded-t-3xl lg:rounded-3xl bg-white dark:bg-slate-900 border-t lg:border border-slate-200 dark:border-white/[0.1] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 lg:zoom-in-95 duration-200">
        <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 lg:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Captura Rápida Universal</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Descarga inmediata a tu Segundo Cerebro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] rounded-2xl">
            <button
              type="button"
              onClick={() => setCaptureType('task')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureType === 'task'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tarea
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('idea')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureType === 'idea'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Idea
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('quote')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureType === 'quote'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              Cita
            </button>
            <button
              type="button"
              onClick={() => setCaptureType('note')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                captureType === 'note'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Nota
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Título / Concepto</label>
            <input
              type="text"
              placeholder={captureType === 'task' ? '¿Qué debes ejecutar?...' : 'Concepto o pensamiento...'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
              className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>

          {captureType !== 'task' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Detalle o Explicación</label>
              <textarea
                rows={3}
                placeholder="Escribe el desarrollo de la idea o nota..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Dimensión de Vida</label>
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value as any)}
                className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="" className="bg-white dark:bg-slate-900">Ninguna</option>
                <option value="intelectual" className="bg-white dark:bg-slate-900">Intelectual</option>
                <option value="financiero" className="bg-white dark:bg-slate-900">Financiero</option>
                <option value="fisico" className="bg-white dark:bg-slate-900">Físico</option>
                <option value="espiritual" className="bg-white dark:bg-slate-900">Espiritual</option>
                <option value="emocional" className="bg-white dark:bg-slate-900">Emocional</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vincular a Empresa</label>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="" className="bg-white dark:bg-slate-900">Personal (Sin empresa)</option>
                {data.businesses.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Atajo: Esc para salir</span>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              Guardar Captura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
