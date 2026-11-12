import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  FileText,
  Target
} from 'lucide-react';

interface PersonalDashboardViewProps {
  data: AppStoreData;
  onNavigate: (view: string) => void;
  onOpenQuickCapture: () => void;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const PersonalDashboardView: React.FC<PersonalDashboardViewProps> = ({
  data,
  onNavigate,
  onOpenQuickCapture,
  onUpdateData,
}) => {
  // Interactive Growth Points state inspired by the reference image
  const [growthPoints, setGrowthPoints] = useState({
    strategy: 85,
    leadership: 90,
    efficiency: 82,
    health: 88,
    emotion: 80,
  });

  const currentDateFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const completedHabitsCount = data.habits.filter((h) =>
    h.completedDates.includes(new Date().toISOString().split('T')[0])
  ).length;

  const habitCompletionRate = data.habits.length > 0
    ? Math.round((completedHabitsCount / data.habits.length) * 100)
    : 0;

  const todayTasks = data.tasks.filter(
    (t) => t.dueDate === new Date().toISOString().split('T')[0]
  );
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'done');
  const taskProgressRate = todayTasks.length > 0
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Horizon Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider font-semibold">
              {currentDateFormatted}
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Panel de Evolución Personal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Bienvenido, {data.profile.name}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            {data.profile.dailyIntention || 'Ejecutando con serenidad y dirección en las 5 dimensiones.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('mi_dia')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Ir al Centro MI DÍA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Arc Gauge + Timeline + Growth Points */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Timeline & Enfoque Diario (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Timeline / Focus Block Card */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Bloques de Enfoque Hoy</h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Semana 46</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">Activo</span>
              </div>
            </div>

            {/* Visual Schedule Slots */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 shrink-0 w-16 font-bold">07:00 am</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Súper Mañana & Activación
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Hidratación, meditación y 3 prioridades innegociables</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                  Completado
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 w-16">09:00 am</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Trabajo Profundo & Negocios</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Revisión contractual con cliente enterprise y KPIs de Alpha Studio</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 font-bold">
                  En curso
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80">
                <span className="text-xs font-mono text-slate-400 shrink-0 w-16">01:00 pm</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cápsula de Sabiduría & Nutrición</div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Análisis del extracto de Ray Dalio y almuerzo limpio</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Programado</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20">
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 shrink-0 w-16 font-bold">08:30 pm</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    Súper Noche & Gratitud
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Evaluación de victorias, aprendizajes y preparación de mañana</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Pendiente</span>
              </div>
            </div>
          </div>

          {/* Document & Strategic Goal Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-yellow-500" />
                  Biblioteca & Documentos
                </span>
                <button
                  onClick={() => onNavigate('wisdom_library')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  Ver todo
                </button>
              </div>

              <div className="space-y-2">
                {data.books.slice(0, 2).map((book) => (
                  <div key={book.id} className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">
                        {book.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {book.currentPage} / {book.totalPages} pág
                      </span>
                    </div>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {Math.round((book.currentPage / book.totalPages) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  Meta Principal Trimestral
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{data.goals[0]?.title || 'Escalar ingresos netos manteniendo márgenes altos y salud integral.'}"
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Progreso</span>
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  {data.goals[0]?.progressPercent || 68}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Growth Points + Arc Gauge + AI Co-pilot (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Growth Points Card */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Puntos de Crecimiento
              </h2>
              <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/30 font-bold">
                Score 1820
              </span>
            </div>

            {/* Sliders */}
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Estrategia & Visión</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{growthPoints.strategy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={growthPoints.strategy}
                  onChange={(e) => setGrowthPoints({ ...growthPoints, strategy: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Liderazgo & Delegación</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{growthPoints.leadership}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={growthPoints.leadership}
                  onChange={(e) => setGrowthPoints({ ...growthPoints, leadership: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Eficiencia Operativa</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">{growthPoints.efficiency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={growthPoints.efficiency}
                  onChange={(e) => setGrowthPoints({ ...growthPoints, efficiency: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Salud & Físico</span>
                  <span className="font-mono text-lime-600 dark:text-lime-400 font-bold">{growthPoints.health}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={growthPoints.health}
                  onChange={(e) => setGrowthPoints({ ...growthPoints, health: Number(e.target.value) })}
                  className="w-full accent-lime-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Main Task Orbital Gauge */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Índice de Enfoque Hoy
            </span>

            {/* Arc Meter */}
            <div className="relative w-40 h-24 flex items-center justify-center my-2">
              <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
                <path
                  d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/[0.08]"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none"
                  stroke="url(#apple-arc-gradient)"
                  strokeWidth="12"
                  strokeDasharray="204"
                  strokeDashoffset="35"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="apple-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-8 flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                  440
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Excelente</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('mi_dia')}
              className="mt-2 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Ver Detalles del Día
            </button>
          </div>

          {/* AI Co-pilot Widget */}
          <div className="rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-lg dark:shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Co-pilot Estratégico</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 font-bold">
                Activo
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              "Has completado tu sesión de fuerza y prioridades tempranas. Mantén blindado el bloque de la tarde sin interrupciones."
            </p>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/70 dark:bg-black/30 border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Metas Activas</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">84% esta semana</span>
              </div>
              <button
                onClick={() => onNavigate('mindset')}
                className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Consultar IA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* The 5 Pillars of Growth Scorecard Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Estado Integral de los 5 Pilares
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ESPIRITUAL + EMOCIONAL + FÍSICO + INTELECTUAL + FINANCIERO = MEJOR VERSIÓN
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.pillarScores.map((pillar) => {
            const getPillarAccent = (key: string) => {
              switch (key) {
                case 'espiritual':
                  return 'hover:border-amber-500/40 text-amber-500';
                case 'emocional':
                  return 'hover:border-pink-500/40 text-pink-500';
                case 'fisico':
                  return 'hover:border-lime-500/40 text-lime-500';
                case 'intelectual':
                  return 'hover:border-cyan-500/40 text-cyan-500';
                case 'financiero':
                  return 'hover:border-emerald-500/40 text-emerald-500';
                default:
                  return 'hover:border-blue-500/40 text-blue-500';
              }
            };

            return (
              <div
                key={pillar.key}
                onClick={() => {
                  if (pillar.key === 'fisico') onNavigate('physical_trainer');
                  else if (pillar.key === 'intelectual') onNavigate('wisdom_library');
                  else if (pillar.key === 'financiero') onNavigate('personal_finances');
                  else onNavigate('spiritual_emotional');
                }}
                className={`rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-md dark:shadow-xl ${getPillarAccent(pillar.key)}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase font-mono">
                      {pillar.label}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                      {pillar.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {pillar.summary}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Al día
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
