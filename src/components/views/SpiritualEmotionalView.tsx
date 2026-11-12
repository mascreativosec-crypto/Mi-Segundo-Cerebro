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
      {/* Header Banner - Apple Liquid Glass with Purple/Pink squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 shrink-0">
              <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dimensión Espiritual & Emocional
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Propósito rector, valores innegociables, gratitud profunda y autogobierno emocional.
              </p>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('espiritual')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'espiritual'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Espiritual (Propósito)
            </button>
            <button
              onClick={() => setActiveTab('emocional')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'emocional'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-500/10 via-white/85 to-pink-500/5 dark:from-purple-950/20 dark:via-slate-900/60 dark:to-pink-950/20 border border-purple-500/25 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                Propósito Rector de Vida
              </h2>
            </div>
            <p className="text-base sm:text-lg text-slate-800 dark:text-slate-100 font-medium italic leading-relaxed">
              "Construir organizaciones prósperas, conscientes y humanas que eleven la calidad de vida de las personas que colaboran en ellas, manteniendo un equilibrio innegociable con mi salud, mi familia y mi verdad espiritual."
            </p>
          </div>

          {/* New Reflection Form */}
          <form onSubmit={handleAddSpiritualNote} className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Diario de Reflexión & Gratitud Espiritual</h3>
            <textarea
              rows={3}
              placeholder="Reflexión de hoy sobre propósito, valores o momentos de conexión..."
              value={newPurposeReflection}
              onChange={(e) => setNewPurposeReflection(e.target.value)}
              required
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Motivo de gratitud principal..."
                value={newGratitudeItem}
                onChange={(e) => setNewGratitudeItem(e.target.value)}
                className="w-full sm:flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Guardar Reflexión
              </button>
            </div>
          </form>

          {/* Spiritual Entries List */}
          <div className="space-y-3">
            {data.spiritualEntries.map((entry) => (
              <div key={entry.id} className="p-5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{entry.date}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{entry.purposeReflection}</p>
                {entry.gratitudeList.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-wrap gap-2">
                    {entry.gratitudeList.map((g, idx) => (
                      <span key={idx} className="text-[11px] font-medium text-pink-700 dark:text-pink-300 bg-pink-500/10 px-2.5 py-1 rounded-full">
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
          <form onSubmit={handleAddMoodEntry} className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smile className="w-5 h-5 text-purple-500" />
                Registro & Gestión Emocional
              </h3>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Autoconocimiento
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Emoción Primaria</label>
                <select
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value as any)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
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
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Disparador o Causa Observada</label>
                <input
                  type="text"
                  placeholder="¿Qué originó este estado?..."
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Gestión de Pensamientos (Sustitución Consciente)</label>
              <textarea
                rows={2}
                placeholder="¿Qué pensamiento limitante detectaste y por qué verdad pragmática lo sustituyes?..."
                value={newThoughtManagement}
                onChange={(e) => setNewThoughtManagement(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Registrar Estado Emocional
              </button>
            </div>
          </form>

          {/* Mood History */}
          <div className="space-y-3">
            {data.moodEntries.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    {m.primaryEmotion}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{m.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold text-slate-500">Disparador:</span> {m.triggers}</p>
                <p className="text-xs text-purple-700 dark:text-purple-300"><span className="font-semibold text-slate-500">Gestión cognitiva:</span> {m.thoughtManagement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
