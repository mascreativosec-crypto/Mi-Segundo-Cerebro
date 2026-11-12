import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import {
  Sparkles,
  Sun,
  Flame,
  Moon,
  Send,
  MessageSquare,
  ShieldAlert,
  Compass,
  Bookmark,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface MindsetCoachViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const MindsetCoachView: React.FC<MindsetCoachViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedMoment, setSelectedMoment] = useState<'activacion' | 'enfoque' | 'reflexion'>('activacion');
  const [selectedTone, setSelectedTone] = useState<string>('directo y exigente');
  const [activeMessage, setActiveMessage] = useState<string>(
    "Hoy no negocias con tu mente ni con las excusas. Tus 3 prioridades mandan sobre cualquier urgencia secundaria. Pon el cuerpo en movimiento, agradece la oportunidad de existir y domina la jornada con calma ejecutiva."
  );
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // Chat consultation with strategic advisor
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Bienvenido a tu Consejo Estratégico de IA. No estoy aquí para complacerte ni felicitarte por estar ocupado. Mi función es cuestionarte con criterio: ¿estás trabajando en tus 3 prioridades de alto impacto o te estás refugiando en tareas cómodas? Cuéntame tu situación actual.`
    }
  ]);
  const [isConsulting, setIsConsulting] = useState(false);

  const fetchMomentMotivation = async (moment: 'activacion' | 'enfoque' | 'reflexion') => {
    setSelectedMoment(moment);
    setIsLoadingMessage(true);

    try {
      const res = await fetch('/api/gemini/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moment,
          tone: selectedTone,
          pillarSummary: {
            profile: data.profile,
            todayPriorities: data.superMorning.top3Priorities,
            completedHabits: data.habits.filter((h) => h.completedDates.includes(new Date().toISOString().split('T')[0])).length,
          },
        }),
      });
      const result = await res.json();
      if (result.message) {
        setActiveMessage(result.message);
      }
    } catch (err) {
      console.error('Error fetching motivation message:', err);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleSendConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isConsulting) return;

    const userText = userQuery.trim();
    setUserQuery('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsConsulting(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          tone: selectedTone,
          context: {
            profile: data.profile,
            activeBusinesses: data.businesses.map((b) => ({ name: b.name, revenue: b.actualRevenue, target: b.revenueTarget })),
            todayPriorities: data.superMorning.top3Priorities,
            tasksSummary: `${data.tasks.filter((t) => t.status === 'done').length} completadas de ${data.tasks.length} totales`,
            habitsSummary: `${data.habits.filter((h) => h.completedDates.includes(new Date().toISOString().split('T')[0])).length} de ${data.habits.length}`,
            pillarScores: data.pillarScores.map((p) => `${p.label}: ${p.score}%`),
          },
        }),
      });
      const result = await res.json();
      if (result.response) {
        setChatHistory((prev) => [...prev, { sender: 'assistant', text: result.response }]);
      }
    } catch (err) {
      console.error('Error in advisor consultation:', err);
      setChatHistory((prev) => [
        ...prev,
        { sender: 'assistant', text: 'Error temporal al conectar con el asistente de IA. Revisa tu conexión o clave API.' }
      ]);
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with Sky/Blue squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 shrink-0">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mentalidad, Motivación & Asesor IA
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Inspirado en disciplina de alto rendimiento, estrategia comercial y discernimiento estoico.
              </p>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tono:</span>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="directo y exigente">Directo & Exigente (Isra García)</option>
              <option value="estrategico y persuasivo">Estratégico & Negociador (Jürgen Klaric)</option>
              <option value="filosofico y disruptivo">Filosófico & Cero Filtro (Diego Dreyfus)</option>
              <option value="estoico sereno">Estoico & Sereno (Marco Aurelio)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3 Moments Switcher & Active Capsule Card */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md flex items-center gap-1.5">
            <button
              onClick={() => fetchMomentMotivation('activacion')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'activacion'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Activación (07:00)</span>
            </button>
            <button
              onClick={() => fetchMomentMotivation('enfoque')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'enfoque'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-sky-500" />
              <span>Foco & Bloqueos (13:00)</span>
            </button>
            <button
              onClick={() => fetchMomentMotivation('reflexion')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'reflexion'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-purple-500" />
              <span>Reflexión (20:30)</span>
            </button>
          </div>

          <button
            onClick={() => fetchMomentMotivation(selectedMoment)}
            disabled={isLoadingMessage}
            className="px-3.5 py-2 rounded-xl border border-sky-500/30 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessage ? 'animate-spin' : ''}`} />
            <span>Regenerar con IA</span>
          </button>
        </div>

        {/* Dynamic Capsule Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/10 via-white/80 to-blue-500/5 dark:from-sky-950/20 dark:via-slate-900/60 dark:to-blue-950/20 border border-sky-500/25 relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="text-[11px] font-bold uppercase text-sky-600 dark:text-sky-400 tracking-wide block">
                Cápsula de Impacto Directo · {selectedTone}
              </span>
              <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                "{activeMessage}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Consultation Terminal */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Diálogo Estratégico con tu Consejo IA
            </h3>
          </div>
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            Contexto 5 Pilares Activo
          </span>
        </div>

        {/* Chat History */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto p-2">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  item.sender === 'user'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-sm shadow-md'
                    : 'bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 rounded-bl-sm'
                }`}
              >
                <span className="text-[10px] font-semibold block opacity-70 mb-1">
                  {item.sender === 'user' ? 'Tú (Director)' : 'Consejero Estratégico IA'}
                </span>
                <p className="whitespace-pre-line">{item.text}</p>
              </div>
            </div>
          ))}

          {isConsulting && (
            <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>El consejero está evaluando tus 5 pilares para responder...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendConsultation} className="flex items-center gap-2.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Pregúntale sobre un bloqueo comercial, autosabotaje, toma de decisiones..."
            className="flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isConsulting || !userQuery.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
          >
            <span>Consultar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
