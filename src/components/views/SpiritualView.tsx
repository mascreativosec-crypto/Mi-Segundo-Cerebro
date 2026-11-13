import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { SpiritualJournalEntry } from '../../types';
import {
  Compass,
  Sparkles,
  BookOpen,
  Cross,
  RefreshCw,
  Feather,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface SpiritualViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate?: (viewId: string) => void;
}

interface CatholicVerse {
  reference: string;
  theme: 'fortaleza' | 'proposito' | 'paz';
  text: string;
  reflection: string;
}

const CATHOLIC_VERSES: CatholicVerse[] = [
  {
    reference: 'Filipenses 4,13',
    theme: 'fortaleza',
    text: 'Todo lo puedo en aquel que me fortalece.',
    reflection: 'Cuando la exigencia del día supera tus fuerzas humanas, la gracia sostiene tu temple y claridad.',
  },
  {
    reference: 'Isaías 41,10',
    theme: 'fortaleza',
    text: 'No temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios. Te fortaleceré y te ayudaré.',
    reflection: 'Avanza con serenidad ante decisiones difíciles sabiendo que no caminas en soledad.',
  },
  {
    reference: 'Josué 1,9',
    theme: 'fortaleza',
    text: 'Sé fuerte y valiente. No temas ni te acobardes, porque el Señor tu Dios estará contigo dondequiera que vayas.',
    reflection: 'La valentía espiritual es actuar con rectitud incluso frente a la incertidumbre.',
  },
  {
    reference: 'Jeremías 29,11',
    theme: 'proposito',
    text: 'Porque yo sé muy bien los planes que tengo para ustedes, planes de bienestar y no de calamidad, a fin de darles un futuro y una esperanza.',
    reflection: 'Cada proyecto honesto cobra propósito eterno cuando sirve al bien común.',
  },
  {
    reference: 'Romanos 8,28',
    theme: 'proposito',
    text: 'Sabemos que Dios dispone todas las cosas para el bien de quienes lo aman.',
    reflection: 'Incluso los tropiezos operativos se convierten en escuela de carácter y sabiduría.',
  },
  {
    reference: 'Filipenses 4,6-7',
    theme: 'paz',
    text: 'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias.',
    reflection: 'La oración agradecida desactiva la ansiedad anticipatoria antes de dormir o decidir.',
  },
  {
    reference: 'Juan 14,27',
    theme: 'paz',
    text: 'La paz les dejo, mi paz les doy. Yo no se la doy a ustedes como la da el mundo. No se angustien ni se acobarden.',
    reflection: 'La verdadera paz no depende de que todo esté perfecto afuera, sino ordenado por dentro.',
  },
  {
    reference: 'Salmo 4,8',
    theme: 'paz',
    text: 'En paz me acuesto y en seguida me duermo, porque solo tú, Señor, me haces vivir confiado.',
    reflection: 'Entrega las preocupaciones de la jornada y descansa con confianza plena.',
  },
];

const ISRA_SPIRITUAL_PRACTICES = [
  {
    id: 'isra_no_se',
    title: 'Mente "No Sé" (Principiante Zen)',
    subtitle: 'Desaprender etiquetas rígidas',
    prompt: '¿Qué situación o persona estás juzgando desde prejuicios viejos? Obsérvala hoy como si fuera la primera vez.',
  },
  {
    id: 'isra_preguntas',
    title: 'Preguntas Poderosas al Despertar',
    subtitle: 'Calidad de atención = Calidad de vida',
    prompt: '¿Qué haría hoy si no tuviera miedo a quedar mal? ¿Por qué estoy profundamente agradecido en este instante?',
  },
  {
    id: 'isra_quietud',
    title: 'Quietud & Silencio Sin Ruido',
    subtitle: 'Desconexión intencional de 10 minutos',
    prompt: 'Permanece sin pantalla ni estímulos observando tu respiración y dejando que el ruido mental decante por sí solo.',
  },
  {
    id: 'isra_apreciacion',
    title: 'Apreciación Radical',
    subtitle: 'Dar valor a lo ordinario',
    prompt: 'Nombra 3 personas o bendiciones cotidianas que das por sentadas y exprésales gratitud consciente hoy.',
  },
];

export const SpiritualView: React.FC<SpiritualViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const [spiritualFilter, setSpiritualFilter] = useState<'fortaleza' | 'proposito' | 'paz'>('fortaleza');
  const [aiGuideLoading, setAiGuideLoading] = useState(false);
  const [aiGuideTradition, setAiGuideTradition] = useState<'catolica' | 'general'>('catolica');
  const [aiGuideResult, setAiGuideResult] = useState<{
    reference: string;
    verse: string;
    reflection: string;
    prayer: string;
  } | null>(null);
  const [newPurposeReflection, setNewPurposeReflection] = useState('');
  const [newGratitudeItem, setNewGratitudeItem] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleGenerateAiSpiritualGuide = async (tradition: 'catolica' | 'general') => {
    setAiGuideTradition(tradition);
    setAiGuideLoading(true);
    try {
      const res = await fetch('/api/gemini/spiritual-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradition,
          theme: spiritualFilter,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.guide) setAiGuideResult(json.guide);
      }
    } catch {
      // ignore transient errors
    } finally {
      setAiGuideLoading(false);
    }
  };

  const handleSaveSpiritualTextToJournal = (
    reflectionText: string,
    faithMoment: string,
    gratitude?: string
  ) => {
    const newEntry: SpiritualJournalEntry = {
      id: `se_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      purposeReflection: reflectionText,
      faithMoments: faithMoment,
      gratitudeList: gratitude ? [gratitude] : ['Por la paz interior y la guía espiritual de hoy'],
    };
    onUpdateData((prev) => ({
      ...prev,
      spiritualEntries: [newEntry, ...prev.spiritualEntries],
    }));
    setSavedNotice('Reflexión guardada en tu Diario Espiritual.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleAddSpiritualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeReflection.trim()) return;
    handleSaveSpiritualTextToJournal(
      newPurposeReflection.trim(),
      'Alineación consciente con el propósito y la fe.',
      newGratitudeItem.trim() || undefined
    );
    setNewPurposeReflection('');
    setNewGratitudeItem('');
  };

  const filteredVerses = CATHOLIC_VERSES.filter((v) => v.theme === spiritualFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-500/25 shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Compass className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dimensión Espiritual
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Fe católica, Lectio Divina, quietud consciente (Isra García), propósito rector y diario de oración.
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('emotional')}
              className="px-4 py-2 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 text-xs font-bold text-pink-700 dark:text-pink-300 cursor-pointer shrink-0"
            >
              Ir a Dimensión Emocional →
            </button>
          )}
        </div>
      </div>

      {/* Declaration of Purpose Card */}
      <div className="p-6 sm:p-7 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-500/10 via-white/85 to-indigo-500/5 dark:from-purple-950/20 dark:via-slate-900/60 dark:to-indigo-950/20 border border-purple-500/25 shadow-lg space-y-3">
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

      {/* Lectio Divina & Versículos Bíblicos Católicos + Guía IA */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-purple-500/25 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Cross className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Palabra del Día &amp; Lectio Divina (Biblia Católica)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Versículos de fortaleza, propósito y paz + acompañamiento espiritual IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['fortaleza', 'proposito', 'paz'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSpiritualFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                  spiritualFilter === t
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                }`}
              >
                {t === 'proposito' ? 'Propósito' : t === 'paz' ? 'Paz Diaria' : 'Fortaleza'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredVerses.map((verse) => (
            <div
              key={verse.reference}
              className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/35 border border-slate-200/80 dark:border-purple-500/20 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {verse.reference}
                </span>
                <p className="text-xs italic font-serif text-slate-900 dark:text-white leading-relaxed">
                  "{verse.text}"
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {verse.reflection}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSaveSpiritualTextToJournal(
                    `${verse.reference}: "${verse.text}" — ${verse.reflection}`,
                    `Lectio Divina (${verse.reference})`,
                    'Por la Palabra que da dirección y paz hoy'
                  )
                }
                className="self-start text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer pt-1"
              >
                + Guardar en mi Diario Espiritual
              </button>
            </div>
          ))}
        </div>

        {/* AI Spiritual Guide Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={aiGuideLoading}
            onClick={() => handleGenerateAiSpiritualGuide('catolica')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiGuideLoading && aiGuideTradition === 'catolica' ? 'animate-spin' : ''}`} />
            <span>Generar Lectio Divina Católica con IA</span>
          </button>
          <button
            type="button"
            disabled={aiGuideLoading}
            onClick={() => handleGenerateAiSpiritualGuide('general')}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Guía Contemplativa / Quietud IA</span>
          </button>
        </div>

        {aiGuideResult && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-800 dark:text-purple-200">
                {aiGuideResult.reference}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleSaveSpiritualTextToJournal(
                    `${aiGuideResult.reference}: "${aiGuideResult.verse}" · ${aiGuideResult.reflection}`,
                    aiGuideResult.prayer,
                    'Por este momento de quietud e inspiración'
                  )
                }
                className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
              >
                + Guardar en Diario
              </button>
            </div>
            <p className="text-xs italic font-serif text-slate-900 dark:text-white">"{aiGuideResult.verse}"</p>
            <p className="text-xs text-slate-700 dark:text-slate-200">{aiGuideResult.reflection}</p>
            <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
              Oración / Intención: {aiGuideResult.prayer}
            </p>
          </div>
        )}
      </div>

      {/* Prácticas Espirituales & Autoconocimiento (Isra García) */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <Feather className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Prácticas Espirituales &amp; Autoconocimiento (Isra García)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quietud práctica, mente de principiante y apreciación consciente para centrar el espíritu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ISRA_SPIRITUAL_PRACTICES.map((pr) => (
            <div
              key={pr.id}
              className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.06] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{pr.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300">
                  {pr.subtitle}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{pr.prompt}</p>
              <button
                type="button"
                onClick={() => setNewPurposeReflection(`${pr.title}: ${pr.prompt}`)}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Usar como base de mi reflexión ↓
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* New Reflection Form */}
      <form
        onSubmit={handleAddSpiritualNote}
        className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Diario de Reflexión, Oración &amp; Gratitud Espiritual
          </h3>
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {savedNotice}
            </span>
          )}
        </div>
        <textarea
          rows={4}
          maxLength={7500}
          placeholder="Reflexión de hoy sobre propósito, fe, quietud o momentos de conexión..."
          value={newPurposeReflection}
          onChange={(e) => setNewPurposeReflection(e.target.value)}
          required
          className="w-full min-h-[110px] bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-y"
        />
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Motivo de gratitud principal..."
            value={newGratitudeItem}
            onChange={(e) => setNewGratitudeItem(e.target.value)}
            className="w-full sm:flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('mi_dia')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Mi Día</span>
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              Guardar Reflexión
            </button>
          </div>
        </div>
      </form>

      {/* Spiritual Entries List */}
      <div className="space-y-3">
        {data.spiritualEntries.map((entry) => (
          <div
            key={entry.id}
            className="p-5 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{entry.date}</span>
              {entry.faithMoments && (
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  {entry.faithMoments}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {entry.purposeReflection}
            </p>
            {entry.gratitudeList.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-wrap gap-2">
                {entry.gratitudeList.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full"
                  >
                    🙏 {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
