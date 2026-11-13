import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { MoodEntry } from '../../types';
import { submitEmotionLog } from '../../services/emotionService';
import {
  HeartHandshake,
  Smile,
  ArrowLeft,
  CheckCircle2,
  Moon,
} from 'lucide-react';

interface EmotionalViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate?: (viewId: string) => void;
}

const EMOTION_TAGS_POOL = [
  'Sereno',
  'Determinado',
  'Entusiasmado',
  'Agradecido',
  'Enfocado',
  'Inspirado',
  'Cansado',
  'Ansioso',
  'Tenso',
  'Frustrado',
  'Reflexivo',
  'En Paz',
];

const ASSOCIATION_TAGS_POOL = [
  'Trabajo',
  'Familia',
  'Salud',
  'Finanzas',
  'Fe / Espiritualidad',
  'Pareja',
  'Descanso',
  'Entrenamiento',
];

const getDisplayLabelFromValence = (valence: number): string => {
  if (valence >= 0.6) return 'Muy agradable';
  if (valence >= 0.2) return 'Agradable';
  if (valence > -0.2) return 'Neutro / Equilibrado';
  if (valence > -0.6) return 'Desagradable';
  return 'Muy desagradable';
};

export const EmotionalView: React.FC<EmotionalViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const [valenceScore, setValenceScore] = useState<number>(0.65);
  const [selectedEmotionLabels, setSelectedEmotionLabels] = useState<string[]>(['Sereno', 'Determinado']);
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>(['Trabajo', 'Salud']);
  const [newEmotion, setNewEmotion] = useState<MoodEntry['primaryEmotion']>('Determinación');
  const [newTrigger, setNewTrigger] = useState('');
  const [newThoughtManagement, setNewThoughtManagement] = useState('');
  const [emotionSaving, setEmotionSaving] = useState(false);
  const [emotionSuccessMsg, setEmotionSuccessMsg] = useState<string | null>(null);

  const toggleEmotionLabel = (lbl: string) => {
    setSelectedEmotionLabels((prev) =>
      prev.includes(lbl) ? prev.filter((x) => x !== lbl) : [...prev, lbl]
    );
  };

  const toggleAssociation = (assoc: string) => {
    setSelectedAssociations((prev) =>
      prev.includes(assoc) ? prev.filter((x) => x !== assoc) : [...prev, assoc]
    );
  };

  const handleAddMoodEntry = async (e: React.FormEvent, returnTarget?: string) => {
    e.preventDefault();
    setEmotionSaving(true);
    const displayLabel = getDisplayLabelFromValence(valenceScore);
    const timestamp = new Date().toISOString();
    const mappedScore1to5 = Math.max(1, Math.min(5, Math.round(((valenceScore + 1) / 2) * 4 + 1)));

    const labelsToSave =
      selectedEmotionLabels.length > 0 ? selectedEmotionLabels : [newEmotion];
    const associationsToSave =
      selectedAssociations.length > 0 ? selectedAssociations : ['General'];

    await submitEmotionLog({
      timestamp,
      valence_score: valenceScore,
      display_label: displayLabel,
      emotion_labels: labelsToSave,
      associations: associationsToSave,
    });

    const newEntry: MoodEntry = {
      id: `me_${Date.now()}`,
      date: timestamp.split('T')[0],
      timestamp,
      score: mappedScore1to5,
      valence_score: valenceScore,
      display_label: displayLabel,
      emotion_labels: labelsToSave,
      associations: associationsToSave,
      moodLabel: `${displayLabel} · ${labelsToSave.join(', ')}`,
      primaryEmotion: newEmotion,
      triggers: newTrigger.trim() || `Asociado a: ${associationsToSave.join(', ')}`,
      reflection: 'Observación consciente de las emociones sin juzgarlas.',
      thoughtManagement: newThoughtManagement.trim() || 'Centrado en la respiración y prioridades.',
    };

    onUpdateData((prev) => ({
      ...prev,
      moodEntries: [newEntry, ...prev.moodEntries],
    }));

    setNewTrigger('');
    setNewThoughtManagement('');
    setEmotionSaving(false);
    setEmotionSuccessMsg(`Estado emocional guardado (${displayLabel}) y sincronizado con Súper Noche.`);
    setTimeout(() => setEmotionSuccessMsg(null), 4000);

    if (returnTarget && onNavigate) {
      onNavigate(returnTarget);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-pink-500/25 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 shrink-0">
              <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dimensión Emocional
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Check-in de valencia afectiva, mapa de disparadores, gestión cognitiva y sincronización con Súper Noche.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('super_night')}
                  className="px-3.5 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Ir a Súper Noche</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('spiritual')}
                  className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Dimensión Espiritual →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Structured Emotional Check-in */}
      <form
        onSubmit={(e) => handleAddMoodEntry(e)}
        className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smile className="w-5 h-5 text-pink-500" />
            Check-in Emocional Estructurado
          </h3>
          <span className="text-xs font-bold text-pink-700 dark:text-pink-300 bg-pink-500/15 px-3 py-1 rounded-full border border-pink-500/25">
            {getDisplayLabelFromValence(valenceScore)} ({valenceScore >= 0 ? '+' : ''}{valenceScore.toFixed(2)})
          </span>
        </div>

        {emotionSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{emotionSuccessMsg}</span>
          </div>
        )}

        {/* Valencia (-1.0 a +1.0) */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>1. Nivel de Valencia Emocional (-1.0 a +1.0)</span>
            <span className="tabular-nums text-pink-600 dark:text-pink-400">
              {valenceScore >= 0 ? '+' : ''}{valenceScore.toFixed(2)} · {getDisplayLabelFromValence(valenceScore)}
            </span>
          </div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={valenceScore}
            onChange={(e) => setValenceScore(parseFloat(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
            <span>Muy desagradable (-1.0)</span>
            <span>Neutro (0.0)</span>
            <span>Muy agradable (+1.0)</span>
          </div>
        </div>

        {/* Emotion Labels Multi-Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            2. Etiquetas Emocionales Precisas (selecciona 1 o más)
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS_POOL.map((lbl) => {
              const active = selectedEmotionLabels.includes(lbl);
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => toggleEmotionLabel(lbl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Associations Multi-Select */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            3. Áreas o Asociaciones de Impacto
          </label>
          <div className="flex flex-wrap gap-2">
            {ASSOCIATION_TAGS_POOL.map((assoc) => {
              const active = selectedAssociations.includes(assoc);
              return (
                <button
                  key={assoc}
                  type="button"
                  onClick={() => toggleAssociation(assoc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-100/80 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {assoc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Emoción Primaria
            </label>
            <select
              value={newEmotion}
              onChange={(e) => setNewEmotion(e.target.value as any)}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="Calma">Calma &amp; Aplomo</option>
              <option value="Determinación">Determinación Inquebrantable</option>
              <option value="Gratitud">Gratitud Plena</option>
              <option value="Entusiasmo">Entusiasmo Creativo</option>
              <option value="Ansiedad">Ansiedad / Tensión</option>
              <option value="Fatiga">Fatiga Acumulada</option>
              <option value="Frustración">Frustración</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Disparador o Causa Observada
            </label>
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
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
            Gestión de Pensamientos (Sustitución Consciente)
          </label>
          <textarea
            rows={3}
            maxLength={7500}
            placeholder="¿Qué pensamiento limitante detectaste y por qué verdad pragmática lo sustituyes?..."
            value={newThoughtManagement}
            onChange={(e) => setNewThoughtManagement(e.target.value)}
            className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white resize-y"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2.5">
          {onNavigate && (
            <button
              type="button"
              disabled={emotionSaving}
              onClick={(e) => handleAddMoodEntry(e, 'mi_dia')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Registrar y Volver a Mi Día</span>
            </button>
          )}
          <button
            type="submit"
            disabled={emotionSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {emotionSaving ? 'Guardando...' : 'Registrar Estado Emocional'}
          </button>
        </div>
      </form>

      {/* Mood History */}
      <div className="space-y-3">
        {data.moodEntries.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {m.display_label ? `${m.display_label} · ${m.primaryEmotion}` : m.primaryEmotion}
                </span>
                {typeof m.valence_score === 'number' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/15 text-pink-700 dark:text-pink-300">
                    Valencia {m.valence_score >= 0 ? '+' : ''}{m.valence_score}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">{m.date}</span>
            </div>

            {m.emotion_labels && m.emotion_labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {m.emotion_labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-700 dark:text-pink-300"
                  >
                    {lbl}
                  </span>
                ))}
                {(m.associations || []).map((asc) => (
                  <span
                    key={asc}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  >
                    #{asc}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-500">Disparador:</span> {m.triggers}
            </p>
            <p className="text-xs text-pink-700 dark:text-pink-300">
              <span className="font-semibold text-slate-500">Gestión cognitiva:</span> {m.thoughtManagement}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
