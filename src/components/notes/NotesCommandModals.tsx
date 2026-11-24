import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Mic,
  Square,
  Upload,
  FileAudio,
  FileText,
  X,
  User,
  Building2,
  FolderKanban,
  FlaskConical,
  CheckSquare,
  Loader2,
  Plus,
  CheckCircle2,
  BookOpen,
  Tag,
  Copy,
  Check,
  ListChecks,
  Search,
  FilePlus2,
} from 'lucide-react';
import { AppStoreData } from '../../services/storage';
import {
  NoteDecisionMeta,
  NotesStudioAction,
  PersonalNote,
  StrategicDecision,
} from '../../types';
import { fetchJsonWithTimeout } from '../../utils/fetchWithTimeout';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const inferAudioMimeType = (file: File): string => {
  if (file.type && file.type.startsWith('audio/')) {
    return file.type.split(';')[0].trim();
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4') || lower.endsWith('.aac')) return 'audio/mp4';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) return 'audio/ogg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.flac')) return 'audio/flac';
  return 'audio/mpeg';
};

const pickSupportedRecorderMime = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
};

export function buildBitacoraMarkdown(params: {
  title: string;
  context: string;
  decision: string;
  keyPoints: string[];
  expectedOutcome: string;
  quarter?: string;
  scopeTags: ('personal' | 'business')[];
  transcript?: string;
}): string {
  const lines: string[] = [];
  const scopeStr = params.scopeTags
    .map((t) => (t === 'business' ? 'Empresarial' : 'Personal'))
    .join(' · ');

  lines.push(`# ${params.title}`);
  lines.push(
    `**Ámbito:** ${scopeStr}${params.quarter ? ` · **Periodo:** ${params.quarter}` : ''}`
  );
  lines.push('');

  if (params.context.trim()) {
    lines.push('## Contexto & Motivo');
    lines.push(params.context.trim());
    lines.push('');
  }

  if (params.decision.trim()) {
    lines.push('## Resolución / Decisión Adoptada');
    lines.push(params.decision.trim());
    lines.push('');
  }

  if (params.keyPoints.length > 0) {
    lines.push('## Puntos Clave & Acuerdos');
    params.keyPoints.forEach((kp) => {
      const clean = kp.replace(/^[-•*]\s*/, '').trim();
      if (clean) lines.push(`- [ ] ${clean}`);
    });
    lines.push('');
  }

  if (params.expectedOutcome.trim()) {
    lines.push('## Impacto / Resultado Esperado');
    lines.push(params.expectedOutcome.trim());
    lines.push('');
  }

  if (params.transcript && params.transcript.trim()) {
    lines.push('## Transcripción Completa');
    lines.push(params.transcript.trim());
  }

  return lines.join('\n').trim();
}

export interface DecisionDraftPayload {
  title: string;
  context: string;
  decision: string;
  keyPointsText: string;
  expectedOutcome: string;
  quarter: string;
  scopeTags: ('personal' | 'business')[];
  businessId: string;
  projectId: string;
  taskId: string;
  experimentId: string;
  transcript: string;
  source: NoteDecisionMeta['source'];
}

const SUGGESTED_AREA_TAGS = ['Personal', 'Empresarial', 'Aprendizaje', 'Bitácora', 'Finanzas', 'Ideas'];

interface LinkSelectorsProps {
  data: AppStoreData;
  scopeTags: ('personal' | 'business')[];
  onToggleScope: (tag: 'personal' | 'business') => void;
  noteTags: string[];
  onChangeNoteTags: (tags: string[]) => void;
  businessId: string;
  setBusinessId: (v: string) => void;
  projectId: string;
  setProjectId: (v: string) => void;
  taskId: string;
  setTaskId: (v: string) => void;
  experimentId: string;
  setExperimentId: (v: string) => void;
}

const ScopeAndLinksFields: React.FC<LinkSelectorsProps> = ({
  data,
  scopeTags,
  onToggleScope,
  noteTags,
  onChangeNoteTags,
  businessId,
  setBusinessId,
  projectId,
  setProjectId,
  taskId,
  setTaskId,
  experimentId,
  setExperimentId,
}) => {
  const [customTagInput, setCustomTagInput] = useState('');
  const filteredProjects = businessId
    ? data.projects.filter((p) => p.businessId === businessId)
    : data.projects;

  const existingCatalog = Array.from(
    new Set([
      ...SUGGESTED_AREA_TAGS,
      ...(data.personalNotes || []).flatMap((n) => n.tags || []),
      ...noteTags,
    ])
  );

  const toggleTag = (tag: string) => {
    const exists = noteTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      onChangeNoteTags(noteTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()));
    } else {
      onChangeNoteTags([...noteTags, tag]);
    }
  };

  const addCustomTag = () => {
    const clean = customTagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!noteTags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onChangeNoteTags([...noteTags, clean]);
    }
    setCustomTagInput('');
  };

  return (
    <div className="space-y-3 p-3.5 rounded-2xl bg-violet-500/[0.05] dark:bg-violet-500/[0.07] border border-violet-500/20">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-violet-500" />
            Etiquetas / Áreas de esta nota
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="Nueva etiqueta..."
              className="w-32 px-2.5 py-1 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {existingCatalog.map((tag) => {
            const active = noteTags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  toggleTag(tag);
                  if (tag.toLowerCase() === 'personal' && !scopeTags.includes('personal')) {
                    onToggleScope('personal');
                  }
                  if (tag.toLowerCase() === 'empresarial' && !scopeTags.includes('business')) {
                    onToggleScope('business');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-500 shadow-xs'
                    : 'bg-white/80 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-400/50'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Empresa / Negocio */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Building2 className="w-3 h-3 text-violet-500" />
            Negocio / Empresa
          </label>
          <select
            value={businessId}
            onChange={(e) => {
              setBusinessId(e.target.value);
              setProjectId('');
            }}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Sin empresa vinculada</option>
            {data.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.logoEmoji ? `${b.logoEmoji} ` : ''}
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Proyecto */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <FolderKanban className="w-3 h-3 text-indigo-500" />
            Proyecto
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Sin proyecto vinculado</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tarea */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <CheckSquare className="w-3 h-3 text-sky-500" />
            Tarea (Personal o Negocio)
          </label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Sin tarea vinculada</option>
            {data.tasks.slice(0, 40).map((t) => (
              <option key={t.id} value={t.id}>
                [{t.scope === 'business' ? 'Negocio' : 'Personal'}] {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Experimento Personal */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <FlaskConical className="w-3 h-3 text-fuchsia-500" />
            Experimento Personal
          </label>
          <select
            value={experimentId}
            onChange={(e) => setExperimentId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Sin experimento vinculado</option>
            {(data.personalExperiments || []).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 1. AI NOTE ASSISTANT MODAL (Summarize/Analyze Any Note + Create Note by Topic)
// ============================================================================
export interface NoteAiSummaryResult {
  executiveSummary: string;
  context: string;
  resolution: string;
  keyPoints: string[];
  actionItems: string[];
  expectedImpact: string;
}

function buildSummaryMarkdown(noteTitle: string, summary: NoteAiSummaryResult): string {
  const lines: string[] = [
    '',
    '---',
    `## Resumen Ejecutivo de Bitácora IA — ${noteTitle}`,
    summary.executiveSummary,
  ];
  if (summary.context) {
    lines.push('', '## Contexto', summary.context);
  }
  if (summary.resolution) {
    lines.push('', '## Resolución / Conclusión Clave', summary.resolution);
  }
  if (summary.keyPoints.length > 0) {
    lines.push('', '## Puntos Importantes');
    summary.keyPoints.forEach((pt) => lines.push(`- ${pt}`));
  }
  if (summary.actionItems.length > 0) {
    lines.push('', '## Próximos Pasos & Compromisos');
    summary.actionItems.forEach((item) => lines.push(`- [ ] ${item}`));
  }
  if (summary.expectedImpact) {
    lines.push('', '## Impacto / Aprendizaje', summary.expectedImpact);
  }
  return lines.join('\n').trim();
}

interface TopicAssistantModalProps {
  data: AppStoreData;
  initialNoteId?: string;
  onClose: () => void;
  onNoteCreated: (note: PersonalNote) => void;
  onAppendSummaryToNote?: (
    noteId: string,
    summaryMarkdown: string,
    summaryMeta: NoteAiSummaryResult
  ) => void;
}

export const TopicAssistantModal: React.FC<TopicAssistantModalProps> = ({
  data,
  initialNoteId,
  onClose,
  onNoteCreated,
  onAppendSummaryToNote,
}) => {
  const availableNotes = data.personalNotes || [];
  const [assistantMode, setAssistantMode] = useState<'analyze' | 'create'>(
    initialNoteId || availableNotes.length > 0 ? 'analyze' : 'create'
  );

  // ---- Mode A: Analyze / Summarize Selected Note ----
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    initialNoteId && availableNotes.some((n) => n.id === initialNoteId)
      ? initialNoteId
      : availableNotes[0]?.id || ''
  );
  const [noteFilterQuery, setNoteFilterQuery] = useState('');
  const [focusPrompt, setFocusPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<NoteAiSummaryResult | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const selectedNote = availableNotes.find((n) => n.id === selectedNoteId) || null;
  const filteredSelectableNotes = availableNotes.filter((n) => {
    const q = noteFilterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (n.title || '').toLowerCase().includes(q) ||
      (n.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (n.content || '').toLowerCase().includes(q)
    );
  });

  // ---- Mode B: Create Note by Topic ----
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [style, setStyle] = useState<'estructurada' | 'plan_accion' | 'estudio' | 'reunion'>(
    'estructurada'
  );
  const [scopeTags, setScopeTags] = useState<('personal' | 'business')[]>(['personal']);
  const [noteTags, setNoteTags] = useState<string[]>(['Personal']);
  const [businessId, setBusinessId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [experimentId, setExperimentId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleScope = (tag: 'personal' | 'business') => {
    setScopeTags((prev) => {
      if (prev.includes(tag) && prev.length === 1) return prev;
      return prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  };

  const handleAnalyzeSelectedNote = async () => {
    if (!selectedNote) {
      setAnalyzeError('Selecciona una nota primero para que la IA la analice.');
      return;
    }
    setAnalyzeError(null);
    setIsAnalyzing(true);
    setSummaryResult(null);

    try {
      const linkedLabels: string[] = [];
      (selectedNote.linkedBusinessIds || []).forEach((id) => {
        const b = data.businesses.find((x) => x.id === id);
        if (b) linkedLabels.push(`Empresa: ${b.name}`);
      });
      (selectedNote.linkedProjectIds || []).forEach((id) => {
        const p = data.projects.find((x) => x.id === id);
        if (p) linkedLabels.push(`Proyecto: ${p.name}`);
      });
      (selectedNote.linkedExperimentIds || []).forEach((id) => {
        const ex = (data.personalExperiments || []).find((x) => x.id === id);
        if (ex) linkedLabels.push(`Experimento: ${ex.title}`);
      });

      const floatingText = (selectedNote.floatingBoxes || [])
        .map((b) => b.text?.trim())
        .filter(Boolean)
        .join('\n');
      const fullContent = [
        selectedNote.content || '',
        floatingText ? `\nNotas adhesivas:\n${floatingText}` : '',
        selectedNote.decisionMeta?.transcript
          ? `\nTranscripción de audio:\n${selectedNote.decisionMeta.transcript}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const { ok, status, data: result } = await fetchJsonWithTimeout<
        Partial<NoteAiSummaryResult> & { error?: string }
      >(
        '/api/gemini/note-summary',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedNote.title,
            content: fullContent,
            tags: selectedNote.tags || [],
            linkedContext: linkedLabels.join(' · '),
            focusPrompt: focusPrompt.trim(),
          }),
        },
        45000
      );

      if (!ok) {
        throw new Error(result.error || `Error analizando nota (${status})`);
      }

      setSummaryResult({
        executiveSummary: result.executiveSummary || 'Resumen generado.',
        context: result.context || '',
        resolution: result.resolution || '',
        keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
        actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
        expectedImpact: result.expectedImpact || '',
      });
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : 'No se pudo analizar la nota con IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summaryResult || !selectedNote) return;
    const md = buildSummaryMarkdown(selectedNote.title || 'Nota', summaryResult);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 1800);
    } catch {
      // Clipboard not available
    }
  };

  const handleInsertIntoSelectedNote = () => {
    if (!summaryResult || !selectedNote || !onAppendSummaryToNote) return;
    const md = buildSummaryMarkdown(selectedNote.title || 'Nota', summaryResult);
    onAppendSummaryToNote(selectedNote.id, md, summaryResult);
  };

  const handleCreateBitacoraFromSummary = () => {
    if (!summaryResult || !selectedNote) return;
    const nowIso = new Date().toISOString();
    const baseTags = selectedNote.tags && selectedNote.tags.length > 0 ? selectedNote.tags : ['Personal'];
    const mergedTags = Array.from(new Set([...baseTags, 'Bitácora']));
    const newNote: PersonalNote = {
      id: `pnote_${Date.now()}`,
      title: `Resumen Bitácora: ${selectedNote.title || 'Nota'}`,
      content: `# Resumen Bitácora: ${selectedNote.title || 'Nota'}\n\n${buildSummaryMarkdown(
        selectedNote.title || 'Nota',
        summaryResult
      ).replace(/^---\n/, '')}`,
      category: 'bitacora',
      tags: mergedTags,
      scopeTags: selectedNote.scopeTags || ['personal'],
      decisionMeta: {
        context: summaryResult.context,
        decision: summaryResult.resolution,
        keyPoints: summaryResult.keyPoints,
        expectedOutcome: summaryResult.expectedImpact,
        source: 'ai_topic',
      },
      paperStyle: 'lined',
      paperTone: 'system',
      fontFamily: 'sans',
      fontSize: 'md',
      floatingBoxes: [],
      embeddedImages: [],
      inkStrokes: [],
      linkedBusinessIds: selectedNote.linkedBusinessIds || [],
      linkedProjectIds: selectedNote.linkedProjectIds || [],
      linkedTaskIds: selectedNote.linkedTaskIds || [],
      linkedExperimentIds: selectedNote.linkedExperimentIds || [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    onNoteCreated(newNote);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Escribe el tema específico sobre el cual quieres que el asistente cree tu nota.');
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const linkedLabels: string[] = [];
      if (businessId) {
        const b = data.businesses.find((x) => x.id === businessId);
        if (b) linkedLabels.push(`Empresa: ${b.name}`);
      }
      if (projectId) {
        const p = data.projects.find((x) => x.id === projectId);
        if (p) linkedLabels.push(`Proyecto: ${p.name}`);
      }
      if (experimentId) {
        const ex = (data.personalExperiments || []).find((x) => x.id === experimentId);
        if (ex) linkedLabels.push(`Experimento: ${ex.title}`);
      }

      const { ok, status, data: result } = await fetchJsonWithTimeout<{
        title?: string;
        content?: string;
        suggestedCategory?: PersonalNote['category'];
        error?: string;
      }>(
        '/api/gemini/note-topic-assistant',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.trim(),
            instructions: instructions.trim(),
            scopeTags,
            linkedLabel: linkedLabels.join(' · '),
            style,
          }),
        },
        45000
      );

      if (!ok) {
        throw new Error(result.error || `Error generando nota (${status})`);
      }

      const nowIso = new Date().toISOString();
      const newNote: PersonalNote = {
        id: `pnote_${Date.now()}`,
        title: (result.title || topic.trim()).slice(0, 100),
        content: result.content || `# ${topic.trim()}\n\n- [ ] Primer paso`,
        category: result.suggestedCategory || 'general',
        tags: noteTags.length > 0 ? noteTags : ['Personal'],
        scopeTags: [...scopeTags],
        decisionMeta: { source: 'ai_topic' },
        paperStyle: 'dotted',
        paperTone: 'system',
        fontFamily: 'sans',
        fontSize: 'md',
        floatingBoxes: [],
        embeddedImages: [],
        inkStrokes: [],
        linkedBusinessIds: businessId ? [businessId] : [],
        linkedProjectIds: projectId ? [projectId] : [],
        linkedTaskIds: taskId ? [taskId] : [],
        linkedExperimentIds: experimentId ? [experimentId] : [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      onNoteCreated(newNote);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la nota con IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickTopics = [
    'Planificación estratégica de mi próximo año',
    'Plan de lanzamiento de producto o servicio',
    'Presupuesto mensual y metas de ahorro',
    'Resumen de libro o mentoría con acciones',
  ];

  const quickFocusPresets = [
    'Resumen ejecutivo completo de bitácora y decisiones',
    'Extrae solo puntos importantes y compromisos accionables',
    'Sintetiza fechas clave, presupuestos y riesgos',
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-violet-500/30 shadow-2xl p-5 sm:p-6 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-600/25 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Asistente IA de Notas &amp; Bitácoras
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona una nota para resumir su bitácora y puntos clave, o crea una nueva desde cero.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setAssistantMode('analyze')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              assistantMode === 'analyze'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resumir Nota / Bitácora</span>
          </button>
          <button
            type="button"
            onClick={() => setAssistantMode('create')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              assistantMode === 'create'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>Crear Nota por Tema</span>
          </button>
        </div>

        {assistantMode === 'analyze' ? (
          <div className="space-y-4">
            {availableNotes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Aún no tienes notas guardadas para resumir.
                </p>
                <button
                  type="button"
                  onClick={() => setAssistantMode('create')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white text-xs font-bold cursor-pointer"
                >
                  Crear mi primera nota con IA
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Selecciona una nota para analizar ({availableNotes.length})
                    </label>
                    {availableNotes.length > 4 && (
                      <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={noteFilterQuery}
                          onChange={(e) => setNoteFilterQuery(e.target.value)}
                          placeholder="Filtrar notas..."
                          className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {filteredSelectableNotes.map((n) => {
                      const isSel = n.id === selectedNoteId;
                      const preview = (n.content || '')
                        .replace(/^#+\s*/gm, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 95);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setSelectedNoteId(n.id);
                            setSummaryResult(null);
                            setAnalyzeError(null);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSel
                              ? 'bg-violet-500/12 border-violet-500/45 shadow-xs'
                              : 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] hover:border-violet-400/40'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isSel
                                    ? 'text-violet-700 dark:text-violet-300'
                                    : 'text-slate-800 dark:text-slate-100'
                                }`}
                              >
                                {n.title || 'Sin título'}
                              </span>
                              {(n.tags || []).slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-violet-500/10 text-[10px] font-semibold text-violet-600 dark:text-violet-300"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                            {preview && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {preview}
                              </p>
                            )}
                          </div>
                          {isSel && (
                            <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                    ¿Qué enfoque quieres en el resumen? (opcional)
                  </label>
                  <input
                    type="text"
                    value={focusPrompt}
                    onChange={(e) => setFocusPrompt(e.target.value)}
                    placeholder="Ej: Destaca decisiones estratégicas, fechas límite y acuerdos financieros..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {quickFocusPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFocusPrompt(preset)}
                        className="px-2 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-[11px] font-semibold text-violet-700 dark:text-violet-300 cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {analyzeError && (
                  <div className="p-3 rounded-xl bg-rose-500/12 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
                    {analyzeError}
                  </div>
                )}

                {summaryResult && selectedNote && (
                  <div className="p-4 rounded-2xl bg-violet-500/[0.06] dark:bg-violet-500/[0.09] border border-violet-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Resumen de Bitácora IA — {selectedNote.title}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySummary}
                        className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer hover:border-violet-400"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                      {summaryResult.executiveSummary}
                    </p>

                    {(summaryResult.context || summaryResult.resolution) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {summaryResult.context && (
                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/70 dark:border-white/10">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-0.5">
                              Contexto
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                              {summaryResult.context}
                            </p>
                          </div>
                        )}
                        {summaryResult.resolution && (
                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/70 dark:border-white/10">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-0.5">
                              Resolución / Conclusión
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                              {summaryResult.resolution}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {summaryResult.keyPoints.length > 0 && (
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-violet-500" />
                          Puntos Importantes
                        </p>
                        <ul className="space-y-1">
                          {summaryResult.keyPoints.map((pt, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                            >
                              <span className="text-violet-500 font-bold mt-0.5">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summaryResult.actionItems.length > 0 && (
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-fuchsia-500" />
                          Próximos Pasos &amp; Compromisos
                        </p>
                        <ul className="space-y-1">
                          {summaryResult.actionItems.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summaryResult.expectedImpact && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-violet-500/15">
                        <span className="font-bold text-violet-700 dark:text-violet-300">
                          Impacto / Aprendizaje:{' '}
                        </span>
                        {summaryResult.expectedImpact}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {onAppendSummaryToNote && (
                        <button
                          type="button"
                          onClick={handleInsertIntoSelectedNote}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Insertar resumen en esta nota</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCreateBitacoraFromSummary}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:border-violet-500/50 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                        <span>Guardar como nueva Bitácora</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.07]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={isAnalyzing || !selectedNote}
                    onClick={handleAnalyzeSelectedNote}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analizando nota...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>{summaryResult ? 'Volver a Analizar' : 'Resumir Bitácora con IA'}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  ¿Sobre qué tema quieres crear la nota?
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej: Estrategia de captación de clientes Q2, Plan de salud 90 días, Preparación de junta..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickTopics.map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => setTopic(qt)}
                      className="px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-[11px] font-semibold text-violet-700 dark:text-violet-300 cursor-pointer transition-colors"
                    >
                      {qt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1.5">
                  Formato de la hoja
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'estructurada', label: 'Guía Ejecutiva' },
                      { id: 'plan_accion', label: 'Plan de Acción' },
                      { id: 'estudio', label: 'Estudio / Resumen' },
                      { id: 'reunion', label: 'Plantilla Bitácora' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStyle(opt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        style === opt.id
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-violet-400/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
                  Detalles u objetivos específicos (opcional)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ej: Incluye presupuesto estimado en dólares, fechas clave de este trimestre y checklist semanal..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <ScopeAndLinksFields
                data={data}
                scopeTags={scopeTags}
                onToggleScope={toggleScope}
                noteTags={noteTags}
                onChangeNoteTags={setNoteTags}
                businessId={businessId}
                setBusinessId={setBusinessId}
                projectId={projectId}
                setProjectId={setProjectId}
                taskId={taskId}
                setTaskId={setTaskId}
                experimentId={experimentId}
                setExperimentId={setExperimentId}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/12 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.07]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-violet-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando nota...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Crear Nota con IA</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 2. MEETING AUDIO / VOICE NOTE PROCESSOR MODAL ("Procesar Reunión IA")
// ============================================================================
interface MeetingAudioStudioModalProps {
  data: AppStoreData;
  initialAction?: NotesStudioAction | null;
  onClearInitialAction?: () => void;
  onClose: () => void;
  onSaveBitacoraNote: (note: PersonalNote, decisionRecord: StrategicDecision) => void;
  onLoadIntoManualDecision: (draft: DecisionDraftPayload) => void;
}

export const MeetingAudioStudioModal: React.FC<MeetingAudioStudioModalProps> = ({
  data,
  initialAction,
  onClearInitialAction,
  onClose,
  onSaveBitacoraNote,
  onLoadIntoManualDecision,
}) => {
  const [scopeTags, setScopeTags] = useState<('personal' | 'business')[]>(['business']);
  const [noteTags, setNoteTags] = useState<string[]>(['Empresarial', 'Bitácora']);
  const [businessId, setBusinessId] = useState<string>(data.businesses[0]?.id || '');
  const [projectId, setProjectId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [experimentId, setExperimentId] = useState<string>('');
  const [quarter, setQuarter] = useState<string>('Q4 2026');

  const [rawMeetingNotes, setRawMeetingNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioFileLabel, setAudioFileLabel] = useState<string | null>(null);
  const [audioPayload, setAudioPayload] = useState<{ base64: string; mimeType: string } | null>(
    null
  );
  const [autoSaveDirect, setAutoSaveDirect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const pendingStopResolveRef = useRef<
    ((payload: { base64: string; mimeType: string } | null) => void) | null
  >(null);
  const audioUploadRef = useRef<HTMLInputElement>(null);
  const textUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleScope = (tag: 'personal' | 'business') => {
    setScopeTags((prev) => {
      if (prev.includes(tag) && prev.length === 1) return prev;
      return prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(
        'Tu navegador no permite grabación directa. Sube un archivo de audio (.mp3, .wav, .m4a, .ogg).'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = pickSupportedRecorderMime();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      const resolvedMime = (recorder.mimeType || preferredMime || 'audio/webm')
        .split(';')[0]
        .trim();
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const elapsed = Math.max(1, recordingSecondsRef.current);
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        if (blob.size === 0) {
          setError('La grabación salió vacía. Verifica tu micrófono e intenta de nuevo.');
          pendingStopResolveRef.current?.(null);
          pendingStopResolveRef.current = null;
          return;
        }
        try {
          const base64 = await blobToBase64(blob);
          const payload = { base64, mimeType: resolvedMime };
          setAudioPayload(payload);
          setAudioFileLabel(`Grabación en vivo (${elapsed}s)`);
          pendingStopResolveRef.current?.(payload);
        } catch {
          setError('No se pudo procesar el audio grabado.');
          pendingStopResolveRef.current?.(null);
        } finally {
          pendingStopResolveRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(500);
      setIsRecording(true);
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);
    } catch {
      setError(
        'No se pudo acceder al micrófono. Verifica permisos o sube un archivo de audio (.mp3, .wav, .m4a, .ogg).'
      );
    }
  };

  const stopRecording = (): Promise<{ base64: string; mimeType: string } | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return new Promise((resolve) => {
        pendingStopResolveRef.current = resolve;
        mediaRecorderRef.current?.stop();
      });
    }
    return Promise.resolve(audioPayload);
  };

  useEffect(() => {
    if (!initialAction) return;
    if (initialAction.type === 'upload') {
      setAudioPayload({ base64: initialAction.base64, mimeType: initialAction.mimeType });
      setAudioFileLabel(initialAction.fileName);
    } else if (initialAction.type === 'record') {
      void startRecording();
    }
    onClearInitialAction?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 25 * 1024 * 1024) {
      setError('El archivo de audio supera los 25 MB. Comprímelo antes de subirlo.');
      e.target.value = '';
      return;
    }
    try {
      const base64 = await blobToBase64(file);
      const cleanMime = inferAudioMimeType(file);
      setAudioPayload({ base64, mimeType: cleanMime });
      setAudioFileLabel(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    } catch {
      setError('No se pudo leer el archivo de audio.');
    } finally {
      e.target.value = '';
    }
  };

  const handleTextFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const content = await file.text();
      setRawMeetingNotes((prev) =>
        prev.trim() ? `${prev.trim()}\n\n--- ${file.name} ---\n${content}` : content
      );
    } catch {
      setError('No se pudo leer el archivo .txt o .md.');
    } finally {
      e.target.value = '';
    }
  };

  const handleProcess = async () => {
    setError(null);
    let effectiveAudio = audioPayload;
    if (isRecording) {
      effectiveAudio = await stopRecording();
    }
    if (!effectiveAudio && !rawMeetingNotes.trim()) {
      setError('Graba una reunión, sube una nota de voz o pega apuntes para transcribir y estructurar.');
      return;
    }

    setIsProcessing(true);
    try {
      const bizName = scopeTags.includes('business')
        ? data.businesses.find((b) => b.id === businessId)?.name || 'Empresarial'
        : 'Personal / Mentoría';
      const scopeContext = scopeTags
        .map((t) => (t === 'personal' ? 'Personal / Mentoría' : 'Empresarial'))
        .join(' + ');

      const { ok, status, data: result } = await fetchJsonWithTimeout<any>(
        '/api/gemini/meeting-minutes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: effectiveAudio?.base64,
            mimeType: effectiveAudio?.mimeType,
            rawNotes: rawMeetingNotes.trim(),
            businessName: bizName,
            scopeContext,
          }),
        },
        90000
      );

      if (!ok) {
        throw new Error(result.error || `Error procesando el acta (${status})`);
      }

      const m = result.minutes || result;
      const generatedTitle = String(m.title || 'Acta / Bitácora de Reunión').trim();
      const generatedContext = String(m.context || '').trim();
      const generatedDecision = String(m.decision || m.context || 'Resumen registrado por IA.').trim();
      const generatedOutcome = String(m.expectedOutcome || '').trim();
      const generatedPoints: string[] = Array.isArray(m.keyPoints)
        ? m.keyPoints.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [];
      const generatedTranscript = String(result.transcript || rawMeetingNotes.trim()).trim();
      const resolvedSource: 'ai_audio' | 'notellm' = effectiveAudio ? 'ai_audio' : 'notellm';

      if (!autoSaveDirect) {
        onLoadIntoManualDecision({
          title: generatedTitle,
          context: generatedContext,
          decision: generatedDecision,
          keyPointsText: generatedPoints.join('\n'),
          expectedOutcome: generatedOutcome,
          quarter,
          scopeTags: [...scopeTags],
          businessId,
          projectId,
          taskId,
          experimentId,
          transcript: generatedTranscript,
          source: resolvedSource,
        });
        return;
      }

      const nowIso = new Date().toISOString();
      const noteId = `pnote_${Date.now()}`;
      const newNote: PersonalNote = {
        id: noteId,
        title: generatedTitle,
        content: buildBitacoraMarkdown({
          title: generatedTitle,
          context: generatedContext,
          decision: generatedDecision,
          keyPoints: generatedPoints,
          expectedOutcome: generatedOutcome,
          quarter,
          scopeTags,
          transcript: generatedTranscript,
        }),
        category: 'bitacora',
        tags: noteTags.length > 0 ? noteTags : ['Empresarial', 'Bitácora'],
        scopeTags: [...scopeTags],
        decisionMeta: {
          context: generatedContext,
          decision: generatedDecision,
          keyPoints: generatedPoints,
          expectedOutcome: generatedOutcome,
          quarter,
          transcript: generatedTranscript || undefined,
          source: resolvedSource,
        },
        paperStyle: 'lined',
        paperTone: 'system',
        fontFamily: 'sans',
        fontSize: 'md',
        floatingBoxes: [],
        embeddedImages: [],
        inkStrokes: [],
        linkedBusinessIds: businessId ? [businessId] : [],
        linkedProjectIds: projectId ? [projectId] : [],
        linkedTaskIds: taskId ? [taskId] : [],
        linkedExperimentIds: experimentId ? [experimentId] : [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const decisionRecord: StrategicDecision = {
        id: `sd_${Date.now()}`,
        title: generatedTitle,
        context: generatedContext,
        decision: generatedDecision,
        expectedOutcome: generatedOutcome,
        date: nowIso.split('T')[0],
        quarter,
        businessId: businessId || undefined,
        scopeTags: [...scopeTags],
        experimentId: experimentId || undefined,
        keyPoints: generatedPoints.length > 0 ? generatedPoints : undefined,
        transcript: generatedTranscript || undefined,
        source: resolvedSource,
      };

      onSaveBitacoraNote(newNote, decisionRecord);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error procesando audio o notas con IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-fuchsia-500/35 shadow-2xl p-5 sm:p-6 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-600/25 shrink-0">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Procesar Reunión IA / Audio a Bitácora
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Graba una junta o sube un audio: transcribo y extraigo título, contexto, resolución y puntos clave en tu nota.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={audioUploadRef}
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm,.aac"
          onChange={handleAudioFileChange}
          className="hidden"
        />
        <input
          ref={textUploadRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={handleTextFileImport}
          className="hidden"
        />

        {/* Audio Capture Bar */}
        <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isRecording ? (
              <button
                type="button"
                onClick={() => void stopRecording()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 animate-pulse cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener Grabación ({recordingSeconds}s)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startRecording()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Grabar Reunión / Voz</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => audioUploadRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:border-violet-500/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-violet-500" />
              <span>Subir Audio (.mp3/.m4a/.wav)</span>
            </button>

            <button
              type="button"
              onClick={() => textUploadRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:border-violet-500/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>Importar .txt / .md</span>
            </button>
          </div>

          {audioFileLabel && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-500/12 border border-violet-500/30 text-xs text-violet-800 dark:text-violet-200 font-semibold">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="truncate">Audio listo: {audioFileLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAudioPayload(null);
                  setAudioFileLabel(null);
                }}
                className="text-rose-500 hover:text-rose-400 text-[11px] font-bold cursor-pointer shrink-0"
              >
                Quitar
              </button>
            </div>
          )}

          <textarea
            rows={4}
            value={rawMeetingNotes}
            onChange={(e) => setRawMeetingNotes(e.target.value)}
            placeholder="Opcional: pega aquí apuntes rápidos, transcripción de reunión o resumen de mentoría para procesarlo junto con el audio (o sin audio)..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-y"
          />
        </div>

        {/* Scope & Cross-Module Link Selectors */}
        <ScopeAndLinksFields
          data={data}
          scopeTags={scopeTags}
          onToggleScope={toggleScope}
          noteTags={noteTags}
          onChangeNoteTags={setNoteTags}
          businessId={businessId}
          setBusinessId={setBusinessId}
          projectId={projectId}
          setProjectId={setProjectId}
          taskId={taskId}
          setTaskId={setTaskId}
          experimentId={experimentId}
          setExperimentId={setExperimentId}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSaveDirect}
              onChange={(e) => setAutoSaveDirect(e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span>Guardar automáticamente como Nota Bitácora y abrir hoja</span>
          </label>

          <input
            type="text"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            placeholder="Q4 2026"
            className="w-28 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/12 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => void handleProcess()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-fuchsia-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transcribiendo y estructurando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {autoSaveDirect
                    ? 'Transcribir y Crear Nota Bitácora'
                    : 'Transcribir y Revisar Campos'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. MANUAL DECISION / BITÁCORA MODAL ("Nueva Decisión Manual")
// ============================================================================
interface ManualDecisionModalProps {
  data: AppStoreData;
  initialDraft?: DecisionDraftPayload | null;
  onClose: () => void;
  onSaveBitacoraNote: (note: PersonalNote, decisionRecord: StrategicDecision) => void;
}

export const ManualDecisionModal: React.FC<ManualDecisionModalProps> = ({
  data,
  initialDraft,
  onClose,
  onSaveBitacoraNote,
}) => {
  const [title, setTitle] = useState(initialDraft?.title || '');
  const [quarter, setQuarter] = useState(initialDraft?.quarter || 'Q4 2026');
  const [context, setContext] = useState(initialDraft?.context || '');
  const [decision, setDecision] = useState(initialDraft?.decision || '');
  const [keyPointsText, setKeyPointsText] = useState(initialDraft?.keyPointsText || '');
  const [expectedOutcome, setExpectedOutcome] = useState(initialDraft?.expectedOutcome || '');
  const [scopeTags, setScopeTags] = useState<('personal' | 'business')[]>(
    initialDraft?.scopeTags || ['business']
  );
  const [noteTags, setNoteTags] = useState<string[]>(() => {
    const base: string[] = [];
    const sc = initialDraft?.scopeTags || ['business'];
    if (sc.includes('business')) base.push('Empresarial');
    if (sc.includes('personal')) base.push('Personal');
    base.push('Bitácora');
    return base;
  });
  const [businessId, setBusinessId] = useState(
    initialDraft?.businessId ?? (data.businesses[0]?.id || '')
  );
  const [projectId, setProjectId] = useState(initialDraft?.projectId || '');
  const [taskId, setTaskId] = useState(initialDraft?.taskId || '');
  const [experimentId, setExperimentId] = useState(initialDraft?.experimentId || '');

  const toggleScope = (tag: 'personal' | 'business') => {
    setScopeTags((prev) => {
      if (prev.includes(tag) && prev.length === 1) return prev;
      return prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim()) return;

    const parsedKeyPoints = keyPointsText
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    const nowIso = new Date().toISOString();
    const resolvedSource = initialDraft?.source || 'manual';
    const transcript = initialDraft?.transcript || '';

    const newNote: PersonalNote = {
      id: `pnote_${Date.now()}`,
      title: title.trim(),
      content: buildBitacoraMarkdown({
        title: title.trim(),
        context: context.trim(),
        decision: decision.trim(),
        keyPoints: parsedKeyPoints,
        expectedOutcome: expectedOutcome.trim(),
        quarter: quarter.trim(),
        scopeTags,
        transcript,
      }),
      category: 'bitacora',
      tags: noteTags.length > 0 ? noteTags : ['Empresarial', 'Bitácora'],
      scopeTags: [...scopeTags],
      decisionMeta: {
        context: context.trim(),
        decision: decision.trim(),
        keyPoints: parsedKeyPoints,
        expectedOutcome: expectedOutcome.trim(),
        quarter: quarter.trim(),
        transcript: transcript || undefined,
        source: resolvedSource,
      },
      paperStyle: 'lined',
      paperTone: 'system',
      fontFamily: 'sans',
      fontSize: 'md',
      floatingBoxes: [],
      embeddedImages: [],
      inkStrokes: [],
      linkedBusinessIds: businessId ? [businessId] : [],
      linkedProjectIds: projectId ? [projectId] : [],
      linkedTaskIds: taskId ? [taskId] : [],
      linkedExperimentIds: experimentId ? [experimentId] : [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const decisionRecord: StrategicDecision = {
      id: `sd_${Date.now()}`,
      title: title.trim(),
      context: context.trim(),
      decision: decision.trim(),
      expectedOutcome: expectedOutcome.trim(),
      date: nowIso.split('T')[0],
      quarter: quarter.trim() || 'Q4 2026',
      businessId: businessId || undefined,
      scopeTags: [...scopeTags],
      experimentId: experimentId || undefined,
      keyPoints: parsedKeyPoints.length > 0 ? parsedKeyPoints : undefined,
      transcript: transcript || undefined,
      source: resolvedSource === 'ai_topic' ? 'manual' : resolvedSource,
    };

    onSaveBitacoraNote(newNote, decisionRecord);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-violet-500/35 shadow-2xl p-5 sm:p-6 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-600/25 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Registrar Decisión / Nota Bitácora
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documenta título, contexto, resolución y puntos clave como una nota editable y vinculada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Título del Acta / Decisión / Mentoría *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cambio de modelo de precios o aprendizaje de mentor..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Trimestre / Periodo
            </label>
            <input
              type="text"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              placeholder="Q4 2026"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
            Contexto &amp; Motivo
          </label>
          <textarea
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="¿Qué problema u oportunidad motivó esta reunión o decisión?..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-y"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
            Resolución / Decisión Adoptada *
          </label>
          <textarea
            rows={2}
            required
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="¿Qué se decidió exactamente?..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Puntos Clave de la Reunión (uno por línea)
            </label>
            <textarea
              rows={3}
              value={keyPointsText}
              onChange={(e) => setKeyPointsText(e.target.value)}
              placeholder={'- Punto importante 1\n- Acuerdo operativo 2'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-y"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-1">
              Impacto / Resultado Esperado
            </label>
            <textarea
              rows={3}
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="¿Qué resultado medible o transformación se espera tras aplicar esto?..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-y"
            />
          </div>
        </div>

        <ScopeAndLinksFields
          data={data}
          scopeTags={scopeTags}
          onToggleScope={toggleScope}
          noteTags={noteTags}
          onChangeNoteTags={setNoteTags}
          businessId={businessId}
          setBusinessId={setBusinessId}
          projectId={projectId}
          setProjectId={setProjectId}
          taskId={taskId}
          setTaskId={setTaskId}
          experimentId={experimentId}
          setExperimentId={setExperimentId}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-violet-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Guardar Nota Bitácora</span>
          </button>
        </div>
      </form>
    </div>
  );
};
