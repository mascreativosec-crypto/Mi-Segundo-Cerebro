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
    { time: '06:30', label: 'Despertar & Súper Mañana', desc: 'Hidratación 500ml, gratitud y fijación de las 3 prioridades.', icon: Sun, color: 'text-amber-500', view: 'super_morning' },
    { time: '07:15', label: 'Mensaje de Activación de Mentalidad', desc: 'Disparo de enfoque y calibración psicológica con IA.', icon: Flame, color: 'text-orange-500', view: 'mindset' },
    { time: '07:30', label: 'Entrenamiento Físico', desc: 'Sesión de sobrecarga progresiva y fuerza funcional.', icon: Dumbbell, color: 'text-lime-500', view: 'physical_trainer' },
    { time: '08:45', label: 'Desayuno & Recuperación', desc: 'Nutrición limpia y alineación con líderes de equipo.', icon: Coffee, color: 'text-emerald-500', view: 'physical_trainer' },
    { time: '09:00', label: 'Prioridades Empresariales (Deep Work)', desc: 'Bloque ininterrumpido de ejecución de la prioridad #1.', icon: Building2, color: 'text-blue-500', view: 'business' },
    { time: '13:00', label: 'Cápsula Diaria de Sabiduría', desc: 'Nutrición intelectual de libros y síntesis de ideas.', icon: BookOpen, color: 'text-yellow-500', view: 'wisdom_library' },
    { time: '20:30', label: 'Súper Noche & Rendición de Cuentas', desc: 'Evaluación de victorias, aprendizajes y cierre sereno.', icon: Moon, color: 'text-indigo-500', view: 'super_night' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner - Apple Liquid Glass with Amber/Orange squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 shrink-0">
            <Sliders className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Centro de Activación Personal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sincronización del día ideal, motor central de automatizaciones y disparadores inteligentes.
            </p>
          </div>
        </div>
      </div>

      {/* Ideal Daily Execution Timeline */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Estructura Cronológica del Día Ideal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
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
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="w-16 text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    {slot.time}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className={`w-4 h-4 ${slot.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      {slot.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{slot.desc}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Ir al módulo →
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automations Engine */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Motor Central de Automatizaciones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reglas programables para notificaciones, cápsulas de sabiduría y llamadas al orden con IA.
          </p>
        </div>

        <div className="space-y-3">
          {data.automations.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{rule.name}</h3>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {rule.triggerTime}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rule.description}</p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleAutomation(rule.id)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  rule.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-sm ${
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
