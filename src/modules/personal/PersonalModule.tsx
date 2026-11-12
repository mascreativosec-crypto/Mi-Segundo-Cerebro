import React, { useState } from 'react';
import {
  Sparkles,
  Home,
  Flame,
  Wind,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Star,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Heart,
  HelpCircle,
  Archive,
  ListPlus
} from 'lucide-react';
import { PersonalRitualLog, CustomRitual, BusinessTask } from '../../types';
import { AppStoreData } from '../../services/storage';
import { BrainDumpModal } from './BrainDumpModal';
import { SpaceCleaningModal } from './SpaceCleaningModal';

interface PersonalModuleProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture?: () => void;
}

export const PersonalModule: React.FC<PersonalModuleProps> = ({
  data,
  onUpdateData,
  onOpenQuickCapture
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'brain_dump' | 'cleaning' | 'history'>('all');
  const [showBrainDumpModal, setShowBrainDumpModal] = useState<boolean>(false);
  const [showCleaningModal, setShowCleaningModal] = useState<boolean>(false);
  const [showNewRitualModal, setShowNewRitualModal] = useState<boolean>(false);

  // Breathwork state
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Sostén' | 'Exhala'>('Inhala');
  const [breathSeconds, setBreathSeconds] = useState<number>(4);

  // New custom ritual form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newMinutes, setNewMinutes] = useState<number>(10);
  const [newSteps, setNewSteps] = useState<string>('');

  const logs = data.personalLogs || [];
  const customRituals = data.customRituals || [];

  // Breathwork loop
  React.useEffect(() => {
    if (!isBreathing) return;
    let timer: NodeJS.Timeout;

    if (breathPhase === 'Inhala') {
      timer = setTimeout(() => {
        setBreathPhase('Sostén');
        setBreathSeconds(7);
      }, 4000);
    } else if (breathPhase === 'Sostén') {
      timer = setTimeout(() => {
        setBreathPhase('Exhala');
        setBreathSeconds(8);
      }, 7000);
    } else {
      timer = setTimeout(() => {
        setBreathPhase('Inhala');
        setBreathSeconds(4);
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [isBreathing, breathPhase]);

  // Save a completed ritual log
  const handleSaveLog = (logData: Omit<PersonalRitualLog, 'id' | 'completedAt'>) => {
    const newLog: PersonalRitualLog = {
      ...logData,
      id: `pl_${Date.now()}`,
      completedAt: new Date().toISOString()
    };
    onUpdateData((prev) => ({
      ...prev,
      personalLogs: [newLog, ...(prev.personalLogs || [])]
    }));
  };

  // Convert thoughts to real tasks
  const handleConvertToTask = (title: string, notes: string) => {
    const newTask: BusinessTask = {
      id: `task_${Date.now()}`,
      title,
      scope: 'personal',
      pillar: 'emocional',
      priority: 'important',
      status: 'inbox',
      isDelegated: false,
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Personal', 'VómitoMental']
    };
    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  };

  // Create custom ritual
  const handleCreateRitual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const ritual: CustomRitual = {
      id: `cr_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Ritual personalizado de bienestar.',
      durationMinutes: newMinutes,
      icon: 'Sparkles',
      steps: newSteps.trim() ? newSteps.split('\n').filter(Boolean) : ['Respira y enfócate.']
    };

    onUpdateData((prev) => ({
      ...prev,
      customRituals: [...(prev.customRituals || []), ritual]
    }));

    setNewTitle('');
    setNewDesc('');
    setNewMinutes(10);
    setNewSteps('');
    setShowNewRitualModal(false);
  };

  // Delete log
  const handleDeleteLog = (logId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      personalLogs: (prev.personalLogs || []).filter((l: PersonalRitualLog) => l.id !== logId)
    }));
  };

  // Delete custom ritual
  const handleDeleteCustomRitual = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      customRituals: (prev.customRituals || []).filter((r: CustomRitual) => r.id !== id)
    }));
  };

  const totalLogs = logs.length;
  const burnedCount = logs.filter((l: PersonalRitualLog) => l.actionTaken === 'burned').length;
  const spaceCount = logs.filter((l: PersonalRitualLog) => l.type === 'space_cleaning').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card - Apple Liquid Glass */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Heart className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Personal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Espacio íntimo de descompresión, rituales de orden y claridad mental.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRitualModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] hover:bg-slate-300/80 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-500" />
            <span>Crear Ritual Propio</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Rituales Completados
          </span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight block mt-1">
            {totalLogs}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Sesiones de recuperación registradas
          </span>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Pensamientos Soltados
          </span>
          <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight block mt-1 flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-orange-500" />
            {burnedCount}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Catarsis liberadas sin rumiación
          </span>
        </div>

        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            Limpiezas de Espacio
          </span>
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight block mt-1 flex items-center gap-1.5">
            <Home className="w-5 h-5 text-indigo-500" />
            {spaceCount}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Santuarios físicos recuperados
          </span>
        </div>
      </div>

      {/* Main 3 Featured Rituals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Vómito de Pensamientos */}
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-rose-500/25 shadow-lg dark:shadow-2xl flex flex-col justify-between space-y-4 hover:border-rose-500/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300">
                10 min
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Vómito de Pensamientos
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Descarga mental sin filtros ni corrección. Vuelca frustraciones, miedos o pendientes hasta sentir la cabeza liviana.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Escritura a pantalla limpia y temporizador zen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>Opción de quemar/soltar simbólicamente</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowBrainDumpModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Vómito de Pensamientos</span>
          </button>
        </div>

        {/* Card 2: Limpieza de mi Cuarto */}
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-indigo-500/25 shadow-lg dark:shadow-2xl flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                15 min
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Limpieza de mi Cuarto & Espacio
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                El caos exterior nubla el interior. 4 fases rápidas para ventilar, tender cama, despejar escritorio y sellar con paz sensorial.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Método de las 3 Cajas sin titubeos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Checklist guiado y campanas armónicas</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCleaningModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Ritual de Limpieza</span>
          </button>
        </div>

        {/* Card 3: Reset Mental & Respiración Cuántica */}
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-emerald-500/25 shadow-lg dark:shadow-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                3 min
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Reset Mental & Respiración
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Técnica 4-7-8 para desactivar la sobrecarga del sistema nervioso y recuperar el centro de tu energía en minutos.
              </p>
            </div>

            {/* Interactive Breath Circle */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-1000 border-2 ${
                  isBreathing
                    ? breathPhase === 'Inhala'
                      ? 'scale-110 bg-emerald-500/20 border-emerald-500'
                      : breathPhase === 'Sostén'
                      ? 'scale-105 bg-amber-500/20 border-amber-500'
                      : 'scale-90 bg-indigo-500/20 border-indigo-500'
                    : 'bg-slate-100 dark:bg-white/[0.05] border-slate-300 dark:border-white/[0.1]'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isBreathing ? breathPhase : 'Listo'}
                </span>
                {isBreathing && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {breathSeconds}s
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsBreathing((prev) => !prev);
              if (!isBreathing) {
                setBreathPhase('Inhala');
                setBreathSeconds(4);
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isBreathing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isBreathing ? 'Pausar Respiración' : 'Iniciar Respiración 4-7-8'}</span>
          </button>
        </div>
      </div>

      {/* Custom Rituals Section */}
      {customRituals.length > 0 && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tus Rituales Personales Guardados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rutinas a medida para desconectar y recargar.
              </p>
            </div>
            <button
              onClick={() => setShowNewRitualModal(true)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir ritual</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRituals.map((ritual: CustomRitual) => (
              <div
                key={ritual.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {ritual.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-white/[0.08] px-2 py-0.5 rounded-lg">
                      {ritual.durationMinutes}m
                    </span>
                    <button
                      onClick={() => handleDeleteCustomRitual(ritual.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {ritual.description}
                </p>

                {ritual.steps && ritual.steps.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-white/[0.06]">
                    {ritual.steps.map((st: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History of Completed Rituals */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Historial de Catarsis & Rituales Realizados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro íntimo de tus sesiones de liberación mental y armonización física.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Heart className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs">No hay rituales registrados aún. Inicia tu primera sesión arriba.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log: PersonalRitualLog) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      log.type === 'brain_dump'
                        ? 'bg-rose-500/15 text-rose-500'
                        : log.type === 'space_cleaning'
                        ? 'bg-indigo-500/15 text-indigo-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {log.type === 'brain_dump' ? (
                      <Flame className="w-4 h-4" />
                    ) : log.type === 'space_cleaning' ? (
                      <Home className="w-4 h-4" />
                    ) : (
                      <Wind className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {log.title}
                      </span>
                      {log.actionTaken === 'burned' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-300">
                          Quemado / Liberado
                        </span>
                      )}
                      {log.actionTaken === 'archived' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          Archivado
                        </span>
                      )}
                      {log.actionTaken === 'converted_to_task' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300">
                          Tarea Creada
                        </span>
                      )}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {log.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{new Date(log.completedAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>{log.durationMinutes} minutos</span>
                      {log.rating && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                            ★ {log.rating}/5
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors self-end sm:self-center cursor-pointer"
                  title="Eliminar registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Brain Dump */}
      {showBrainDumpModal && (
        <BrainDumpModal
          onClose={() => setShowBrainDumpModal(false)}
          onSaveLog={handleSaveLog}
          onConvertToTask={handleConvertToTask}
        />
      )}

      {/* Modal 2: Space Cleaning */}
      {showCleaningModal && (
        <SpaceCleaningModal
          onClose={() => setShowCleaningModal(false)}
          onSaveLog={handleSaveLog}
        />
      )}

      {/* Modal 3: Create Custom Ritual */}
      {showNewRitualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl backdrop-blur-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.12] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Crear Nuevo Ritual Personal
              </h3>
              <button
                onClick={() => setShowNewRitualModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRitual} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Ritual
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Limpieza profunda de auto, Desconexión de domingo..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción o Propósito
                </label>
                <input
                  type="text"
                  placeholder="¿Por qué este ritual te devuelve la calma?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Duración sugerida (Minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pasos de Acción (uno por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Poner teléfono en silencio&#10;2. Recoger objetos fuera de sitio&#10;3. Agradecer el espacio"
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRitualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  Guardar Ritual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
