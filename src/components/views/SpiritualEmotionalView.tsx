import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { MoodEntry, SpiritualJournalEntry } from '../../types';
import {
  HeartHandshake,
  Compass,
  Smile,
  Heart,
  Plus,
  Users,
  Brain,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface SpiritualEmotionalViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const SpiritualEmotionalView: React.FC<SpiritualEmotionalViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [activeTab, setActiveTab] = useState<'espiritual' | 'emocional'>('espiritual');

  // New spiritual entry
  const [newPurposeReflection, setNewPurposeReflection] = useState('');
  const [newGratitudeItem, setNewGratitudeItem] = useState('');

  // New mood entry
  const [newMoodScore, setNewMoodScore] = useState<number>(5);
  const [newEmotion, setNewEmotion] = useState<MoodEntry['primaryEmotion']>('Determinación');
  const [newTrigger, setNewTrigger] = useState('');
  const [newThoughtManagement, setNewThoughtManagement] = useState('');

  const handleAddSpiritualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeReflection.trim()) return;

    const newEntry: SpiritualJournalEntry = {
      id: `se_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      purposeReflection: newPurposeReflection.trim(),
      faithMoments: 'Alineación consciente con el propósito de vida.',
      gratitudeList: newGratitudeItem ? [newGratitudeItem.trim()] : ['Por un nuevo día de vida y claridad'],
    };

    onUpdateData((prev) => ({
      ...prev,
      spiritualEntries: [newEntry, ...prev.spiritualEntries],
    }));

    setNewPurposeReflection('');
    setNewGratitudeItem('');
  };

  const handleAddMoodEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const newEntry: MoodEntry = {
      id: `me_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      score: newMoodScore,
      moodLabel: newEmotion,
      primaryEmotion: newEmotion,
      triggers: newTrigger.trim() || 'Jornada ejecutiva habitual',
      reflection: 'Observación consciente de las emociones sin juzgarlas.',
      thoughtManagement: newThoughtManagement.trim() || 'Centrado en la respiración y prioridades.',
    };

    onUpdateData((prev) => ({
      ...prev,
      moodEntries: [newEntry, ...prev.moodEntries],
    }));

    setNewTrigger('');
    setNewThoughtManagement('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Dimensión Espiritual & Emocional</h1>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  INTELIGENCIA INTERIOR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Propósito, valores innegociables, gratitud profunda, autoconocimiento y serenidad mental.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#08100c] border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('espiritual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'espiritual'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Espiritual (Propósito)
            </button>
            <button
              onClick={() => setActiveTab('emocional')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'emocional'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Emocional (Autodominio)
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Espiritual */}
      {activeTab === 'espiritual' ? (
        <div className="space-y-6">
          {/* Declaration of Purpose Card */}
          <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/20 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Propósito Rector de Vida
              </h2>
            </div>
            <p className="text-base text-slate-100 italic leading-relaxed">
              "Construir organizaciones prósperas, conscientes y humanas que eleven la calidad de vida de las personas que colaboran en ellas, manteniendo un equilibrio innegociable con mi salud, mi familia y mi verdad espiritual."
            </p>
          </div>

          {/* New Reflection Form */}
          <form onSubmit={handleAddSpiritualNote} className="p-5 rounded-2xl bg-[#0c1812] border border-emerald-500/15 space-y-3">
            <h3 className="text-sm font-bold text-white">Diario de Reflexión & Gratitud Espiritual</h3>
            <textarea
              rows={3}
              placeholder="Reflexión de hoy sobre propósito, valores o momentos de conexión..."
              value={newPurposeReflection}
              onChange={(e) => setNewPurposeReflection(e.target.value)}
              required
              className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Motivo de gratitud principal..."
                value={newGratitudeItem}
                onChange={(e) => setNewGratitudeItem(e.target.value)}
                className="w-full sm:flex-1 bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
              >
                Guardar Reflexión
              </button>
            </div>
          </form>

          {/* Spiritual Entries List */}
          <div className="space-y-3">
            {data.spiritualEntries.map((entry) => (
              <div key={entry.id} className="p-4 rounded-xl bg-[#0c1812] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{entry.date}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{entry.purposeReflection}</p>
                {entry.gratitudeList.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                    {entry.gratitudeList.map((g, idx) => (
                      <span key={idx} className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                        ❤️ {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab: Emocional */
        <div className="space-y-6">
          {/* Emotion Check-in Card */}
          <form onSubmit={handleAddMoodEntry} className="p-5 rounded-2xl bg-[#0c1812] border border-emerald-500/15 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" />
                Registro & Gestión Emocional
              </h3>
              <span className="text-xs font-mono text-emerald-400">Autoconocimiento</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Emoción Primaria</label>
                <select
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value as any)}
                  className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="Calma">Calma & Aplomo</option>
                  <option value="Determinación">Determinación Inquebrantable</option>
                  <option value="Gratitud">Gratitud Plena</option>
                  <option value="Entusiasmo">Entusiasmo Creativo</option>
                  <option value="Ansiedad">Ansiedad / Tensión</option>
                  <option value="Fatiga">Fatiga Acumulada</option>
                  <option value="Frustración">Frustración</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Disparador o Causa Observada</label>
                <input
                  type="text"
                  placeholder="¿Qué originó este estado?..."
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-[#08100c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Gestión de Pensamientos (Sustitución Consciente)</label>
              <textarea
                rows={2}
                placeholder="¿Qué pensamiento limitante detectaste y por qué verdad pragmática lo sustituyes?..."
                value={newThoughtManagement}
                onChange={(e) => setNewThoughtManagement(e.target.value)}
                className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
              >
                Registrar Estado Emocional
              </button>
            </div>
          </form>

          {/* Mood History */}
          <div className="space-y-3">
            {data.moodEntries.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-[#0c1812] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {m.primaryEmotion}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{m.date}</span>
                </div>
                <p className="text-xs text-slate-300"><span className="text-slate-500">Disparador:</span> {m.triggers}</p>
                <p className="text-xs text-emerald-300"><span className="text-slate-500">Gestión cognitiva:</span> {m.thoughtManagement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
