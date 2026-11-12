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
      {/* Header Banner - Celeste / Cyan vibrant identity */}
      <div className="rounded-3xl bg-gradient-to-br from-cyan-950/40 via-[#0a1820] to-[#070e14] border border-cyan-500/25 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Mentalidad, Motivación & Asesor IA</h1>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/30 font-bold">
                  CELESTE · ESTRATÉGICO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Inspirado en la disciplina de Isra García, la estrategia comercial de Jürgen Klaric y la introspección de Diego Dreyfus.
              </p>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Tono del Coach:</span>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="bg-[#081216] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400"
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
      <div className="p-6 rounded-3xl bg-[#091419] border border-cyan-500/20 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#060e12] border border-cyan-500/20 rounded-2xl">
            <button
              onClick={() => fetchMomentMotivation('activacion')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'activacion'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Activación (07:00)</span>
            </button>
            <button
              onClick={() => fetchMomentMotivation('enfoque')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'enfoque'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Foco & Bloqueos (13:00)</span>
            </button>
            <button
              onClick={() => fetchMomentMotivation('reflexion')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedMoment === 'reflexion'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Reflexión (20:30)</span>
            </button>
          </div>

          <button
            onClick={() => fetchMomentMotivation(selectedMoment)}
            disabled={isLoadingMessage}
            className="px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessage ? 'animate-spin' : ''}`} />
            <span>Regenerar con IA</span>
          </button>
        </div>

        {/* Dynamic Capsule Card */}
        <div className="p-5 rounded-2xl bg-[#060e12] border border-cyan-500/25 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400" />
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider font-bold">
                CÁPSULA DE IMPACTO DIRECTO · TONO: {selectedTone.toUpperCase()}
              </span>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                "{activeMessage}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Consultation Terminal */}
      <div className="p-6 rounded-3xl bg-[#091419] border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Diálogo Estratégico con tu Consejo Directivo IA
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            CONTEXTO 5 PILARES ACTIVO
          </span>
        </div>

        {/* Chat History */}
        <div className="space-y-3 max-h-[360px] overflow-y-auto p-2">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  item.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-sm'
                    : 'bg-[#060e12] border border-cyan-500/25 text-slate-200 rounded-bl-sm'
                }`}
              >
                <span className="text-[9px] font-mono block opacity-60 mb-1">
                  {item.sender === 'user' ? 'TÚ (DIRECTOR)' : 'CONSEJERO ESTRATÉGICO IA'}
                </span>
                <p className="whitespace-pre-line">{item.text}</p>
              </div>
            </div>
          ))}

          {isConsulting && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 italic">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>El consejero está analizando tus 5 pilares y formulando respuesta...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendConsultation} className="flex items-center gap-2 pt-3 border-t border-cyan-500/15">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Pregúntale sobre un bloqueo comercial, autosabotaje, toma de decisiones..."
            className="flex-1 bg-[#060e12] border border-cyan-500/25 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="submit"
            disabled={isConsulting || !userQuery.trim()}
            className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950 cursor-pointer"
          >
            <span>Consultar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
