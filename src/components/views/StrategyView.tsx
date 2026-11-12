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
      {/* Header Banner - Apple Liquid Glass with Indigo/Purple squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dirección & Estrategia Ejecutiva
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Planificación estratégica, objetivos OKR, actas directivas y repositorio de decisiones.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddDecision(!showAddDecision)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nueva Decisión Estratégica</span>
          </button>
        </div>
      </div>

      {/* Strategic OKRs Overview */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Objetivos Estratégicos & OKRs</h2>
          </div>
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Horizonte 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.goals.map((goal) => (
            <div key={goal.id} className="p-5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                    {goal.horizon}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{goal.progressPercent}%</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">{goal.title}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Meta: {goal.targetDate}</span>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
                {goal.milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${m.done ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    <span className={m.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Decision Modal / Form */}
      {showAddDecision && (
        <form onSubmit={handleAddDecision} className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-indigo-500/30 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            Registrar Decisión Estratégica / Acta
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Título de la Decisión</label>
              <input
                type="text"
                placeholder="Ej: Cambio de modelo de precios hacia suscripciones retainer..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Empresa Vinculada</label>
              <select
                value={businessTargetId}
                onChange={(e) => setBusinessTargetId(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              >
                {data.businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.logoEmoji} {b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Contexto & Motivo</label>
            <textarea
              rows={2}
              placeholder="¿Qué problema u oportunidad motivó esta decisión directiva?..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Decisión Específica Adoptada</label>
            <textarea
              rows={2}
              placeholder="¿Qué se decidió exactamente?..."
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              required
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Impacto / Resultado Esperado</label>
            <input
              type="text"
              placeholder="Ej: Aumentar margen neto en 15% y retención de clientes a 12 meses..."
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setShowAddDecision(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Guardar Decisión
            </button>
          </div>
        </form>
      )}

      {/* Strategic Decisions Repository */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Bitácora de Decisiones Directivas & Actas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historial de resoluciones ejecutivas para evaluar coherencia y resultados a largo plazo.
            </p>
          </div>

          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
          >
            <option value="all">Todas las Empresas</option>
            {data.businesses.map((biz) => (
              <option key={biz.id} value={biz.id}>{biz.logoEmoji} {biz.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No hay decisiones registradas para la empresa seleccionada.
            </div>
          ) : (
            filteredDecisions.map((dec) => {
              const biz = dec.businessId ? data.businesses.find((b) => b.id === dec.businessId) : null;
              return (
                <div key={dec.id} className="p-5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{dec.title}</span>
                    <div className="flex items-center gap-2">
                      {biz && (
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                          {biz.name}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {dec.quarter} · {dec.date}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-500 dark:text-slate-400 font-semibold">Contexto:</strong> {dec.context}
                  </p>
                  <p className="text-xs text-indigo-900 dark:text-indigo-200 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <strong className="text-indigo-700 dark:text-indigo-400 font-bold">Resolución:</strong> {dec.decision}
                  </p>
                  {dec.expectedOutcome && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="font-semibold text-slate-600 dark:text-slate-300">Impacto previsto:</strong> {dec.expectedOutcome}
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
