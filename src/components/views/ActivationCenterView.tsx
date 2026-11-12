import React from 'react';
import { AppStoreData } from '../../services/storage';
import { AutomationRule } from '../../types';
import {
  Sliders,
  Clock,
  Sun,
  Flame,
  Dumbbell,
  Coffee,
  Building2,
  BookOpen,
  Moon,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ActivationCenterViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate: (view: string) => void;
}

export const ActivationCenterView: React.FC<ActivationCenterViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const toggleAutomation = (ruleId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === ruleId ? { ...a, enabled: !a.enabled } : a
      ),
    }));
  };

  const scheduleSlots = [
    { time: '06:30', label: 'Despertar & Súper Mañana', desc: 'Hidratación 500ml, gratitud y fijación de las 3 prioridades.', icon: Sun, color: 'text-amber-400', view: 'super_morning' },
    { time: '07:15', label: 'Mensaje de Activación de Mentalidad', desc: 'Disparo de enfoque y calibración psicológica con IA.', icon: Flame, color: 'text-orange-400', view: 'mindset' },
    { time: '07:30', label: 'Entrenamiento Físico', desc: 'Sesión de sobrecarga progresiva y fuerza funcional.', icon: Dumbbell, color: 'text-emerald-400', view: 'physical_trainer' },
    { time: '08:45', label: 'Desayuno & Recuperación', desc: 'Nutrición limpia y alineación con líderes de equipo.', icon: Coffee, color: 'text-emerald-300', view: 'physical_trainer' },
    { time: '09:00', label: 'Prioridades Empresariales (Deep Work)', desc: 'Bloque ininterrumpido de ejecución de la prioridad #1.', icon: Building2, color: 'text-blue-400', view: 'business' },
    { time: '13:00', label: 'Cápsula Diaria de Sabiduría', desc: 'Nutrición intelectual de libros y síntesis de ideas.', icon: BookOpen, color: 'text-emerald-400', view: 'wisdom_library' },
    { time: '20:30', label: 'Súper Noche & Rendición de Cuentas', desc: 'Evaluación de victorias, aprendizajes y cierre sereno.', icon: Moon, color: 'text-indigo-400', view: 'super_night' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Centro de Activación Personal</h1>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                CRONOGRAMA & REGLAS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronización del día ideal, motor central de automatizaciones y disparadores inteligentes.
            </p>
          </div>
        </div>
      </div>

      {/* Ideal Daily Execution Timeline */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Estructura Cronológica del Día Ideal
          </h2>
          <p className="text-xs text-slate-400">
            Los horarios son referencias dinámicas para estructurar tu energía ejecutiva y biológica.
          </p>
        </div>

        <div className="space-y-3">
          {scheduleSlots.map((slot, idx) => {
            const Icon = slot.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(slot.view)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#08100c] border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-16 text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {slot.time}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${slot.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {slot.label}
                    </h3>
                    <p className="text-[11px] text-slate-400">{slot.desc}</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 group-hover:text-emerald-400 transition-colors">
                  Ir al módulo →
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automations Engine */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Motor Central de Automatizaciones
          </h2>
          <p className="text-xs text-slate-400">
            Reglas programables para notificaciones, cápsulas de sabiduría y llamadas al orden con IA.
          </p>
        </div>

        <div className="space-y-3">
          {data.automations.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[#08100c] border border-slate-800"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">{rule.name}</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                    {rule.triggerTime}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleAutomation(rule.id)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  rule.enabled ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                    rule.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
