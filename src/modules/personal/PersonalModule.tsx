import React, { useState } from 'react';
import {
  Sparkles,
  Home,
  Flame,
  Wind,
  Plus,
  CheckCircle2,
  Play,
  Pause,
  Trash2,
  Heart,
  X,
  ArrowUp,
  ArrowDown,
  Edit3,
  Clock,
  Check,
  Circle,
  RotateCcw,
} from 'lucide-react';
import { zenAudio } from '../../utils/audio';
import {
  PersonalRitualLog,
  CustomRitual,
  BusinessTask,
  RitualPhase,
  RitualField,
  CleaningStepItem,
} from '../../types';
import { AppStoreData } from '../../services/storage';
import { BrainDumpModal } from './BrainDumpModal';
import { SpaceCleaningModal } from './SpaceCleaningModal';

interface PersonalModuleProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onOpenQuickCapture?: () => void;
}

const buildDefaultPhases = (ritual: CustomRitual): RitualPhase[] => {
  if (ritual.phases && ritual.phases.length > 0) return ritual.phases;
  return [
    {
      id: `ph_${ritual.id}_1`,
      title: ritual.title,
      subtitle: ritual.description,
      durationMinutes: ritual.durationMinutes,
      instructions: ritual.steps.length > 0 ? ritual.steps : ['Enfócate con presencia en este paso.'],
      fields: [
        {
          id: `fld_${ritual.id}_chk`,
          type: 'checkboxes',
          label: 'Pasos de ejecución',
          options: ritual.steps.length > 0 ? ritual.steps : ['Paso principal completado'],
        },
        {
          id: `fld_${ritual.id}_note`,
          type: 'text',
          label: 'Nota de cierre',
          placeholder: '¿Cómo te sientes al finalizar?',
        },
      ],
    },
  ];
};

export const PersonalModule: React.FC<PersonalModuleProps> = ({
  data,
  onUpdateData,
}) => {
  const [showBrainDumpModal, setShowBrainDumpModal] = useState<boolean>(false);
  const [showCleaningModal, setShowCleaningModal] = useState<boolean>(false);
  const [showRitualStudioModal, setShowRitualStudioModal] = useState<boolean>(false);

  // Breathwork state (unchanged)
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Sostén' | 'Exhala'>('Inhala');
  const [breathSeconds, setBreathSeconds] = useState<number>(4);

  const logs = data.personalLogs || [];
  const customRituals = data.customRituals || [];
  const cleaningSteps = data.cleaningSteps || [];

  // Custom Ritual Studio State (Runner + Interactive Phase/Field Builder)
  const [studioMode, setStudioMode] = useState<'run' | 'edit'>('run');
  const [selectedRitualId, setSelectedRitualId] = useState<string>(customRituals[0]?.id || '');
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(0);
  const [ritualResponses, setRitualResponses] = useState<Record<string, unknown>>({});

  // Draft state for editing or creating a custom ritual
  const [draftRitual, setDraftRitual] = useState<CustomRitual | null>(null);

  // Minute-based countdown timer for running custom rituals
  const [ritualTimerSecondsLeft, setRitualTimerSecondsLeft] = useState<number>(0);
  const [ritualTimerRunning, setRitualTimerRunning] = useState<boolean>(false);
  const [ritualTimerTotalSeconds, setRitualTimerTotalSeconds] = useState<number>(600);

  React.useEffect(() => {
    if (!ritualTimerRunning) return;
    const interval = setInterval(() => {
      setRitualTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setRitualTimerRunning(false);
          zenAudio.playTransitionChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ritualTimerRunning]);

  const initRitualTimer = (minutes: number) => {
    const secs = Math.max(1, Math.round(minutes || 10)) * 60;
    setRitualTimerTotalSeconds(secs);
    setRitualTimerSecondsLeft(secs);
    setRitualTimerRunning(false);
  };

  const formatTimerMMSS = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Breathwork loop
  React.useEffect(() => {
    if (!isBreathing) return;
    let timer: ReturnType<typeof setTimeout>;

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

  const handleSaveLog = (logData: Omit<PersonalRitualLog, 'id' | 'completedAt'>) => {
    const newLog: PersonalRitualLog = {
      ...logData,
      id: `pl_${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    onUpdateData((prev) => ({
      ...prev,
      personalLogs: [newLog, ...(prev.personalLogs || [])],
    }));
  };

  const handleConvertToTask = (title: string) => {
    const newTask: BusinessTask = {
      id: `task_${Date.now()}`,
      title,
      scope: 'personal',
      pillar: 'emocional',
      priority: 'important',
      status: 'inbox',
      isDelegated: false,
      dueDate: new Date().toISOString().split('T')[0],
      tags: ['Personal', 'VómitoMental'],
    };
    onUpdateData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const handleUpdateCleaningSteps = (updatedSteps: CleaningStepItem[]) => {
    onUpdateData((prev) => ({
      ...prev,
      cleaningSteps: updatedSteps,
    }));
  };

  const handleDeleteLog = (logId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      personalLogs: (prev.personalLogs || []).filter((l: PersonalRitualLog) => l.id !== logId),
    }));
  };

  // --- Custom Ritual Studio Logic ---
  const openStudioToManageOrRun = () => {
    const initial = customRituals.find((r) => r.id === selectedRitualId) || customRituals[0];
    if (initial) {
      setSelectedRitualId(initial.id);
      setStudioMode('run');
      initRitualTimer(initial.durationMinutes || 10);
    } else {
      startCreateNewRitual();
    }
    setActivePhaseIdx(0);
    setRitualResponses({});
    setShowRitualStudioModal(true);
  };

  const openStudioToCreateNew = () => {
    startCreateNewRitual();
    setActivePhaseIdx(0);
    setRitualResponses({});
    setRitualTimerRunning(false);
    setShowRitualStudioModal(true);
  };

  const startCreateNewRitual = () => {
    const blank: CustomRitual = {
      id: `cr_${Date.now()}`,
      title: 'Nuevo Ritual Personal',
      description: 'Rutina guiada por fases y campos interactivos.',
      durationMinutes: 10,
      icon: 'Sparkles',
      steps: ['Preparar ambiente y enfoque'],
      phases: [
        {
          id: `ph_${Date.now()}`,
          title: 'Fase 1 · Preparación',
          subtitle: 'Define el propósito de este paso',
          durationMinutes: 5,
          instructions: ['Respira hondo y elimina distracciones.'],
          fields: [
            {
              id: `fld_${Date.now()}_1`,
              type: 'checkboxes',
              label: 'Lista de verificación',
              options: ['Paso 1 completado', 'Paso 2 completado'],
            },
            {
              id: `fld_${Date.now()}_2`,
              type: 'text',
              label: 'Observación rápida',
              placeholder: 'Escribe una nota breve...',
            },
          ],
        },
      ],
    };
    setDraftRitual(blank);
    setStudioMode('edit');
  };

  const startEditSelectedRitual = (ritual: CustomRitual) => {
    setDraftRitual({
      ...ritual,
      phases: JSON.parse(JSON.stringify(buildDefaultPhases(ritual))),
    });
    setStudioMode('edit');
  };

  const handleSaveDraftRitual = () => {
    if (!draftRitual || !draftRitual.title.trim()) return;
    const totalPhaseMins = (draftRitual.phases || []).reduce((acc, p) => acc + (p.durationMinutes || 0), 0);
    const explicitMins = Number(draftRitual.durationMinutes) || 0;
    const finalMinutes = explicitMins > 0 ? explicitMins : totalPhaseMins > 0 ? totalPhaseMins : 10;
    const cleaned: CustomRitual = {
      ...draftRitual,
      title: draftRitual.title.trim(),
      durationMinutes: finalMinutes,
      steps: (draftRitual.phases || []).map((p) => p.title),
    };

    onUpdateData((prev) => {
      const exists = (prev.customRituals || []).some((r) => r.id === cleaned.id);
      return {
        ...prev,
        customRituals: exists
          ? (prev.customRituals || []).map((r) => (r.id === cleaned.id ? cleaned : r))
          : [...(prev.customRituals || []), cleaned],
      };
    });
    setSelectedRitualId(cleaned.id);
    setActivePhaseIdx(0);
    initRitualTimer(cleaned.durationMinutes);
    setStudioMode('run');
    setDraftRitual(null);
  };

  const handleDeleteCustomRitual = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      customRituals: (prev.customRituals || []).filter((r) => r.id !== id),
    }));
    const remaining = customRituals.filter((r) => r.id !== id);
    setSelectedRitualId(remaining[0]?.id || '');
    setStudioMode(remaining.length > 0 ? 'run' : 'edit');
  };

  const activeRitual =
    customRituals.find((r) => r.id === selectedRitualId) || customRituals[0];
  const activePhases = activeRitual ? buildDefaultPhases(activeRitual) : [];
  const safePhaseIdx = Math.min(activePhaseIdx, Math.max(activePhases.length - 1, 0));
  const currentPhase = activePhases[safePhaseIdx];

  const handleToggleCheckboxOption = (fieldId: string, option: string) => {
    const prevList = Array.isArray(ritualResponses[fieldId])
      ? (ritualResponses[fieldId] as string[])
      : [];
    const exists = prevList.includes(option);
    setRitualResponses((prev) => ({
      ...prev,
      [fieldId]: exists ? prevList.filter((o) => o !== option) : [...prevList, option],
    }));
  };

  const handleCompleteCustomRitual = () => {
    if (!activeRitual) return;
    const summaryNotes = Object.values(ritualResponses)
      .flatMap((v) => (Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? [v] : []))
      .slice(0, 5)
      .join(' · ');

    handleSaveLog({
      type: 'custom',
      title: activeRitual.title,
      durationMinutes: activeRitual.durationMinutes,
      notes: summaryNotes || `${activeRitual.title} completado en ${activePhases.length} fases.`,
      rating: 5,
      actionTaken: 'archived',
    });
    setShowRitualStudioModal(false);
    setRitualResponses({});
    setActivePhaseIdx(0);
  };

  // Draft phase & field editing helpers
  const updateDraftPhase = (phaseIdx: number, patch: Partial<RitualPhase>) => {
    if (!draftRitual) return;
    const phases = [...(draftRitual.phases || [])];
    phases[phaseIdx] = { ...phases[phaseIdx], ...patch };
    setDraftRitual({ ...draftRitual, phases });
  };

  const addDraftPhase = () => {
    if (!draftRitual) return;
    const nextNum = (draftRitual.phases?.length || 0) + 1;
    const newPhase: RitualPhase = {
      id: `ph_${Date.now()}`,
      title: `Fase ${nextNum} · Nueva Etapa`,
      subtitle: 'Descripción breve',
      durationMinutes: 5,
      instructions: ['Indicaciones para esta etapa'],
      fields: [
        {
          id: `fld_${Date.now()}`,
          type: 'checkboxes',
          label: 'Checklist',
          options: ['Acción A', 'Acción B'],
        },
      ],
    };
    setDraftRitual({ ...draftRitual, phases: [...(draftRitual.phases || []), newPhase] });
  };

  const moveDraftPhase = (idx: number, dir: -1 | 1) => {
    if (!draftRitual || !draftRitual.phases) return;
    const target = idx + dir;
    if (target < 0 || target >= draftRitual.phases.length) return;
    const next = [...draftRitual.phases];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setDraftRitual({ ...draftRitual, phases: next });
  };

  const deleteDraftPhase = (idx: number) => {
    if (!draftRitual || !draftRitual.phases || draftRitual.phases.length <= 1) return;
    setDraftRitual({
      ...draftRitual,
      phases: draftRitual.phases.filter((_, i) => i !== idx),
    });
  };

  const addFieldToPhase = (phaseIdx: number, type: RitualField['type']) => {
    if (!draftRitual || !draftRitual.phases) return;
    const field: RitualField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label:
        type === 'checkboxes'
          ? 'Checklist de pasos'
          : type === 'bullets'
          ? 'Lista de puntos'
          : type === 'textarea'
          ? 'Reflexión detallada'
          : 'Respuesta breve',
      placeholder: 'Escribe aquí...',
      options: type === 'checkboxes' ? ['Opción 1', 'Opción 2'] : undefined,
    };
    const phases = [...draftRitual.phases];
    phases[phaseIdx] = {
      ...phases[phaseIdx],
      fields: [...phases[phaseIdx].fields, field],
    };
    setDraftRitual({ ...draftRitual, phases });
  };

  const updatePhaseField = (phaseIdx: number, fieldIdx: number, patch: Partial<RitualField>) => {
    if (!draftRitual || !draftRitual.phases) return;
    const phases = [...draftRitual.phases];
    const fields = [...phases[phaseIdx].fields];
    fields[fieldIdx] = { ...fields[fieldIdx], ...patch };
    phases[phaseIdx] = { ...phases[phaseIdx], fields };
    setDraftRitual({ ...draftRitual, phases });
  };

  const removePhaseField = (phaseIdx: number, fieldIdx: number) => {
    if (!draftRitual || !draftRitual.phases) return;
    const phases = [...draftRitual.phases];
    phases[phaseIdx] = {
      ...phases[phaseIdx],
      fields: phases[phaseIdx].fields.filter((_, i) => i !== fieldIdx),
    };
    setDraftRitual({ ...draftRitual, phases });
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
              Espacio íntimo de descompresión, rituales de orden, autocuidado y claridad mental.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openStudioToManageOrRun}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] hover:bg-slate-300/80 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-rose-500" />
            <span>Modificar Rituales ({customRituals.length})</span>
          </button>

          <button
            type="button"
            onClick={openStudioToCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
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
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight block mt-1 tabular-nums">
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
          <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 tracking-tight block mt-1 flex items-center gap-1.5 tabular-nums">
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
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight block mt-1 flex items-center gap-1.5 tabular-nums">
            <Home className="w-5 h-5 text-indigo-500" />
            {spaceCount}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Santuarios físicos recuperados
          </span>
        </div>
      </div>

      {/* Main 3 Featured Rituals (EXACT COLORS PRESERVED) */}
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
                El caos exterior nubla el interior. {cleaningSteps.length} fases editables para ventilar, tender cama, despejar escritorio y sellar con paz sensorial.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Método editable de las 3 Cajas sin titubeos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Checklist guiado, reordenamiento y campanas</span>
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

        {/* Card 3: Reset Mental & Respiración Cuántica (UNMODIFIED) */}
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

      {/* History of Completed Rituals */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Historial de Catarsis & Rituales Realizados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registro íntimo de tus sesiones de liberación mental, limpieza y rituales propios.
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
                        : log.type === 'custom'
                        ? 'bg-pink-500/15 text-pink-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {log.type === 'brain_dump' ? (
                      <Flame className="w-4 h-4" />
                    ) : log.type === 'space_cleaning' ? (
                      <Home className="w-4 h-4" />
                    ) : log.type === 'custom' ? (
                      <Sparkles className="w-4 h-4" />
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
                          Completado
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

      {/* Modal 1: Brain Dump (Unchanged) */}
      {showBrainDumpModal && (
        <BrainDumpModal
          onClose={() => setShowBrainDumpModal(false)}
          onSaveLog={handleSaveLog}
          onConvertToTask={handleConvertToTask}
        />
      )}

      {/* Modal 2: Space Cleaning (Editable Phases) */}
      {showCleaningModal && (
        <SpaceCleaningModal
          steps={cleaningSteps}
          onUpdateSteps={handleUpdateCleaningSteps}
          onClose={() => setShowCleaningModal(false)}
          onSaveLog={handleSaveLog}
        />
      )}

      {/* Modal 3: Interactive Custom Ritual Studio (Builder & Runner) */}
      {showRitualStudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-2xl animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-rose-500/30 dark:border-white/[0.12] p-6 md:p-7 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Estudio de Rituales Propios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ejecuta tus rutinas interactivas por fases o diseña nuevas con campos a medida.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {studioMode === 'edit' && customRituals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftRitual(null);
                      setStudioMode('run');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Ver Lista de Rituales
                  </button>
                )}
                <button
                  onClick={() => setShowRitualStudioModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Selector of Saved Custom Rituals (inside Studio) */}
            {customRituals.length > 0 && studioMode === 'run' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {customRituals.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRitualId(r.id);
                        setActivePhaseIdx(0);
                        setRitualResponses({});
                        initRitualTimer(r.durationMinutes || 10);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeRitual?.id === r.id
                          ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>

                {activeRitual && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEditSelectedRitual(activeRitual)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-rose-500/40 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Editar Fases</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCustomRitual(activeRitual.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Eliminar ritual"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RUN MODE */}
            {studioMode === 'run' && activeRitual && currentPhase && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeRitual.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeRitual.description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeRitual.durationMinutes} min configurados
                  </span>
                </div>

                {/* Live Minute Timer Bar for Custom Ritual */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-black/40 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 font-extrabold text-sm tabular-nums">
                      {formatTimerMMSS(ritualTimerSecondsLeft)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Temporizador del Ritual ({Math.round(ritualTimerTotalSeconds / 60)} min)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ritualTimerRunning
                          ? 'En curso · Campana suave al finalizar'
                          : ritualTimerSecondsLeft === 0
                          ? 'Tiempo completado'
                          : 'Pausado · Ajusta o inicia cuando estés listo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRitualTimerSecondsLeft((s) => Math.max(0, s - 15))}
                      className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => setRitualTimerSecondsLeft((s) => s + 15)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      +15s
                    </button>
                    <button
                      type="button"
                      onClick={() => setRitualTimerSecondsLeft((s) => s + 60)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      +1 min
                    </button>
                    <button
                      type="button"
                      onClick={() => initRitualTimer(activeRitual.durationMinutes || 10)}
                      className="p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="Reiniciar temporizador"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRitualTimerRunning((r) => !r)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {ritualTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{ritualTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                    </button>
                  </div>
                </div>

                {/* Phase Tabs */}
                <div className="flex flex-wrap gap-2">
                  {activePhases.map((ph, idx) => (
                    <button
                      key={ph.id}
                      onClick={() => setActivePhaseIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        idx === safePhaseIdx
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-slate-50 dark:bg-black/30 border-slate-200 dark:border-white/[0.06] text-slate-500'
                      }`}
                    >
                      {idx + 1}. {ph.title}
                    </button>
                  ))}
                </div>

                {/* Current Phase Interactive Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200/90 dark:border-white/[0.08] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentPhase.title}
                      </h5>
                      {currentPhase.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {currentPhase.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {currentPhase.durationMinutes} min
                    </span>
                  </div>

                  {currentPhase.instructions.length > 0 && (
                    <div className="space-y-1 p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/[0.05]">
                      {currentPhase.instructions.map((inst, i) => (
                        <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{inst}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Fields */}
                  <div className="space-y-3">
                    {currentPhase.fields.map((field) => {
                      const val = ritualResponses[field.id];
                      return (
                        <div key={field.id} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                            {field.label}
                          </label>

                          {field.type === 'checkboxes' && (
                            <div className="space-y-1.5">
                              {(field.options || []).map((opt) => {
                                const checked = Array.isArray(val) && val.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleToggleCheckboxOption(field.id, opt)}
                                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                      checked
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-semibold'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {checked ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                                    )}
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {field.type === 'text' && (
                            <input
                              type="text"
                              value={typeof val === 'string' ? val : ''}
                              onChange={(e) =>
                                setRitualResponses((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              placeholder={field.placeholder || 'Escribe aquí...'}
                              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white"
                            />
                          )}

                          {(field.type === 'textarea' || field.type === 'bullets') && (
                            <textarea
                              rows={3}
                              value={typeof val === 'string' ? val : ''}
                              onChange={(e) =>
                                setRitualResponses((prev) => ({ ...prev, [field.id]: e.target.value }))
                              }
                              placeholder={
                                field.placeholder ||
                                (field.type === 'bullets' ? 'Escribe un punto por línea...' : 'Escribe tus notas...')
                              }
                              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={safePhaseIdx === 0}
                    onClick={() => setActivePhaseIdx((p) => Math.max(0, p - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer"
                  >
                    ← Fase Anterior
                  </button>

                  {safePhaseIdx < activePhases.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActivePhaseIdx((p) => p + 1)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md cursor-pointer"
                    >
                      Siguiente Fase →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCompleteCustomRitual}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Completar y Guardar en Historial</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* EDIT / CREATE MODE */}
            {studioMode === 'edit' && draftRitual && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Nombre del Ritual
                    </label>
                    <input
                      type="text"
                      value={draftRitual.title}
                      onChange={(e) => setDraftRitual({ ...draftRitual, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Propósito breve
                    </label>
                    <input
                      type="text"
                      value={draftRitual.description}
                      onChange={(e) =>
                        setDraftRitual({ ...draftRitual, description: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Temporizador (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={draftRitual.durationMinutes || 10}
                      onChange={(e) =>
                        setDraftRitual({ ...draftRitual, durationMinutes: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Phases Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Fases & Campos Interactivos ({draftRitual.phases?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={addDraftPhase}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Fase</span>
                    </button>
                  </div>

                  {(draftRitual.phases || []).map((ph, pIdx) => (
                    <div
                      key={ph.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          Fase #{pIdx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveDraftPhase(pIdx, -1)}
                            disabled={pIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDraftPhase(pIdx, 1)}
                            disabled={pIdx === (draftRitual.phases?.length || 1) - 1}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {(draftRitual.phases?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteDraftPhase(pIdx)}
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={ph.title}
                          onChange={(e) => updateDraftPhase(pIdx, { title: e.target.value })}
                          placeholder="Título de la fase"
                          className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={ph.subtitle || ''}
                          onChange={(e) => updateDraftPhase(pIdx, { subtitle: e.target.value })}
                          placeholder="Subtítulo"
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={ph.durationMinutes}
                          onChange={(e) =>
                            updateDraftPhase(pIdx, { durationMinutes: Number(e.target.value) })
                          }
                          placeholder="Min"
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Phase Fields */}
                      <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Campos de la fase:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => addFieldToPhase(pIdx, 'checkboxes')}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold cursor-pointer"
                            >
                              + Checklist
                            </button>
                            <button
                              type="button"
                              onClick={() => addFieldToPhase(pIdx, 'text')}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold cursor-pointer"
                            >
                              + Texto Corto
                            </button>
                            <button
                              type="button"
                              onClick={() => addFieldToPhase(pIdx, 'textarea')}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold cursor-pointer"
                            >
                              + Notas / Diario
                            </button>
                          </div>
                        </div>

                        {ph.fields.map((fld, fIdx) => (
                          <div
                            key={fld.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-rose-500">
                                {fld.type}
                              </span>
                              <input
                                type="text"
                                value={fld.label}
                                onChange={(e) =>
                                  updatePhaseField(pIdx, fIdx, { label: e.target.value })
                                }
                                placeholder="Etiqueta del campo"
                                className="flex-1 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => removePhaseField(pIdx, fIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {fld.type === 'checkboxes' && (
                              <input
                                type="text"
                                value={(fld.options || []).join(', ')}
                                onChange={(e) =>
                                  updatePhaseField(pIdx, fIdx, {
                                    options: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                                placeholder="Opciones separadas por coma (Ej: Limpiador, Sérum, Hidratante)"
                                className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {customRituals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftRitual(null);
                        setStudioMode('run');
                      }}
                      className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveDraftRitual}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Ritual Interactivo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
