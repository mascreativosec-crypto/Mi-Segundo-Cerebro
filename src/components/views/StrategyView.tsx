import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { StrategicDecision } from '../../types';
import {
  Layers,
  Target,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Building2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface StrategyViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [showAddDecision, setShowAddDecision] = useState(false);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [quarter, setQuarter] = useState('Q4 2026');
  const [businessTargetId, setBusinessTargetId] = useState<string>(data.businesses[0]?.id || '');

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim()) return;

    const newDecision: StrategicDecision = {
      id: `sd_${Date.now()}`,
      title: title.trim(),
      context: context.trim(),
      decision: decision.trim(),
      expectedOutcome: expectedOutcome.trim(),
      date: new Date().toISOString().split('T')[0],
      quarter: quarter,
      businessId: businessTargetId || undefined,
    };

    onUpdateData((prev) => ({
      ...prev,
      strategicDecisions: [newDecision, ...prev.strategicDecisions],
    }));

    setShowAddDecision(false);
    setTitle('');
    setContext('');
    setDecision('');
    setExpectedOutcome('');
  };

  const filteredDecisions = data.strategicDecisions.filter((d) => {
    if (selectedBusinessId === 'all') return true;
    return d.businessId === selectedBusinessId;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Dirección & Estrategia Ejecutiva</h1>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ALTA DIRECCIÓN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Planificación estratégica, objetivos OKR, actas de reuniones y repositorio de decisiones trascendentales.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddDecision(!showAddDecision)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Nueva Decisión Estratégica
          </button>
        </div>
      </div>

      {/* Strategic OKRs Overview */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Objetivos Estratégicos & OKRs Vigentes</h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">Horizonte 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.goals.map((goal) => (
            <div key={goal.id} className="p-4 rounded-xl bg-[#08100c] border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-[10px] uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {goal.horizon}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{goal.progressPercent}%</span>
                </div>
                <h3 className="text-xs font-bold text-white mt-1 leading-snug">{goal.title}</h3>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Meta: {goal.targetDate}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {goal.milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${m.done ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span className={m.done ? 'line-through text-slate-500' : ''}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Decision Modal / Form */}
      {showAddDecision && (
        <form onSubmit={handleAddDecision} className="p-5 rounded-2xl bg-[#0c1812] border border-emerald-500/30 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Registrar Decisión Estratégica / Acta
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] text-slate-400 block mb-1">Título de la Decisión</label>
              <input
                type="text"
                placeholder="Ej: Cambio de modelo de precios hacia suscripciones retainer..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-[#08100c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Empresa Vinculada</label>
              <select
                value={businessTargetId}
                onChange={(e) => setBusinessTargetId(e.target.value)}
                className="w-full bg-[#08100c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {data.businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.logoEmoji} {b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Contexto & Motivo</label>
            <textarea
              rows={2}
              placeholder="¿Qué problema u oportunidad motivó esta decisión directiva?..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Decisión Específica Adoptada</label>
            <textarea
              rows={2}
              placeholder="¿Qué se decidió exactamente?..."
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              required
              className="w-full bg-[#08100c] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Impacto / Resultado Esperado</label>
            <input
              type="text"
              placeholder="Ej: Aumentar margen neto en 15% y retención de clientes a 12 meses..."
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full bg-[#08100c] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddDecision(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg cursor-pointer"
            >
              Guardar Decisión
            </button>
          </div>
        </form>
      )}

      {/* Strategic Decisions Repository */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Bitácora de Decisiones Directivas & Actas
            </h2>
            <p className="text-xs text-slate-400">
              Historial de resoluciones ejecutivas para evaluar coherencia y resultados a largo plazo.
            </p>
          </div>

          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="bg-[#08100c] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
          >
            <option value="all">Todas las Empresas</option>
            {data.businesses.map((biz) => (
              <option key={biz.id} value={biz.id}>{biz.logoEmoji} {biz.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No hay decisiones registradas para la empresa seleccionada.
            </div>
          ) : (
            filteredDecisions.map((dec) => {
              const biz = dec.businessId ? data.businesses.find((b) => b.id === dec.businessId) : null;
              return (
                <div key={dec.id} className="p-4 rounded-xl bg-[#08100c] border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <span className="font-bold text-white text-sm">{dec.title}</span>
                    <div className="flex items-center gap-2">
                      {biz && (
                        <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {biz.name}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {dec.quarter} · {dec.date}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-400">Contexto:</strong> {dec.context}
                  </p>
                  <p className="text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                    <strong className="text-emerald-400">Resolución:</strong> {dec.decision}
                  </p>
                  {dec.expectedOutcome && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Impacto previsto:</strong> {dec.expectedOutcome}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
