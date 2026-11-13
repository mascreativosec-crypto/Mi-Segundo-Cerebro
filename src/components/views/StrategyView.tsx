import React, { useState, useRef } from 'react';
import { AppStoreData } from '../../services/storage';
import { StrategicDecision } from '../../types';
import {
  Layers,
  Plus,
  BookOpen,
  Mic,
  Square,
  Upload,
  Sparkles,
  FileAudio,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2,
  FlaskConical,
  User,
  Building2,
} from 'lucide-react';

interface StrategyViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

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

export const StrategyView: React.FC<StrategyViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'personal' | 'business'>('all');
  const [showAddDecision, setShowAddDecision] = useState(false);
  const [showAiMinutesStudio, setShowAiMinutesStudio] = useState(false);

  // Decision form fields
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const [sourceType, setSourceType] = useState<StrategicDecision['source']>('manual');
  const [quarter, setQuarter] = useState('Q4 2026');
  const [businessTargetId, setBusinessTargetId] = useState<string>(data.businesses[0]?.id || '');
  const [scopeTags, setScopeTags] = useState<('personal' | 'business')[]>(['business']);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>('');

  // AI Audio & NoteLLM Studio state
  const [rawMeetingNotes, setRawMeetingNotes] = useState('');
  const [noteLlmEndpoint, setNoteLlmEndpoint] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioFileLabel, setAudioFileLabel] = useState<string | null>(null);
  const [audioPayload, setAudioPayload] = useState<{ base64: string; mimeType: string } | null>(null);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Expanded transcript state
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUploadRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    setAiError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await blobToBase64(blob);
        setAudioPayload({ base64, mimeType });
        setAudioFileLabel(`Grabación en vivo (${Math.max(1, recordingSeconds)}s)`);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setAiError(
        'No se pudo acceder al micrófono. Verifica permisos o sube un archivo de audio (.mp3, .wav, .m4a).'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiError(null);
    try {
      const base64 = await blobToBase64(file);
      setAudioPayload({ base64, mimeType: file.type || 'audio/mp3' });
      setAudioFileLabel(file.name);
    } catch {
      setAiError('No se pudo leer el archivo de audio.');
    } finally {
      e.target.value = '';
    }
  };

  const toggleScopeTag = (tag: 'personal' | 'business') => {
    setScopeTags((prev) => {
      const exists = prev.includes(tag);
      if (exists && prev.length === 1) return prev; // Keep at least 1 selected
      return exists ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  };

  const handleGenerateMinutes = async () => {
    if (!audioPayload && !rawMeetingNotes.trim()) {
      setAiError('Graba un audio, sube un archivo de reunión o pega notas/transcripción de NoteLLM.');
      return;
    }

    setIsProcessingAi(true);
    setAiError(null);
    try {
      const bizName = scopeTags.includes('business')
        ? data.businesses.find((b) => b.id === businessTargetId)?.name || 'Empresarial'
        : 'Mentoría / Experimento Personal';
      const scopeContext = scopeTags
        .map((t) => (t === 'personal' ? 'Personal / Mentoría' : 'Empresarial'))
        .join(' + ');

      const resp = await fetch('/api/gemini/meeting-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioPayload?.base64,
          mimeType: audioPayload?.mimeType,
          rawNotes: rawMeetingNotes.trim(),
          businessName: bizName,
          scopeContext,
        }),
      });
      const result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.error || 'Error procesando el acta');
      }

      const m = result.minutes || result;
      setTitle(m.title || 'Acta / Nota Estructurada');
      setContext(m.context || '');
      setDecision(m.decision || '');
      setExpectedOutcome(m.expectedOutcome || '');
      setKeyPoints(Array.isArray(m.keyPoints) ? m.keyPoints : []);
      setTranscript(result.transcript || rawMeetingNotes.trim());
      setSourceType(audioPayload ? 'ai_audio' : 'notellm');
      setShowAddDecision(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generando acta con IA';
      setAiError(msg);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decision.trim()) return;

    const effectiveExperimentId = scopeTags.includes('personal') && selectedExperimentId
      ? selectedExperimentId
      : undefined;

    const newDecision: StrategicDecision = {
      id: `sd_${Date.now()}`,
      title: title.trim(),
      context: context.trim(),
      decision: decision.trim(),
      expectedOutcome: expectedOutcome.trim(),
      date: new Date().toISOString().split('T')[0],
      quarter,
      businessId: scopeTags.includes('business') ? businessTargetId || undefined : undefined,
      scopeTags: [...scopeTags],
      experimentId: effectiveExperimentId,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
      transcript: transcript.trim() || undefined,
      source: sourceType,
    };

    onUpdateData((prev) => ({
      ...prev,
      strategicDecisions: [newDecision, ...prev.strategicDecisions],
      personalExperiments: effectiveExperimentId
        ? (prev.personalExperiments || []).map((exp) =>
            exp.id === effectiveExperimentId
              ? {
                  ...exp,
                  linkedDecisionIds: [...(exp.linkedDecisionIds || []), newDecision.id],
                }
              : exp
          )
        : prev.personalExperiments,
    }));

    setShowAddDecision(false);
    setShowAiMinutesStudio(false);
    setTitle('');
    setContext('');
    setDecision('');
    setExpectedOutcome('');
    setKeyPoints([]);
    setTranscript('');
    setRawMeetingNotes('');
    setAudioPayload(null);
    setAudioFileLabel(null);
    setSelectedExperimentId('');
    setSourceType('manual');
  };

  const handleLinkExistingDecisionToExperiment = (decisionId: string, expId: string) => {
    if (!expId) return;
    onUpdateData((prev) => ({
      ...prev,
      strategicDecisions: prev.strategicDecisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              experimentId: expId,
              scopeTags: d.scopeTags?.includes('personal')
                ? d.scopeTags
                : [...(d.scopeTags || []), 'personal'],
            }
          : d
      ),
      personalExperiments: (prev.personalExperiments || []).map((exp) =>
        exp.id === expId
          ? {
              ...exp,
              linkedDecisionIds: Array.from(
                new Set([...(exp.linkedDecisionIds || []), decisionId])
              ),
            }
          : exp
      ),
    }));
  };

  const handleDeleteDecision = (id: string) => {
    onUpdateData((prev) => ({
      ...prev,
      strategicDecisions: prev.strategicDecisions.filter((d) => d.id !== id),
    }));
  };

  const filteredDecisions = data.strategicDecisions.filter((d) => {
    const tags = d.scopeTags || (d.businessId ? ['business'] : ['personal']);
    if (scopeFilter !== 'all' && !tags.includes(scopeFilter)) return false;
    if (selectedBusinessId === 'all') return true;
    return d.businessId === selectedBusinessId;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 shrink-0">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dirección & Estrategia Ejecutiva
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Bitácora directiva, mentorías personales y procesador IA de actas por voz o NoteLLM.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiMinutesStudio((prev) => !prev)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <FileAudio className="w-3.5 h-3.5" />
              <span>Procesar Reunión IA / NoteLLM</span>
            </button>
            <button
              onClick={() => {
                setSourceType('manual');
                setShowAddDecision(!showAddDecision);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nueva Decisión Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Meeting Minutes & Audio / NoteLLM Studio */}
      {showAiMinutesStudio && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-purple-500/35 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Extractor de Actas &amp; Mentorías (Audio en Vivo / Archivo / NoteLLM)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Etiqueta si el audio es Personal (mentorías / experimentos) o Empresarial (juntas de equipo) y envíalo al módulo correspondiente.
              </p>
            </div>

            {/* Dual Scope Tags in AI Studio */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Etiquetas:
              </span>
              <button
                type="button"
                onClick={() => toggleScopeTag('personal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  scopeTags.includes('personal')
                    ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal</span>
              </button>
              <button
                type="button"
                onClick={() => toggleScopeTag('business')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  scopeTags.includes('business')
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresarial</span>
              </button>
            </div>
          </div>

          {scopeTags.includes('personal') && (data.personalExperiments || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-fuchsia-500/[0.06] border border-fuchsia-500/20">
              <FlaskConical className="w-4 h-4 text-fuchsia-500 shrink-0" />
              <span className="text-xs font-semibold text-fuchsia-800 dark:text-fuchsia-200">
                Enviar notas de este audio a Experimento Personal:
              </span>
              <select
                value={selectedExperimentId}
                onChange={(e) => setSelectedExperimentId(e.target.value)}
                className="flex-1 min-w-[200px] bg-white dark:bg-slate-900 border border-fuchsia-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="">No vincular por ahora</option>
                {(data.personalExperiments || []).map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} ({exp.inspiration})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Audio Controls */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Grabar Reunión</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-500" />
                <span className="tabular-nums">Detener ({recordingSeconds}s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => audioUploadRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-purple-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-purple-500" />
              <span>Subir Audio (.mp3, .wav, .m4a)</span>
            </button>
            <input
              ref={audioUploadRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            {audioFileLabel && (
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/15 px-3 py-1 rounded-xl border border-purple-500/25">
                {audioFileLabel}
              </span>
            )}
          </div>

          {/* NoteLLM text / optional VPS webhook */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Notas sin procesar o Transcripción de NoteLLM (Opcional si usas audio)
              </label>
              <textarea
                rows={4}
                placeholder="Pega aquí la transcripción o resumen de NoteLLM / minutos de reunión para extraer automáticamente los puntos importantes y decisiones..."
                value={rawMeetingNotes}
                onChange={(e) => setRawMeetingNotes(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="url"
                  placeholder="Webhook VPS NoteLLM opcional (ej: https://tudominio.com/api/notellm-hook)"
                  value={noteLlmEndpoint}
                  onChange={(e) => setNoteLlmEndpoint(e.target.value)}
                  className="flex-1 bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 dark:text-slate-300"
                />
              </div>

              <button
                type="button"
                disabled={isProcessingAi}
                onClick={handleGenerateMinutes}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessingAi ? 'Transcribiendo y extrayendo acta...' : 'Extraer Acta & Puntos Clave'}</span>
              </button>
            </div>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {aiError}
            </div>
          )}
        </div>
      )}

      {/* Add / Preview Decision Form */}
      {showAddDecision && (
        <form
          onSubmit={handleAddDecision}
          className="p-6 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-indigo-500/30 shadow-xl space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              {sourceType === 'manual'
                ? 'Registrar Decisión / Nota Estratégica'
                : 'Acta Generada por IA — Revisa y Guarda'}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleScopeTag('personal')}
                className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                  scopeTags.includes('personal')
                    ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500'
                }`}
              >
                <User className="w-3 h-3" />
                <span>Personal</span>
              </button>
              <button
                type="button"
                onClick={() => toggleScopeTag('business')}
                className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                  scopeTags.includes('business')
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-500'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Empresarial</span>
              </button>
              {sourceType !== 'manual' && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300">
                  {sourceType === 'ai_audio' ? 'Audio IA' : 'NoteLLM'}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Título del Acta / Decisión / Mentoría
              </label>
              <input
                type="text"
                placeholder="Ej: Cambio de modelo de precios o aprendizaje de mentor..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {scopeTags.includes('business') && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Empresa Vinculada
                </label>
                <select
                  value={businessTargetId}
                  onChange={(e) => setBusinessTargetId(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  {data.businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.logoEmoji} {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scopeTags.includes('personal') && (
              <div>
                <label className="text-[11px] font-semibold text-fuchsia-700 dark:text-fuchsia-300 block mb-1">
                  Vincular a Experimento Personal
                </label>
                <select
                  value={selectedExperimentId}
                  onChange={(e) => setSelectedExperimentId(e.target.value)}
                  className="w-full bg-slate-100/80 dark:bg-black/40 border border-fuchsia-500/30 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Solo bitácora personal</option>
                  {(data.personalExperiments || []).map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Trimestre / Periodo
              </label>
              <input
                type="text"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Contexto & Motivo
            </label>
            <textarea
              rows={2}
              placeholder="¿Qué problema u oportunidad motivó esta reunión o decisión?..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Resolución / Decisión Adoptada
            </label>
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
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Puntos Clave de la Reunión (uno por línea)
            </label>
            <textarea
              rows={3}
              placeholder="- Punto importante 1&#10;- Acuerdo operativo 2"
              value={keyPoints.join('\n')}
              onChange={(e) =>
                setKeyPoints(
                  e.target.value
                    .split('\n')
                    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
                    .filter(Boolean)
                )
              }
              className="w-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Impacto / Resultado Esperado
            </label>
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
              Guardar en Bitácora
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
              Historial de resoluciones ejecutivas, actas procesadas por voz y puntos clave.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-center gap-1 text-xs font-semibold">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'personal', label: 'Personal' },
                { id: 'business', label: 'Empresarial' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScopeFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                    scopeFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">Todas las Empresas</option>
              {data.businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.logoEmoji} {biz.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No hay decisiones registradas para este filtro.
            </div>
          ) : (
            filteredDecisions.map((dec) => {
              const biz = dec.businessId ? data.businesses.find((b) => b.id === dec.businessId) : null;
              const linkedExp = dec.experimentId
                ? (data.personalExperiments || []).find((ex) => ex.id === dec.experimentId)
                : null;
              const tags = dec.scopeTags || (dec.businessId ? ['business'] : ['personal']);
              const isTranscriptOpen = Boolean(expandedTranscripts[dec.id]);

              return (
                <div
                  key={dec.id}
                  className="p-5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {dec.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {tags.includes('personal') && (
                        <span className="text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/15 px-2.5 py-0.5 rounded-lg border border-fuchsia-500/25">
                          Personal
                        </span>
                      )}
                      {tags.includes('business') && (
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-2.5 py-0.5 rounded-lg border border-blue-500/25">
                          Empresarial
                        </span>
                      )}
                      {dec.source && dec.source !== 'manual' && (
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-lg border border-purple-500/25">
                          {dec.source === 'ai_audio' ? 'Audio IA' : 'NoteLLM'}
                        </span>
                      )}
                      {biz && (
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                          {biz.name}
                        </span>
                      )}
                      {linkedExp && (
                        <span className="text-[11px] font-semibold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-500/10 px-2.5 py-0.5 rounded-lg border border-fuchsia-500/20 inline-flex items-center gap-1">
                          <FlaskConical className="w-3 h-3" />
                          {linkedExp.title}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                        {dec.quarter} · {dec.date}
                      </span>
                      <button
                        onClick={() => handleDeleteDecision(dec.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Eliminar acta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {dec.context && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-500 dark:text-slate-400 font-semibold">
                        Contexto:
                      </strong>{' '}
                      {dec.context}
                    </p>
                  )}

                  <p className="text-xs text-indigo-900 dark:text-indigo-200 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <strong className="text-indigo-700 dark:text-indigo-400 font-bold">
                      Resolución:
                    </strong>{' '}
                    {dec.decision}
                  </p>

                  {dec.keyPoints && dec.keyPoints.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Puntos Importantes:
                      </span>
                      {dec.keyPoints.map((kp, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {dec.expectedOutcome && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong className="font-semibold text-slate-600 dark:text-slate-300">
                        Impacto previsto:
                      </strong>{' '}
                      {dec.expectedOutcome}
                    </p>
                  )}

                  {dec.transcript && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTranscripts((prev) => ({
                            ...prev,
                            [dec.id]: !prev[dec.id],
                          }))
                        }
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {isTranscriptOpen ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Ocultar transcripción</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Ver transcripción original</span>
                          </>
                        )}
                      </button>
                      {isTranscriptOpen && (
                        <div className="mt-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {dec.transcript}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick link to send personal/mentor note to a Personal Experiment */}
                  {(data.personalExperiments || []).length > 0 && !linkedExp && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05] flex flex-wrap items-center gap-2">
                      <FlaskConical className="w-3.5 h-3.5 text-fuchsia-500" />
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleLinkExistingDecisionToExperiment(dec.id, e.target.value);
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200"
                      >
                        <option value="">Enviar a Experimento Personal...</option>
                        {(data.personalExperiments || []).map((exp) => (
                          <option key={exp.id} value={exp.id}>
                            {exp.title}
                          </option>
                        ))}
                      </select>
                    </div>
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
