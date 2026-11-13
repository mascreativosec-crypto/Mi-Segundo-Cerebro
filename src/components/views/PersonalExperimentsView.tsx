import React, { useEffect, useMemo, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import {
  ExperimentFieldDef,
  ExperimentFieldType,
  ExperimentLogEntry,
  PersonalExperiment,
  PillarKey,
} from '../../types';
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Circle,
  Sliders,
  Mic,
  ArrowUpRight,
  Send,
  RefreshCw,
  Calendar,
  Hash,
  Type as TypeIcon,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  BarChart3,
  Upload,
  FileText,
} from 'lucide-react';

interface PersonalExperimentsViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate: (view: string) => void;
}

type ExpColorKey = NonNullable<PersonalExperiment['inspirationColor']>;

const EXP_COLOR_MAP: Record<
  ExpColorKey,
  {
    label: string;
    swatch: string;
    badge: string;
    selectedCard: string;
    gradient: string;
    bar: string;
    text: string;
  }
> = {
  fuchsia: {
    label: 'Fucsia',
    swatch: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25',
    selectedCard: 'bg-fuchsia-500/[0.08] dark:bg-fuchsia-950/30 border-fuchsia-500/50 ring-2 ring-fuchsia-500/20',
    gradient: 'from-fuchsia-600 to-purple-600',
    bar: 'bg-gradient-to-r from-fuchsia-500 to-purple-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
  indigo: {
    label: 'Índigo',
    swatch: 'bg-indigo-500',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
    selectedCard: 'bg-indigo-500/[0.08] dark:bg-indigo-950/30 border-indigo-500/50 ring-2 ring-indigo-500/20',
    gradient: 'from-indigo-600 to-blue-600',
    bar: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    label: 'Esmeralda',
    swatch: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    selectedCard: 'bg-emerald-500/[0.08] dark:bg-emerald-950/30 border-emerald-500/50 ring-2 ring-emerald-500/20',
    gradient: 'from-emerald-600 to-teal-600',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    label: 'Ámbar',
    swatch: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
    selectedCard: 'bg-amber-500/[0.08] dark:bg-amber-950/30 border-amber-500/50 ring-2 ring-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    label: 'Rosa',
    swatch: 'bg-rose-500',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
    selectedCard: 'bg-rose-500/[0.08] dark:bg-rose-950/30 border-rose-500/50 ring-2 ring-rose-500/20',
    gradient: 'from-rose-600 to-pink-600',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    label: 'Cian',
    swatch: 'bg-cyan-500',
    badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
    selectedCard: 'bg-cyan-500/[0.08] dark:bg-cyan-950/30 border-cyan-500/50 ring-2 ring-cyan-500/20',
    gradient: 'from-cyan-600 to-sky-600',
    bar: 'bg-gradient-to-r from-cyan-500 to-sky-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
};

const PILLAR_LABELS: Record<PillarKey, string> = {
  espiritual: 'Espiritual',
  emocional: 'Emocional',
  fisico: 'Físico',
  intelectual: 'Intelectual',
  financiero: 'Financiero',
};

const INSPIRATION_CHIPS = ['Isra García', 'Diego Dreyfus', 'Naval Ravikant', 'Propio'];

const EXPERIMENT_PRESETS: Array<{
  label: string;
  inspiration: string;
  inspirationColor: ExpColorKey;
  pillar: PillarKey;
  title: string;
  goalDescription: string;
  hypothesis: string;
  purpose: string;
  durationDays: number;
  dailySubtasks: string[];
  fields: ExperimentFieldDef[];
}> = [
  {
    label: 'Plantilla Isra García · Shock de Disciplina',
    inspiration: 'Isra García',
    inspirationColor: 'fuchsia',
    pillar: 'fisico',
    title: 'Protocolo Anti-Excusas & Alto Rendimiento (21 Días)',
    goalDescription:
      'Sostener 3 bloques diarios no negociables de incomodidad y foco antes de las 11:00 AM.',
    hypothesis:
      'Eliminar negociaciones mentales por la mañana y sostener 3 acciones incómodas diarias transforma mi nivel de ejecución.',
    purpose: 'Entrenar la voluntad mediante incomodidad voluntaria y métricas diarias objetivas.',
    durationDays: 21,
    dailySubtasks: ['Ducha fría', 'Bloque Deep Work', 'Cero azúcar', 'Acción incómoda'],
    fields: [
      { id: 'pf_progress', label: 'Avance Diario del Protocolo', type: 'percent_10', unit: '%' },
      { id: 'pf_timer', label: 'Tiempo Cronometrado de Foco', type: 'timer_minutes', unit: 'min' },
      { id: 'pf_energy', label: 'Nivel de Energía (1-10)', type: 'number', unit: 'pts' },
      { id: 'pf_cold', label: 'Ducha fría / Movimiento 06:30', type: 'checkbox' },
      { id: 'pf_action', label: 'Acción incómoda ejecutada', type: 'text', placeholder: '¿Qué evitabas hacer y hiciste hoy?' },
    ],
  },
  {
    label: 'Plantilla Diego Dreyfus · Coherencia del Ser',
    inspiration: 'Diego Dreyfus',
    inspirationColor: 'indigo',
    pillar: 'emocional',
    title: 'Experimento de Verdad Cruda & Coherencia (14 Días)',
    goalDescription:
      'Alinear mis promesas privadas con mi conducta diaria observando excusas en silencio.',
    hypothesis:
      'Cuando observo y documento mis excusas sin disfrazarlas, recupero paz mental y autoridad personal.',
    purpose: 'Alinear identidad, palabras y actos sin autoengaño.',
    durationDays: 14,
    dailySubtasks: ['Silencio 15 min', 'Cero quejas', 'Cumplir palabra', 'Escribir verdad'],
    fields: [
      { id: 'pd_progress', label: 'Coherencia Diaria (%)', type: 'percent_10', unit: '%' },
      { id: 'pd_silence', label: 'Silencio Cronometrado', type: 'timer_minutes', unit: 'min' },
      { id: 'pd_word', label: 'Cumplí mi palabra conmigo mismo', type: 'checkbox' },
      { id: 'pd_excuse', label: 'Excusa o miedo detectado', type: 'text', placeholder: '¿Qué mentira amable me conté hoy?' },
      { id: 'pd_truth', label: 'Decisión consciente tomada', type: 'text', placeholder: '¿Qué cambié en mi conducta?' },
    ],
  },
];

export const PersonalExperimentsView: React.FC<PersonalExperimentsViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const experiments = data.personalExperiments || [];
  const [selectedExpId, setSelectedExpId] = useState<string>(experiments[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'log' | 'compare' | 'fields' | 'mentor_notes'>('log');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create Experiment State
  const [newTitle, setNewTitle] = useState('');
  const [newInspiration, setNewInspiration] = useState<string>('Isra García');
  const [newInspirationColor, setNewInspirationColor] = useState<ExpColorKey>('fuchsia');
  const [newPillar, setNewPillar] = useState<PillarKey>('fisico');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newDuration, setNewDuration] = useState(21);
  const [newDailySubtasks, setNewDailySubtasks] = useState<string[]>([
    'Bloque principal completado',
    'Sin distracciones',
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [draftFields, setDraftFields] = useState<ExperimentFieldDef[]>([
    { id: 'df_pct', label: 'Avance del Día', type: 'percent_10', unit: '%' },
    { id: 'df_timer', label: 'Tiempo Enfocado', type: 'timer_minutes', unit: 'min' },
    { id: 'df_1', label: 'Nivel de Claridad (1-10)', type: 'number', unit: 'pts' },
    { id: 'df_3', label: 'Cambio mental o aprendizaje del día', type: 'text', placeholder: 'Describe el cambio observado...' },
  ]);
  const [draftFieldLabel, setDraftFieldLabel] = useState('');
  const [draftFieldType, setDraftFieldType] = useState<ExperimentFieldType>('text');
  const [draftFieldUnit, setDraftFieldUnit] = useState('');

  // Edit Active Experiment State
  const [isEditingExp, setIsEditingExp] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editInspiration, setEditInspiration] = useState('');
  const [editInspirationColor, setEditInspirationColor] = useState<ExpColorKey>('fuchsia');
  const [editPillar, setEditPillar] = useState<PillarKey>('fisico');
  const [editGoalDescription, setEditGoalDescription] = useState('');
  const [editHypothesis, setEditHypothesis] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editDurationDays, setEditDurationDays] = useState(21);

  // Add Field to existing Experiment state
  const [addFieldLabel, setAddFieldLabel] = useState('');
  const [addFieldType, setAddFieldType] = useState<ExperimentFieldType>('number');
  const [addFieldUnit, setAddFieldUnit] = useState('');

  // Daily Log Entry state + Subtasks + 10%-step Progress + Interactive Minute Timer
  const todayStr = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(todayStr);
  const [logValues, setLogValues] = useState<Record<string, string | number | boolean>>({});
  const [logCompletedSubtasks, setLogCompletedSubtasks] = useState<string[]>([]);
  const [quickSubtaskDraft, setQuickSubtaskDraft] = useState('');
  const [logReflection, setLogReflection] = useState('');

  // Minute timer for Daily Log Form
  const [timerTargetMinutes, setTimerTargetMinutes] = useState(15);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(15 * 60);
  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // AI Coach state + Template-to-Experiment converter
  const [coachQuestion, setCoachQuestion] = useState('');
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [coachMode, setCoachMode] = useState<'analyze' | 'template'>('analyze');
  const [templateInputText, setTemplateInputText] = useState('');
  const [templateCustomTitle, setTemplateCustomTitle] = useState('');
  const [isConvertingTemplate, setIsConvertingTemplate] = useState(false);
  const [templateDraftPreview, setTemplateDraftPreview] = useState<{
    title: string;
    inspiration: string;
    inspirationColor: ExpColorKey;
    pillar: PillarKey;
    goalDescription: string;
    hypothesis: string;
    purpose: string;
    durationDays: number;
    dailySubtasks: string[];
    fields: ExperimentFieldDef[];
  } | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerElapsedSeconds((e) => e + 1);
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const activeExp =
    experiments.find((e) => e.id === selectedExpId) || experiments[0] || null;
  const activeColor = EXP_COLOR_MAP[activeExp?.inspirationColor || 'fuchsia'];

  const linkedMentorNotes = useMemo(() => {
    if (!activeExp) return [];
    const ids = new Set(activeExp.linkedDecisionIds || []);
    return data.strategicDecisions.filter(
      (d) => d.experimentId === activeExp.id || ids.has(d.id)
    );
  }, [activeExp, data.strategicDecisions]);

  const sortedLogs = useMemo(() => {
    if (!activeExp) return [];
    return [...activeExp.logs].sort((a, b) => a.date.localeCompare(b.date));
  }, [activeExp]);

  // Comparison calculations (Baseline vs Latest + Averages)
  const comparisonStats = useMemo(() => {
    if (!activeExp) return { numeric: [], checkboxes: [] };

    const numericFields = activeExp.fields.filter(
      (f) => f.type === 'number' || f.type === 'percent_10' || f.type === 'timer_minutes'
    );
    const checkboxFields = activeExp.fields.filter((f) => f.type === 'checkbox');

    const numeric = numericFields.map((fld) => {
      const vals = sortedLogs
        .map((l) => {
          const raw = l.values[fld.id];
          const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
          return Number.isFinite(num) ? { date: l.date, val: num } : null;
        })
        .filter((x): x is { date: string; val: number } => x !== null);

      const first = vals[0]?.val ?? null;
      const latest = vals[vals.length - 1]?.val ?? null;
      const avg =
        vals.length > 0
          ? Math.round((vals.reduce((acc, v) => acc + v.val, 0) / vals.length) * 10) / 10
          : null;
      const delta =
        first !== null && latest !== null ? Math.round((latest - first) * 10) / 10 : null;

      return { field: fld, first, latest, avg, delta, count: vals.length };
    });

    const checkboxes = checkboxFields.map((fld) => {
      const total = sortedLogs.length;
      const done = sortedLogs.filter((l) => Boolean(l.values[fld.id])).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { field: fld, done, total, rate };
    });

    return { numeric, checkboxes };
  }, [activeExp, sortedLogs]);

  const applyPreset = (preset: (typeof EXPERIMENT_PRESETS)[number]) => {
    setNewTitle(preset.title);
    setNewInspiration(preset.inspiration);
    setNewInspirationColor(preset.inspirationColor);
    setNewPillar(preset.pillar);
    setNewGoalDescription(preset.goalDescription);
    setNewHypothesis(preset.hypothesis);
    setNewPurpose(preset.purpose);
    setNewDuration(preset.durationDays);
    setNewDailySubtasks([...preset.dailySubtasks]);
    setDraftFields(
      preset.fields.map((f, i) => ({ ...f, id: `fld_${Date.now()}_${i}` }))
    );
  };

  const handleAddDraftField = () => {
    if (!draftFieldLabel.trim()) return;
    setDraftFields((prev) => [
      ...prev,
      {
        id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        label: draftFieldLabel.trim(),
        type: draftFieldType,
        unit:
          draftFieldType === 'percent_10'
            ? '%'
            : draftFieldType === 'timer_minutes'
            ? 'min'
            : draftFieldType === 'number' && draftFieldUnit.trim()
            ? draftFieldUnit.trim()
            : undefined,
        placeholder: draftFieldType === 'text' ? 'Escribe tu observación...' : undefined,
      },
    ]);
    setDraftFieldLabel('');
    setDraftFieldUnit('');
  };

  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || draftFields.length === 0) return;

    const created: PersonalExperiment = {
      id: `exp_${Date.now()}`,
      title: newTitle.trim(),
      inspiration: newInspiration.trim() || 'Propio',
      inspirationColor: newInspirationColor,
      pillar: newPillar,
      goalDescription: newGoalDescription.trim() || undefined,
      hypothesis: newHypothesis.trim() || 'Medir impacto de cambios diarios sostenidos.',
      purpose: newPurpose.trim() || 'Evolución personal medible y consciente.',
      durationDays: Number(newDuration) || 21,
      startDate: todayStr,
      status: 'active',
      fields: draftFields,
      dailySubtasks: newDailySubtasks,
      logs: [],
      linkedDecisionIds: [],
    };

    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: [created, ...(prev.personalExperiments || [])],
    }));

    setSelectedExpId(created.id);
    setShowCreateForm(false);
    setNewTitle('');
    setNewGoalDescription('');
    setNewHypothesis('');
    setNewPurpose('');
    setActiveTab('log');
  };

  const openEditActiveExp = () => {
    if (!activeExp) return;
    setEditTitle(activeExp.title);
    setEditInspiration(activeExp.inspiration);
    setEditInspirationColor(activeExp.inspirationColor || 'fuchsia');
    setEditPillar(activeExp.pillar || 'fisico');
    setEditGoalDescription(activeExp.goalDescription || '');
    setEditHypothesis(activeExp.hypothesis);
    setEditPurpose(activeExp.purpose);
    setEditDurationDays(activeExp.durationDays);
    setIsEditingExp(true);
  };

  const handleSaveActiveExpEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExp || !editTitle.trim()) return;
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id
          ? {
              ...ex,
              title: editTitle.trim(),
              inspiration: editInspiration.trim() || 'Propio',
              inspirationColor: editInspirationColor,
              pillar: editPillar,
              goalDescription: editGoalDescription.trim() || undefined,
              hypothesis: editHypothesis.trim() || ex.hypothesis,
              purpose: editPurpose.trim() || ex.purpose,
              durationDays: Number(editDurationDays) || ex.durationDays,
            }
          : ex
      ),
    }));
    setIsEditingExp(false);
  };

  const handleDeleteExperiment = (id: string) => {
    const remaining = experiments.filter((e) => e.id !== id);
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).filter((e) => e.id !== id),
    }));
    if (selectedExpId === id) {
      setSelectedExpId(remaining[0]?.id || '');
    }
  };

  const handleToggleDailySubtask = (subLabel: string) => {
    if (!activeExp) return;
    const allSubs = activeExp.dailySubtasks || [];
    const exists = logCompletedSubtasks.includes(subLabel);
    const nextSubs = exists
      ? logCompletedSubtasks.filter((s) => s !== subLabel)
      : [...logCompletedSubtasks, subLabel];
    setLogCompletedSubtasks(nextSubs);

    if (allSubs.length > 0) {
      const pct10 = Math.min(100, Math.round(((nextSubs.length / allSubs.length) * 100) / 10) * 10);
      setLogValues((prev) => {
        const next: Record<string, string | number | boolean> = {
          ...prev,
          _daily_progress_10: pct10,
        };
        activeExp.fields.forEach((f) => {
          if (f.type === 'percent_10') {
            next[f.id] = pct10;
          }
        });
        return next;
      });
    }
  };

  const handleAddQuickSubtaskToActive = () => {
    if (!activeExp || !quickSubtaskDraft.trim()) return;
    const trimmed = quickSubtaskDraft.trim();
    const existing = activeExp.dailySubtasks || [];
    if (existing.includes(trimmed)) {
      setQuickSubtaskDraft('');
      return;
    }
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id
          ? { ...ex, dailySubtasks: [...(ex.dailySubtasks || []), trimmed] }
          : ex
      ),
    }));
    setQuickSubtaskDraft('');
  };

  const handleApplyTimerToForm = () => {
    if (!activeExp) return;
    const loggedMinutes =
      timerElapsedSeconds > 0
        ? Math.max(1, Math.round(timerElapsedSeconds / 60))
        : timerTargetMinutes;
    setLogValues((prev) => {
      const next: Record<string, string | number | boolean> = {
        ...prev,
        _daily_timer_min: loggedMinutes,
      };
      activeExp.fields.forEach((f) => {
        if (f.type === 'timer_minutes') {
          next[f.id] = loggedMinutes;
        }
      });
      return next;
    });
  };

  const handleAddLogEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExp) return;

    const cleanValues: Record<string, string | number | boolean> = {};
    activeExp.fields.forEach((f) => {
      const raw = logValues[f.id];
      if (f.type === 'number' || f.type === 'percent_10' || f.type === 'timer_minutes') {
        cleanValues[f.id] = raw !== undefined && raw !== '' ? Number(raw) : 0;
      } else if (f.type === 'checkbox') {
        cleanValues[f.id] = Boolean(raw);
      } else {
        cleanValues[f.id] = typeof raw === 'string' ? raw.trim() : '';
      }
    });

    const hasPercentField = activeExp.fields.some((f) => f.type === 'percent_10');
    if (!hasPercentField && logValues._daily_progress_10 !== undefined) {
      cleanValues._daily_progress_10 = Number(logValues._daily_progress_10) || 0;
    }
    const hasTimerField = activeExp.fields.some((f) => f.type === 'timer_minutes');
    if (!hasTimerField && (logValues._daily_timer_min !== undefined || timerElapsedSeconds >= 60)) {
      cleanValues._daily_timer_min =
        logValues._daily_timer_min !== undefined
          ? Number(logValues._daily_timer_min)
          : Math.max(1, Math.round(timerElapsedSeconds / 60));
    }

    const entry: ExperimentLogEntry = {
      id: `explog_${Date.now()}`,
      date: logDate || todayStr,
      dayNumber: activeExp.logs.length + 1,
      values: cleanValues,
      completedSubtasks: logCompletedSubtasks.length > 0 ? logCompletedSubtasks : undefined,
      reflection: logReflection.trim() || undefined,
    };

    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id ? { ...ex, logs: [...ex.logs, entry] } : ex
      ),
    }));

    setLogValues({});
    setLogCompletedSubtasks([]);
    setLogReflection('');
    setIsTimerRunning(false);
    setTimerElapsedSeconds(0);
    setTimerSecondsLeft(timerTargetMinutes * 60);
  };

  const handleDeleteLog = (logId: string) => {
    if (!activeExp) return;
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id
          ? { ...ex, logs: ex.logs.filter((l) => l.id !== logId) }
          : ex
      ),
    }));
  };

  const handleAddFieldToActive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExp || !addFieldLabel.trim()) return;
    const fld: ExperimentFieldDef = {
      id: `fld_${Date.now()}`,
      label: addFieldLabel.trim(),
      type: addFieldType,
      unit:
        addFieldType === 'percent_10'
          ? '%'
          : addFieldType === 'timer_minutes'
          ? 'min'
          : addFieldType === 'number' && addFieldUnit.trim()
          ? addFieldUnit.trim()
          : undefined,
      placeholder: addFieldType === 'text' ? 'Escribe tu observación...' : undefined,
    };
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id ? { ...ex, fields: [...ex.fields, fld] } : ex
      ),
    }));
    setAddFieldLabel('');
    setAddFieldUnit('');
  };

  const handleRemoveFieldFromActive = (fieldId: string) => {
    if (!activeExp || activeExp.fields.length <= 1) return;
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: (prev.personalExperiments || []).map((ex) =>
        ex.id === activeExp.id
          ? { ...ex, fields: ex.fields.filter((f) => f.id !== fieldId) }
          : ex
      ),
    }));
  };

  const handleRunAiCoach = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeExp) return;
    setIsLoadingCoach(true);
    try {
      const resp = await fetch('/api/gemini/experiment-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment: activeExp,
          linkedNotes: linkedMentorNotes.map((n) => ({
            title: n.title,
            date: n.date,
            decision: n.decision,
            keyPoints: n.keyPoints,
          })),
          question: coachQuestion.trim() || undefined,
        }),
      });
      const result = await resp.json();
      if (result.feedback) {
        onUpdateData((prev) => ({
          ...prev,
          personalExperiments: (prev.personalExperiments || []).map((ex) =>
            ex.id === activeExp.id ? { ...ex, aiLastFeedback: result.feedback } : ex
          ),
        }));
      }
      setCoachQuestion('');
    } catch {
      // ignore transient error
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const handleLoadTemplateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (content.trim()) {
        setTemplateInputText(content);
        if (!templateCustomTitle.trim()) {
          setTemplateCustomTitle(file.name.replace(/\.[^.]+$/, ''));
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConvertTemplateToExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateInputText.trim()) return;
    setIsConvertingTemplate(true);
    setTemplateError(null);
    try {
      const resp = await fetch('/api/gemini/experiment-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateText: templateInputText.trim(),
          customTitle: templateCustomTitle.trim() || undefined,
        }),
      });
      const result = await resp.json();
      if (!resp.ok || !result.experimentDraft) {
        setTemplateError(result.error || 'No se pudo convertir la plantilla.');
      } else {
        setTemplateDraftPreview(result.experimentDraft);
      }
    } catch {
      setTemplateError('Error de conexión al convertir la plantilla.');
    } finally {
      setIsConvertingTemplate(false);
    }
  };

  const handleActivateTemplateExperiment = () => {
    if (!templateDraftPreview) return;
    const created: PersonalExperiment = {
      id: `exp_${Date.now()}`,
      title: templateDraftPreview.title,
      inspiration: templateDraftPreview.inspiration || 'Coach IA',
      inspirationColor: templateDraftPreview.inspirationColor || 'fuchsia',
      pillar: templateDraftPreview.pillar || 'fisico',
      goalDescription: templateDraftPreview.goalDescription || undefined,
      hypothesis: templateDraftPreview.hypothesis || 'Validar impacto práctico de esta plantilla.',
      purpose: templateDraftPreview.purpose || 'Convertir pasos en resultados medibles.',
      durationDays: Number(templateDraftPreview.durationDays) || 21,
      startDate: todayStr,
      status: 'active',
      fields: templateDraftPreview.fields,
      dailySubtasks: templateDraftPreview.dailySubtasks || [],
      logs: [],
      linkedDecisionIds: [],
    };
    onUpdateData((prev) => ({
      ...prev,
      personalExperiments: [created, ...(prev.personalExperiments || [])],
    }));
    setSelectedExpId(created.id);
    setTemplateDraftPreview(null);
    setTemplateInputText('');
    setTemplateCustomTitle('');
    setCoachMode('analyze');
    setActiveTab('log');
  };

  const handleOpenTemplateInForm = () => {
    if (!templateDraftPreview) return;
    setNewTitle(templateDraftPreview.title);
    setNewInspiration(templateDraftPreview.inspiration || 'Coach IA');
    setNewInspirationColor(templateDraftPreview.inspirationColor || 'fuchsia');
    setNewPillar(templateDraftPreview.pillar || 'fisico');
    setNewGoalDescription(templateDraftPreview.goalDescription || '');
    setNewHypothesis(templateDraftPreview.hypothesis || '');
    setNewPurpose(templateDraftPreview.purpose || '');
    setNewDuration(Number(templateDraftPreview.durationDays) || 21);
    setNewDailySubtasks(templateDraftPreview.dailySubtasks || []);
    setDraftFields(templateDraftPreview.fields);
    setShowCreateForm(true);
    setTemplateDraftPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/25 shrink-0">
              <FlaskConical className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Experimentos Personales
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Laboratorio de evolución humana (Isra García · Diego Dreyfus): campos a medida, comparativas reales y notas de mentoría.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('strategy')}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] hover:bg-fuchsia-500/15 border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>Subir Audio de Mentoría</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Experimento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create New Experiment Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateExperiment}
          className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-fuchsia-500/35 shadow-xl space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Diseñar Experimento Personal
            </h2>
            <div className="flex flex-wrap gap-2">
              {EXPERIMENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/25 text-[11px] font-bold text-fuchsia-700 dark:text-fuchsia-300 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Nombre del experimento (ej: Cero azúcar + 1h lectura)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="md:col-span-2 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <select
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value as PillarKey)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white"
            >
              {(Object.keys(PILLAR_LABELS) as PillarKey[]).map((pk) => (
                <option key={pk} value={pk}>
                  Pilar: {PILLAR_LABELS[pk]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={3}
              max={365}
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              placeholder="Días"
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white tabular-nums"
            />
          </div>

          {/* Manual Inspiration Text + 6 Colors Swatches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-black/30 border border-slate-200 dark:border-white/10">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Inspirado en (escritura manual o sugerencia)
              </label>
              <input
                type="text"
                placeholder="Ej: Isra García, Diego Dreyfus, Marco Aurelio..."
                value={newInspiration}
                onChange={(e) => setNewInspiration(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {INSPIRATION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setNewInspiration(chip)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border ${
                      newInspiration === chip
                        ? 'bg-fuchsia-600 text-white border-fuchsia-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Color de Etiqueta &amp; Experimento
              </label>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(Object.keys(EXP_COLOR_MAP) as ExpColorKey[]).map((ck) => (
                  <button
                    key={ck}
                    type="button"
                    onClick={() => setNewInspirationColor(ck)}
                    title={EXP_COLOR_MAP[ck].label}
                    className={`w-7 h-7 rounded-full ${EXP_COLOR_MAP[ck].swatch} cursor-pointer transition-transform ${
                      newInspirationColor === ck
                        ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <textarea
                rows={2}
                placeholder="Descripción del objetivo concreto (¿Qué resultado tangible quieres lograr al día final?)"
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Hipótesis (Si hago X durante N días, entonces Y...)"
              value={newHypothesis}
              onChange={(e) => setNewHypothesis(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Propósito / Qué quieres comprobar en tu vida"
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Daily Subtasks Builder */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Subtareas Diarias para calcular avance automático ({newDailySubtasks.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {newDailySubtasks.map((st, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] font-semibold"
                >
                  {st}
                  <button
                    type="button"
                    onClick={() =>
                      setNewDailySubtasks((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir subtarea diaria (ej: Meditar 15 min)..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newSubtaskInput.trim()) {
                      setNewDailySubtasks((prev) => [...prev, newSubtaskInput.trim()]);
                      setNewSubtaskInput('');
                    }
                  }
                }}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSubtaskInput.trim()) {
                    setNewDailySubtasks((prev) => [...prev, newSubtaskInput.trim()]);
                    setNewSubtaskInput('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                + Subtarea
              </button>
            </div>
          </div>

          {/* Custom Fields Builder for New Experiment */}
          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Variables / Campos de Medición ({draftFields.length})
            </span>

            <div className="flex flex-wrap gap-2">
              {draftFields.map((fld) => (
                <span
                  key={fld.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs"
                >
                  <span className="text-[10px] font-bold uppercase text-fuchsia-600 dark:text-fuchsia-400">
                    {fld.type === 'percent_10'
                      ? '0-100%'
                      : fld.type === 'timer_minutes'
                      ? 'Timer'
                      : fld.type === 'number'
                      ? 'Num'
                      : fld.type === 'checkbox'
                      ? 'Check'
                      : 'Texto'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {fld.label}
                    {fld.unit ? ` (${fld.unit})` : ''}
                  </span>
                  {draftFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftFields((prev) => prev.filter((f) => f.id !== fld.id))
                      }
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Nombre del campo (ej: Peso, Humor, Cambio mental)"
                value={draftFieldLabel}
                onChange={(e) => setDraftFieldLabel(e.target.value)}
                className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
              <select
                value={draftFieldType}
                onChange={(e) => setDraftFieldType(e.target.value as ExperimentFieldType)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="text">Alfabético / Texto</option>
                <option value="number">Numérico</option>
                <option value="checkbox">Checklist (Sí / No)</option>
                <option value="percent_10">Barra Avance (10% en 10%)</option>
                <option value="timer_minutes">Temporizador (Minutos)</option>
              </select>
              <div className="flex gap-2">
                {draftFieldType === 'number' && (
                  <input
                    type="text"
                    placeholder="Unidad (kg, pts)"
                    value={draftFieldUnit}
                    onChange={(e) => setDraftFieldUnit(e.target.value)}
                    className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                )}
                <button
                  type="button"
                  onClick={handleAddDraftField}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-fuchsia-500/20 text-xs font-bold cursor-pointer"
                >
                  + Campo
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs text-slate-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
            >
              Iniciar Experimento
            </button>
          </div>
        </form>
      )}

      {/* Experiments Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiments.map((exp) => {
          const isSelected = activeExp?.id === exp.id;
          const pct = Math.min(100, Math.round((exp.logs.length / Math.max(1, exp.durationDays)) * 100));
          const col = EXP_COLOR_MAP[exp.inspirationColor || 'fuchsia'];
          return (
            <div
              key={exp.id}
              onClick={() => {
                setSelectedExpId(exp.id);
                setIsEditingExp(false);
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? `${col.selectedCard} shadow-lg`
                  : 'bg-white/75 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.08] hover:border-fuchsia-400/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${col.badge}`}>
                      {exp.inspiration}
                    </span>
                    {exp.pillar && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                        {PILLAR_LABELS[exp.pillar]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tabular-nums ${col.text}`}>
                      {exp.logs.length}/{exp.durationDays} días
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExperiment(exp.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Eliminar experimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {exp.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {exp.goalDescription || exp.hypothesis}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.06]">
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${col.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{exp.fields.length} campos activos</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Experiment Workspace */}
      {activeExp && (
        <div className="space-y-6">
          {/* Experiment Detail + AI Coach Interactive Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-3">
              {!isEditingExp ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${activeColor.badge}`}>
                        Inspirado en: {activeExp.inspiration}
                      </span>
                      {activeExp.pillar && (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                          Pilar: {PILLAR_LABELS[activeExp.pillar]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Inicio: {activeExp.startDate} · Meta: {activeExp.durationDays} días
                      </span>
                      <button
                        type="button"
                        onClick={openEditActiveExp}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-fuchsia-500/15 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar Detalles</span>
                      </button>
                    </div>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {activeExp.title}
                  </h2>
                  {activeExp.goalDescription && (
                    <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-black/30 p-3 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
                      <strong>Objetivo:</strong> {activeExp.goalDescription}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>Hipótesis:</strong> {activeExp.hypothesis}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <strong>Propósito:</strong> {activeExp.purpose}
                  </p>
                </>
              ) : (
                <form onSubmit={handleSaveActiveExpEdit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Editar Detalles del Experimento
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingExp(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Título"
                      className="sm:col-span-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min={3}
                      max={365}
                      value={editDurationDays}
                      onChange={(e) => setEditDurationDays(Number(e.target.value))}
                      className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Inspirado en (manual)
                      </label>
                      <input
                        type="text"
                        value={editInspiration}
                        onChange={(e) => setEditInspiration(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        Pilar / Dimensión
                      </label>
                      <select
                        value={editPillar}
                        onChange={(e) => setEditPillar(e.target.value as PillarKey)}
                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        {(Object.keys(PILLAR_LABELS) as PillarKey[]).map((pk) => (
                          <option key={pk} value={pk}>
                            {PILLAR_LABELS[pk]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Color:</span>
                    {(Object.keys(EXP_COLOR_MAP) as ExpColorKey[]).map((ck) => (
                      <button
                        key={ck}
                        type="button"
                        onClick={() => setEditInspirationColor(ck)}
                        className={`w-6 h-6 rounded-full ${EXP_COLOR_MAP[ck].swatch} cursor-pointer ${
                          editInspirationColor === ck ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white' : 'opacity-65'
                        }`}
                      />
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={editGoalDescription}
                    onChange={(e) => setEditGoalDescription(e.target.value)}
                    placeholder="Descripción del objetivo..."
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editHypothesis}
                    onChange={(e) => setEditHypothesis(e.target.value)}
                    placeholder="Hipótesis"
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value)}
                    placeholder="Propósito"
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className={`px-4 py-1.5 rounded-xl bg-gradient-to-r ${EXP_COLOR_MAP[editInspirationColor].gradient} text-white text-xs font-bold cursor-pointer`}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-tabs */}
              <div className="pt-2 flex flex-wrap gap-1.5">
                {[
                  { id: 'log', label: `Registros (${activeExp.logs.length})` },
                  { id: 'compare', label: 'Comparativa & Evolución' },
                  { id: 'fields', label: `Campos (${activeExp.fields.length})` },
                  { id: 'mentor_notes', label: `Mentorías (${linkedMentorNotes.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${activeColor.gradient} text-white shadow-md`
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coach IA de Experimentos (Isra García + Diego Dreyfus + Conversor de Plantillas) */}
            <div className="lg:col-span-5 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-fuchsia-500/25 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-fuchsia-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Coach IA de Experimentos
                  </h3>
                </div>
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setCoachMode('analyze')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      coachMode === 'analyze'
                        ? 'bg-white dark:bg-slate-800 text-fuchsia-700 dark:text-fuchsia-300 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Analizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachMode('template')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      coachMode === 'template'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Plantilla → Experimento
                  </button>
                </div>
              </div>

              {coachMode === 'analyze' ? (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isLoadingCoach}
                      onClick={() => handleRunAiCoach()}
                      className="px-3 py-1.5 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-700 dark:text-fuchsia-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCoach ? 'animate-spin' : ''}`} />
                      <span>{isLoadingCoach ? 'Analizando...' : 'Analizar Comparativa'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-100/80 dark:bg-black/30 p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] max-h-40 overflow-y-auto">
                    {activeExp.aiLastFeedback ||
                      'Haz clic en "Analizar Comparativa" o escribe una pregunta abajo para que la IA compare tus registros desde el día 1 y detecte mejoras reales.'}
                  </p>

                  <form onSubmit={handleRunAiCoach} className="flex gap-2">
                    <input
                      type="text"
                      value={coachQuestion}
                      onChange={(e) => setCoachQuestion(e.target.value)}
                      placeholder="Pregunta sobre tus datos o cambio mental..."
                      className="flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingCoach}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Pega una plantilla, lista de pasos o sube un archivo <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-white/10">.txt / .md</code> y la IA lo transformará en un experimento completo con subtareas y campos medibles.
                  </p>

                  <form onSubmit={handleConvertTemplateToExperiment} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={templateCustomTitle}
                        onChange={(e) => setTemplateCustomTitle(e.target.value)}
                        placeholder="Título opcional del experimento..."
                        className="flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                      />
                      <label className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer hover:border-fuchsia-400 shrink-0">
                        <Upload className="w-3 h-3 text-fuchsia-500" />
                        <span>Cargar Archivo</span>
                        <input
                          type="file"
                          accept=".txt,.md,.csv,.json,text/plain"
                          onChange={handleLoadTemplateFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      rows={4}
                      required
                      value={templateInputText}
                      onChange={(e) => setTemplateInputText(e.target.value)}
                      placeholder={'Ej:\nExperimento 21 días sin azúcar ni redes antes de las 10 AM:\n1. Agua con limón al despertar\n2. 45 min de Deep Work\n3. Medir energía (1-10) y anotar excusas...'}
                      className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white resize-y"
                    />

                    {templateError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        {templateError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isConvertingTemplate || !templateInputText.trim()}
                      className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isConvertingTemplate ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isConvertingTemplate ? 'Transformando plantilla...' : 'Transformar en Experimento con IA'}
                      </span>
                    </button>
                  </form>

                  {templateDraftPreview && (
                    <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-fuchsia-800 dark:text-fuchsia-200">
                          {templateDraftPreview.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-black/40 text-fuchsia-700 dark:text-fuchsia-300">
                          {templateDraftPreview.durationDays} días · {PILLAR_LABELS[templateDraftPreview.pillar]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        {templateDraftPreview.dailySubtasks.length} pasos diarios · {templateDraftPreview.fields.length} campos medibles listos.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleActivateTemplateExperiment}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Crear y Activar Experimento
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenTemplateInForm}
                          className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                        >
                          Ajustar en Formulario
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SUB-TAB 1: REGISTROS DEL EXPERIMENTO */}
          {activeTab === 'log' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Dynamic Log Form */}
              <form
                onSubmit={handleAddLogEntry}
                className="lg:col-span-5 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Registrar Nuevo Avance
                  </h3>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white tabular-nums"
                  />
                </div>

                <div className="space-y-3.5">
                  {/* Daily Subtasks Checklist + Automatic 10% Step Progress */}
                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Subtareas del Día ({logCompletedSubtasks.length}/{(activeExp.dailySubtasks || []).length})
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Calcula avance automático
                      </span>
                    </div>

                    {(activeExp.dailySubtasks || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(activeExp.dailySubtasks || []).map((st) => {
                          const isChecked = logCompletedSubtasks.includes(st);
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleToggleDailySubtask(st)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {isChecked ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{st}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Agregar subtarea rápida..."
                        value={quickSubtaskDraft}
                        onChange={(e) => setQuickSubtaskDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickSubtaskToActive();
                          }
                        }}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-[11px] text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddQuickSubtaskToActive}
                        className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-[11px] font-bold cursor-pointer"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>

                  {/* Interactive 0%-100% Progress Bar (step 10) */}
                  {!activeExp.fields.some((f) => f.type === 'percent_10') && (() => {
                    const currentPct = Number(logValues._daily_progress_10 ?? 0);
                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Avance de Hoy (10% en 10%)
                          </span>
                          <span className={`font-extrabold tabular-nums ${activeColor.text}`}>
                            {currentPct}%
                          </span>
                        </div>
                        <div className="grid grid-cols-10 gap-1">
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() =>
                                setLogValues((prev) => ({
                                  ...prev,
                                  _daily_progress_10: currentPct === step ? step - 10 : step,
                                }))
                              }
                              title={`${step}%`}
                              className={`h-3 rounded-sm transition-all cursor-pointer ${
                                currentPct >= step
                                  ? activeColor.bar
                                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Interactive Minute Timer */}
                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${activeColor.text}`} />
                        <span>Temporizador de Sesión (Minutos)</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {[5, 15, 25, 45].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerTargetMinutes(m);
                              setTimerSecondsLeft(m * 60);
                              setTimerElapsedSeconds(0);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              timerTargetMinutes === m
                                ? `bg-gradient-to-r ${activeColor.gradient} text-white`
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                        {String(Math.floor(timerSecondsLeft / 60)).padStart(2, '0')}:
                        {String(timerSecondsLeft % 60).padStart(2, '0')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning((r) => !r)}
                          className={`px-2.5 py-1.5 rounded-xl text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer bg-gradient-to-r ${activeColor.gradient}`}
                        >
                          {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          <span>{isTimerRunning ? 'Pausa' : 'Iniciar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerSecondsLeft(timerTargetMinutes * 60);
                            setTimerElapsedSeconds(0);
                          }}
                          className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 cursor-pointer"
                          title="Reiniciar"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyTimerToForm}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                        >
                          Registrar {Math.max(1, Math.round((timerElapsedSeconds || timerTargetMinutes * 60) / 60))}m
                        </button>
                      </div>
                    </div>
                  </div>

                  {activeExp.fields.map((fld) => {
                    const val = logValues[fld.id];
                    if (fld.type === 'percent_10') {
                      const currentPct = Number(val ?? 0);
                      return (
                        <div
                          key={fld.id}
                          className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-black/35 border border-slate-200/80 dark:border-white/[0.08] space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                              {fld.label} (de 10 en 10)
                            </label>
                            <span className={`font-extrabold tabular-nums ${activeColor.text}`}>
                              {currentPct}%
                            </span>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => (
                              <button
                                key={step}
                                type="button"
                                onClick={() =>
                                  setLogValues((prev) => ({
                                    ...prev,
                                    [fld.id]: currentPct === step ? step - 10 : step,
                                  }))
                                }
                                title={`${step}%`}
                                className={`h-3.5 rounded-sm transition-all cursor-pointer ${
                                  currentPct >= step
                                    ? activeColor.bar
                                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fld.type === 'timer_minutes') {
                      return (
                        <div key={fld.id}>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            {fld.label} (min cronometrados)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={val !== undefined ? String(val) : ''}
                            onChange={(e) =>
                              setLogValues((prev) => ({ ...prev, [fld.id]: e.target.value }))
                            }
                            placeholder="Minutos ejecutados..."
                            className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                          />
                        </div>
                      );
                    }

                    if (fld.type === 'checkbox') {
                      const checked = Boolean(val);
                      return (
                        <button
                          key={fld.id}
                          type="button"
                          onClick={() =>
                            setLogValues((prev) => ({ ...prev, [fld.id]: !checked }))
                          }
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            checked
                              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100/70 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{fld.label}</span>
                          {checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      );
                    }

                    if (fld.type === 'number') {
                      return (
                        <div key={fld.id}>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            {fld.label} {fld.unit ? `(${fld.unit})` : ''}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={val !== undefined ? String(val) : ''}
                            onChange={(e) =>
                              setLogValues((prev) => ({ ...prev, [fld.id]: e.target.value }))
                            }
                            placeholder="0"
                            className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={fld.id}>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          {fld.label}
                        </label>
                        <input
                          type="text"
                          value={typeof val === 'string' ? val : ''}
                          onChange={(e) =>
                            setLogValues((prev) => ({ ...prev, [fld.id]: e.target.value }))
                          }
                          placeholder={fld.placeholder || 'Observación del día...'}
                          className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    );
                  })}

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Nota de Cambio Mental / Dieta / Conducta
                    </label>
                    <textarea
                      rows={2}
                      value={logReflection}
                      onChange={(e) => setLogReflection(e.target.value)}
                      placeholder="¿Qué notaste distinto hoy respecto al inicio del experimento?"
                      className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-2xl bg-gradient-to-r ${activeColor.gradient} text-white text-xs font-bold shadow-md cursor-pointer`}
                >
                  Guardar Registro del Día
                </button>
              </form>

              {/* Chronological Log Feed */}
              <div className="lg:col-span-7 p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bitácora Cronológica ({sortedLogs.length} registros)
                </h3>

                {sortedLogs.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                    Aún no hay registros en este experimento. Registra tu Día 1 a la izquierda para comenzar a comparar tu evolución.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                    {[...sortedLogs].reverse().map((entry, idx) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold tabular-nums border ${activeColor.badge}`}>
                              Día #{sortedLogs.length - idx}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3 h-3" />
                              {entry.date}
                            </span>
                            {entry.values._daily_progress_10 !== undefined && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
                                {String(entry.values._daily_progress_10)}%
                              </span>
                            )}
                            {entry.values._daily_timer_min !== undefined && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold tabular-nums flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {String(entry.values._daily_timer_min)} min
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(entry.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeExp.fields.map((fld) => {
                            const val = entry.values[fld.id];
                            return (
                              <div
                                key={fld.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/70 dark:border-white/[0.05] text-xs"
                              >
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  {fld.label}
                                </span>
                                {fld.type === 'percent_10' ? (
                                  <div className="mt-1 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-extrabold tabular-nums">
                                      <span className={activeColor.text}>{Number(val ?? 0)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${activeColor.bar}`}
                                        style={{ width: `${Math.min(100, Number(val ?? 0))}%` }}
                                      />
                                    </div>
                                  </div>
                                ) : fld.type === 'timer_minutes' ? (
                                  <span className="font-extrabold text-slate-900 dark:text-white tabular-nums flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    {val ?? 0} min
                                  </span>
                                ) : fld.type === 'checkbox' ? (
                                  <span
                                    className={`font-bold ${
                                      val ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {val ? '✓ Cumplido' : '✕ No cumplido'}
                                  </span>
                                ) : fld.type === 'number' ? (
                                  <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                                    {val ?? 0} {fld.unit || ''}
                                  </span>
                                ) : (
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {String(val || '—')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {entry.completedSubtasks && entry.completedSubtasks.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {entry.completedSubtasks.map((st) => (
                              <span
                                key={st}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              >
                                ✓ {st}
                              </span>
                            ))}
                          </div>
                        )}

                        {entry.reflection && (
                          <p className="text-xs italic text-slate-600 dark:text-slate-300 pt-1">
                            &quot;{entry.reflection}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: COMPARATIVA & EVOLUCIÓN */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              {sortedLogs.length < 2 ? (
                <div className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] text-center space-y-2">
                  <TrendingUp className="w-7 h-7 text-fuchsia-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Se necesitan al menos 2 registros para comparar evolución
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registra otro día en la pestaña anterior para ver el delta entre tu línea base y tu avance actual.
                  </p>
                </div>
              ) : (
                <>
                  {/* Delta Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comparisonStats.numeric.map((stat) => (
                      <div
                        key={stat.field.id}
                        className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2"
                      >
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                          {stat.field.label}
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                            {stat.latest} {stat.field.unit || ''}
                          </span>
                          {stat.delta !== null && (
                            <span
                              className={`text-xs font-extrabold px-2 py-0.5 rounded-lg tabular-nums ${
                                stat.delta >= 0
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {stat.delta >= 0 ? `+${stat.delta}` : stat.delta} vs Inicio
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-white/[0.06] tabular-nums">
                          <span>Base: {stat.first}</span>
                          <span>Promedio: {stat.avg}</span>
                        </div>
                      </div>
                    ))}

                    {comparisonStats.checkboxes.map((chk) => (
                      <div
                        key={chk.field.id}
                        className="p-5 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-2"
                      >
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                          {chk.field.label}
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-2xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400 tabular-nums">
                            {chk.rate}%
                          </span>
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">
                            {chk.done}/{chk.total} días
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fuchsia-500 rounded-full"
                            style={{ width: `${chk.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Full Comparison Matrix Table */}
                  <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg overflow-x-auto">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Tabla Comparativa Día a Día
                    </h3>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                          <th className="py-2 pr-4 font-bold">Fecha</th>
                          {activeExp.fields.map((fld) => (
                            <th key={fld.id} className="py-2 px-3 font-bold">
                              {fld.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
                        {sortedLogs.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                              {row.date}
                            </td>
                            {activeExp.fields.map((fld) => {
                              const v = row.values[fld.id];
                              return (
                                <td key={fld.id} className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                  {fld.type === 'checkbox' ? (
                                    <span className={v ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                      {v ? 'Sí' : 'No'}
                                    </span>
                                  ) : fld.type === 'percent_10' ? (
                                    <span className="font-bold tabular-nums">
                                      {v ?? 0}%
                                    </span>
                                  ) : fld.type === 'timer_minutes' ? (
                                    <span className="font-bold tabular-nums">
                                      {v ?? 0} min
                                    </span>
                                  ) : fld.type === 'number' ? (
                                    <span className="font-bold tabular-nums">
                                      {v ?? 0} {fld.unit || ''}
                                    </span>
                                  ) : (
                                    <span className="line-clamp-2 max-w-xs">{String(v || '—')}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SUB-TAB 3: DISEÑADOR DE CAMPOS */}
          {activeTab === 'fields' && (
            <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-500" />
                  <span>Campos Personalizados del Experimento</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Agrega variables alfabéticas, numéricas, barras de avance (10% en 10%), temporizador en minutos o checklists diarios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeExp.fields.map((fld) => (
                  <div
                    key={fld.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center">
                        {fld.type === 'percent_10' ? (
                          <BarChart3 className="w-4 h-4" />
                        ) : fld.type === 'timer_minutes' ? (
                          <Clock className="w-4 h-4" />
                        ) : fld.type === 'number' ? (
                          <Hash className="w-4 h-4" />
                        ) : fld.type === 'checkbox' ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <TypeIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {fld.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {fld.type === 'percent_10'
                            ? 'Barra Avance (0%–100%, pasos de 10%)'
                            : fld.type === 'timer_minutes'
                            ? 'Temporizador en Minutos'
                            : fld.type === 'number'
                            ? `Numérico${fld.unit ? ` (${fld.unit})` : ''}`
                            : fld.type === 'checkbox'
                            ? 'Checklist Sí/No'
                            : 'Alfabético / Texto'}
                        </span>
                      </div>
                    </div>
                    {activeExp.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFieldFromActive(fld.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddFieldToActive}
                className="p-4 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Nuevo Campo
                  </label>
                  <input
                    type="text"
                    required
                    value={addFieldLabel}
                    onChange={(e) => setAddFieldLabel(e.target.value)}
                    placeholder="Ej: Calorías limpias, Insight mental, Tiempo en calma..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Tipo de Dato
                  </label>
                  <select
                    value={addFieldType}
                    onChange={(e) => setAddFieldType(e.target.value as ExperimentFieldType)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="number">Numérico</option>
                    <option value="text">Alfabético / Texto</option>
                    <option value="checkbox">Checklist</option>
                    <option value="percent_10">Barra Avance (10% en 10%)</option>
                    <option value="timer_minutes">Temporizador (Minutos)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {addFieldType === 'number' && (
                    <input
                      type="text"
                      value={addFieldUnit}
                      onChange={(e) => setAddFieldUnit(e.target.value)}
                      placeholder="Unidad"
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  )}
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUB-TAB 4: MENTORÍAS Y AUDIOS VINCULADOS */}
          {activeTab === 'mentor_notes' && (
            <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Notas de Mentorías &amp; Audios Vinculados ({linkedMentorNotes.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Todos los audios o notas etiquetados como &quot;Personal&quot; en Dirección &amp; Estrategia y enviados a este experimento aparecen aquí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('strategy')}
                  className="px-3.5 py-2 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Procesar Nuevo Audio en Estrategia</span>
                </button>
              </div>

              {linkedMentorNotes.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-2xl text-xs text-slate-500 dark:text-slate-400">
                  No hay notas de mentoría vinculadas aún. En Dirección &amp; Estrategia etiqueta un audio o nota como &quot;Personal&quot; y selecciona este experimento.
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedMentorNotes.map((note) => {
                    const isOpen = Boolean(expandedTranscripts[note.id]);
                    return (
                      <div
                        key={note.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {note.title}
                          </span>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {note.date}
                          </span>
                        </div>
                        <p className="text-xs text-fuchsia-900 dark:text-fuchsia-200 bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20">
                          <strong>Aprendizaje / Resolución:</strong> {note.decision}
                        </p>
                        {note.keyPoints && note.keyPoints.length > 0 && (
                          <div className="space-y-1">
                            {note.keyPoints.map((kp, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                                <span>{kp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {note.transcript && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedTranscripts((prev) => ({
                                  ...prev,
                                  [note.id]: !prev[note.id],
                                }))
                              }
                              className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              <span>{isOpen ? 'Ocultar transcripción' : 'Ver transcripción del audio'}</span>
                            </button>
                            {isOpen && (
                              <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-900/70 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {note.transcript}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
