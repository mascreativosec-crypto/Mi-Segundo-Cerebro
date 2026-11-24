import React, { useState, useRef } from 'react';
import { AppStoreData } from '../../services/storage';
import { fetchJsonWithTimeout } from '../../utils/fetchWithTimeout';
import {
  Bot,
  Send,
  Mic,
  Square,
  Paperclip,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Globe,
  X,
  FileText,
  DollarSign,
  BellRing,
  CheckSquare,
  Compass,
} from 'lucide-react';
import { BusinessTask, FinancialTransaction, NoteReminderItem, ReminderOriginModule } from '../../types';

interface AiAssistantViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onNavigate: (view: string) => void;
}

interface ExecutedActionChip {
  name: string;
  label: string;
  targetView?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachmentName?: string;
  actions?: ExecutedActionChip[];
  timestamp: string;
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

const inferAttachmentMime = (file: File): string => {
  if (file.type) return file.type.split(';')[0].trim();
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4') || lower.endsWith('.aac')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) return 'audio/ogg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'image/png';
};

const VALID_ORIGINS: ReminderOriginModule[] = [
  'personal',
  'business',
  'super_manana',
  'super_noche',
  'finanzas',
  'fisico',
  'sabiduria',
  'sistema',
  'general',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  data,
  onUpdateData,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'channels'>('assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      text: 'Soy el Asistente Operativo de Segundo Cerebro 4.0. Puedo crear recordatorios, agendar o completar tareas, registrar pagos/transferencias desde texto, audio o comprobantes (imagen/PDF), y abrir cualquier módulo del sistema. ¿Qué ejecutamos hoy?',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioData, setAudioData] = useState<{ base64: string; mimeType: string; label: string } | null>(null);

  // File attachment (receipt image or PDF)
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; name: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const pendingStopResolveRef = useRef<
    ((payload: { base64: string; mimeType: string; label: string } | null) => void) | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Webhook simulator for Channels tab
  const [testChannel, setTestChannel] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp');
  const [testWebhookText, setTestWebhookText] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const startVoice = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'Tu navegador no soporta grabación directa. Puedes adjuntar una nota de voz o escribir tu solicitud.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = pickSupportedRecorderMime();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      const resolvedMime = (recorder.mimeType || preferredMime || 'audio/webm').split(';')[0].trim();
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const elapsed = Math.max(1, recordingSecondsRef.current);
        const blob = new Blob(chunksRef.current, { type: resolvedMime });
        if (blob.size === 0) {
          pendingStopResolveRef.current?.(null);
          pendingStopResolveRef.current = null;
          return;
        }
        try {
          const base64 = await blobToBase64(blob);
          const payload = {
            base64,
            mimeType: resolvedMime,
            label: `Nota de voz (${elapsed}s)`,
          };
          setAudioData(payload);
          pendingStopResolveRef.current?.(payload);
        } catch {
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
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'No se pudo activar el micrófono. Escribe tu solicitud o adjunta una nota de voz/comprobante.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const stopVoice = (): Promise<{ base64: string; mimeType: string; label: string } | null> => {
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
    return Promise.resolve(audioData);
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await blobToBase64(file);
      const mimeType = inferAttachmentMime(file);
      if (mimeType.startsWith('audio/')) {
        setAudioData({
          base64,
          mimeType,
          label: file.name,
        });
      } else {
        setFileData({
          base64,
          mimeType,
          name: file.name,
        });
      }
    } finally {
      e.target.value = '';
    }
  };

  // Execute tool actions returned by /api/gemini/assistant on AppStoreData
  const applyAssistantActions = (
    rawActions: { name: string; args: Record<string, unknown> }[]
  ): ExecutedActionChip[] => {
    const chips: ExecutedActionChip[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    rawActions.forEach((act) => {
      const args = act.args || {};

      if (act.name === 'create_reminder') {
        const title = String(args.title || 'Recordatorio');
        const origin = VALID_ORIGINS.includes(args.originModule as ReminderOriginModule)
          ? (args.originModule as ReminderOriginModule)
          : 'sistema';

        const newRem: NoteReminderItem = {
          id: `nr_ai_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          title,
          content: String(args.content || ''),
          category: origin === 'super_manana' ? 'super_manana' : 'general',
          originModule: origin,
          targetView: origin === 'business' ? 'business' : origin === 'finanzas' ? 'personal_finances' : 'second_brain',
          reminderDate: String(args.reminderDate || todayStr),
          reminderTime: args.reminderTime ? String(args.reminderTime) : undefined,
          showInMiDia: args.showInMiDia !== false,
          completed: false,
          pinned: false,
          source: 'ai_assistant',
          createdAt: new Date().toISOString(),
        };

        onUpdateData((prev) => ({
          ...prev,
          notesReminders: [newRem, ...(prev.notesReminders || [])],
        }));

        chips.push({
          name: 'create_reminder',
          label: `Recordatorio: ${title}`,
          targetView: 'second_brain',
        });
      } else if (act.name === 'create_task') {
        const title = String(args.title || 'Nueva tarea');
        const scope = args.scope === 'business' ? 'business' : 'personal';
        const priority =
          args.priority === 'urgent_important' ||
          args.priority === 'important' ||
          args.priority === 'urgent' ||
          args.priority === 'normal'
            ? args.priority
            : 'important';
        const dueDate = String(args.dueDate || todayStr);
        const taskId = `task_ai_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
        const remind = Boolean(args.remindInInbox);

        const newTask: BusinessTask = {
          id: taskId,
          title,
          scope,
          businessId: scope === 'business' ? data.businesses[0]?.id : undefined,
          priority,
          status: 'todo',
          isDelegated: false,
          dueDate,
          estimatedMinutes: Number(args.estimatedMinutes) || 30,
          tags: [scope === 'business' ? 'Empresarial' : 'Personal', 'AsistenteIA'],
          remindInInbox: remind,
        };

        onUpdateData((prev) => ({
          ...prev,
          tasks: [newTask, ...prev.tasks],
          notesReminders: remind
            ? [
                {
                  id: `nr_task_ai_${Date.now()}`,
                  title,
                  content: `Tarea agendada (${scope}) · Vence ${dueDate}`,
                  category: 'tarea',
                  originModule: scope === 'business' ? 'business' : 'personal',
                  targetView: scope === 'business' ? 'business' : 'tasks_general',
                  linkedTaskId: taskId,
                  reminderDate: dueDate,
                  showInMiDia: true,
                  completed: false,
                  pinned: false,
                  source: 'ai_assistant',
                  createdAt: new Date().toISOString(),
                },
                ...(prev.notesReminders || []),
              ]
            : prev.notesReminders,
        }));

        chips.push({
          name: 'create_task',
          label: `Tarea agendada: ${title}`,
          targetView: scope === 'business' ? 'business' : 'tasks_general',
        });
      } else if (act.name === 'complete_task') {
        const query = String(args.taskQuery || '').toLowerCase();
        onUpdateData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.status !== 'done' && query && t.title.toLowerCase().includes(query)
              ? { ...t, status: 'done', completedAt: new Date().toISOString() }
              : t
          ),
        }));
        chips.push({
          name: 'complete_task',
          label: `Tarea marcada completada (${args.taskQuery || ''})`,
          targetView: 'tasks_general',
        });
      } else if (act.name === 'register_payment') {
        const txType: FinancialTransaction['type'] =
          args.type === 'income' ||
          args.type === 'investment' ||
          args.type === 'debt_payment' ||
          args.type === 'expense'
            ? args.type
            : 'expense';
        const amount = Math.max(0, Number(args.amount) || 0);
        const description = String(args.description || 'Movimiento desde Asistente IA');
        const category = String(args.category || (txType === 'income' ? 'Ingresos' : 'Gastos / Pagos'));
        const date = String(args.date || todayStr);
        const scope = args.scope === 'business' ? 'business' : 'personal';

        onUpdateData((prev) => {
          const defaultBank = prev.personalFinances.bankAccounts[0];
          const newTx: FinancialTransaction = {
            id: `tx_ai_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            type: txType,
            category,
            amount,
            date,
            description,
            scope,
            bankAccountId: defaultBank?.id,
          };

          const delta = txType === 'income' ? amount : -amount;
          const updatedBanks = prev.personalFinances.bankAccounts.map((ba, idx) =>
            idx === 0 ? { ...ba, currentBalance: Math.max(0, ba.currentBalance + delta) } : ba
          );

          return {
            ...prev,
            personalFinances: {
              ...prev.personalFinances,
              bankAccounts: updatedBanks,
              transactions: [newTx, ...prev.personalFinances.transactions],
            },
          };
        });

        chips.push({
          name: 'register_payment',
          label: `${txType === 'income' ? '+' : '-'}$${amount.toLocaleString()} · ${description}`,
          targetView: 'personal_finances',
        });
      } else if (act.name === 'navigate_module') {
        const viewId = String(args.viewId || 'mi_dia');
        chips.push({
          name: 'navigate_module',
          label: `Ir a ${viewId}`,
          targetView: viewId,
        });
      }
    });

    return chips;
  };

  const handleSend = async (customText?: string) => {
    const promptText = (customText ?? input).trim();
    let currentAudio = audioData;
    if (isRecording && !customText) {
      currentAudio = await stopVoice();
    }
    const currentFile = fileData;
    if (!promptText && !currentAudio && !currentFile) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text:
        promptText ||
        (currentFile ? `Comprobante adjunto: ${currentFile.name}` : currentAudio?.label || 'Audio enviado'),
      attachmentName: currentFile?.name || currentAudio?.label,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAudioData(null);
    setFileData(null);
    setIsSending(true);

    try {
      const appSnapshot = {
        openTasks: data.tasks
          .filter((t) => t.status !== 'done')
          .slice(0, 12)
          .map((t) => ({ id: t.id, title: t.title, scope: t.scope, dueDate: t.dueDate })),
        bankAccounts: data.personalFinances.bankAccounts.map((b) => ({
          name: b.name,
          balance: b.currentBalance,
        })),
        creditAccounts: data.personalFinances.creditAccounts.map((c) => ({
          name: c.name,
          remaining: c.currentBalanceRemaining,
        })),
        pendingReminders: (data.notesReminders || []).filter((r) => !r.completed).length,
      };

      const { ok, status, data: result } = await fetchJsonWithTimeout<{
        reply?: string;
        actions?: { name: string; args: Record<string, unknown> }[];
        error?: string;
      }>(
        '/api/gemini/assistant',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptText,
            audioBase64: currentAudio?.base64,
            audioMimeType: currentAudio?.mimeType,
            fileBase64: currentFile?.base64,
            fileMimeType: currentFile?.mimeType,
            appSnapshot,
          }),
        },
        70000
      );

      if (!ok) {
        throw new Error(result.error || `Error procesando solicitud (${status})`);
      }

      const actions = Array.isArray(result.actions) ? result.actions : [];
      const chips = applyAssistantActions(actions);

      const botMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: result.reply || 'Acción procesada en tu Segundo Cerebro 4.0.',
        actions: chips,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Auto-navigate only if the assistant explicitly returned navigate_module as sole navigation
      const navAction = actions.find((a: { name: string }) => a.name === 'navigate_module');
      if (navAction && actions.length === 1 && navAction.args?.viewId) {
        setTimeout(() => onNavigate(String(navAction.args.viewId)), 750);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error conectando con el asistente.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: `No se pudo completar: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testWebhookText.trim()) return;
    setWebhookStatus('Enviando payload al webhook...');
    try {
      const { ok, status, data: res } = await fetchJsonWithTimeout<{
        actions?: { name: string; args: Record<string, unknown> }[];
        parsedAction?: { name: string; args: Record<string, unknown> };
        reply?: string;
        error?: string;
      }>(
        '/api/integrations/webhook',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: testChannel,
            sender: 'usuario_vip',
            text: testWebhookText.trim(),
          }),
        },
        70000
      );
      if (!ok) {
        throw new Error(res.error || `Error HTTP ${status}`);
      }
      const parsedActions = res.actions || (res.parsedAction ? [res.parsedAction] : []);
      if (parsedActions.length > 0) {
        applyAssistantActions(parsedActions);
      }
      setWebhookStatus(
        `Canal ${testChannel.toUpperCase()} procesado: ${res.reply || 'Acción aplicada en el sistema.'}`
      );
      setTestWebhookText('');
    } catch (err: unknown) {
      setWebhookStatus(err instanceof Error ? err.message : 'Error al probar el webhook.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/25 shrink-0">
              <Bot className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Asistente IA del Sistema
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Operador interno por texto, voz o comprobantes (transferencias, tareas, recordatorios y módulos).
              </p>
            </div>
          </div>

          <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] grid grid-cols-2 sm:flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'assistant'
                  ? 'bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Asistente</span>
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'channels'
                  ? 'bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden truncate">Canales</span>
              <span className="hidden sm:inline">WhatsApp / Telegram / Correo</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'assistant' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Workspace (8 Cols) */}
          <div className="lg:col-span-8 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl flex flex-col h-[500px] sm:h-[600px] overflow-hidden">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white'
                        : 'bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {msg.attachmentName && (
                      <div className="mb-2 px-2.5 py-1 rounded-lg bg-black/15 text-[11px] font-semibold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{msg.attachmentName}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap gap-2">
                        {msg.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => act.targetView && onNavigate(act.targetView)}
                            className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{act.label}</span>
                            {act.targetView && <ArrowRight className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isSending && (
                <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-semibold px-2">
                  Ejecutando en Segundo Cerebro 4.0...
                </div>
              )}
            </div>

            {/* Pending attachments bar */}
            {(audioData || fileData) && (
              <div className="px-5 py-2 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-wrap gap-2 bg-slate-50/80 dark:bg-black/30">
                {audioData && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-semibold">
                    <Mic className="w-3.5 h-3.5" />
                    {audioData.label}
                    <button onClick={() => setAudioData(null)} className="cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {fileData && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/15 text-pink-700 dark:text-pink-300 text-xs font-semibold">
                    <Paperclip className="w-3.5 h-3.5" />
                    {fileData.name}
                    <button onClick={() => setFileData(null)} className="cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRecording
                    ? `Grabando nota de voz (${recordingSeconds}s)...`
                    : 'Ej: "Registra pago de $85 en internet", "Recuérdame llamar al contador mañana"...'
                }
                className="w-full sm:flex-1 min-w-0 sm:order-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 sm:px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
              />

              <div className="flex items-center justify-between gap-2 sm:contents">
                <div className="flex items-center gap-2 sm:order-1 shrink-0">
                  <button
                    type="button"
                    onClick={isRecording ? stopVoice : startVoice}
                    className={`h-9 sm:h-auto px-3 sm:p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
                      isRecording
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-fuchsia-500'
                    }`}
                    title={isRecording ? 'Detener grabación' : 'Dictar por voz'}
                  >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                    <span className="sm:hidden">{isRecording ? `${recordingSeconds}s` : 'Voz'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 sm:h-auto px-3 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-fuchsia-500 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                    title="Adjuntar comprobante de transferencia (Imagen o PDF)"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span className="sm:hidden">Adjuntar</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,audio/*,.m4a,.mp3,.wav,.ogg,.opus,.webm,.aac"
                    onChange={handleAttachFile}
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="h-9 sm:h-auto px-4 py-2 sm:py-2.5 sm:order-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ejecutar</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Rail: Quick Commands & Scope Notice (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-500" />
                Comandos Rápidos del Sistema
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Haz clic para probar o sube una foto/PDF de transferencia bancaria.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleSend('Recuérdame revisar el flujo de caja mañana a las 09:00')
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-fuchsia-500/40 text-left text-xs flex items-center gap-2.5 cursor-pointer"
                >
                  <BellRing className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Crear recordatorio en bandeja
                  </span>
                </button>

                <button
                  onClick={() =>
                    handleSend('Agenda tarea empresarial urgente: Enviar propuesta comercial hoy')
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-fuchsia-500/40 text-left text-xs flex items-center gap-2.5 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Agendar tarea ejecutiva urgente
                  </span>
                </button>

                <button
                  onClick={() =>
                    handleSend('Registra un gasto personal de $45 en alimentación')
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-fuchsia-500/40 text-left text-xs flex items-center gap-2.5 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Registrar pago / transferencia
                  </span>
                </button>

                <button
                  onClick={() => handleSend('Abrir Súper Mañana')}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] hover:border-fuchsia-500/40 text-left text-xs flex items-center gap-2.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Ir directo a Súper Mañana
                  </span>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Alcance Exclusivo del Sistema
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Este asistente está blindado para operar únicamente dentro de tus módulos de Segundo Cerebro 4.0: no realiza tareas externas ajenas a tu productividad, finanzas, hábitos y empresas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* External Channels Bridge (WhatsApp / Telegram / Email) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Puente de Canales Externos (VPS Webhook)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conecta tu bot de Telegram, WhatsApp (Evolution API / Meta Cloud API) o reenvío de correos (n8n / Mailgun) enviando un POST JSON al endpoint del servidor:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto space-y-2">
              <div className="text-fuchsia-400 font-bold">POST /api/integrations/webhook</div>
              <pre className="text-[11px] leading-relaxed text-slate-300">{`{
  "channel": "whatsapp" | "telegram" | "email",
  "sender": "+593999000000",
  "text": "Pagué $120 de luz hoy",
  "attachmentBase64": "(opcional: comprobante o PDF)",
  "attachmentMimeType": "image/jpeg"
}`}</pre>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <strong className="text-emerald-700 dark:text-emerald-300 block mb-1">
                  WhatsApp
                </strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Conecta Evolution API o Meta Webhook hacia /api/integrations/webhook en tu VPS.
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <strong className="text-sky-700 dark:text-sky-300 block mb-1">
                  Telegram Bot
                </strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Crea tu bot con @BotFather y apunta setWebhook al endpoint del VPS.
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                <strong className="text-violet-700 dark:text-violet-300 block mb-1">
                  Correo / Facturas
                </strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  Usa n8n o IMAP trigger para reenviar adjuntos PDF de transferencias al webhook.
                </span>
              </div>
            </div>
          </div>

          {/* Live Webhook Tester */}
          <div className="lg:col-span-5 p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Simulador de Mensaje Entrante (WhatsApp / Telegram / Correo)
            </h3>
            <form onSubmit={handleTestWebhook} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Canal Origen
                </label>
                <select
                  value={testChannel}
                  onChange={(e) =>
                    setTestChannel(e.target.value as 'whatsapp' | 'telegram' | 'email')
                  }
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="email">Correo Electrónico</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Mensaje simulado
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Transferí $65 a proveedor de diseño"
                  value={testWebhookText}
                  onChange={(e) => setTestWebhookText(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs cursor-pointer"
              >
                Probar Procesamiento Webhook
              </button>
            </form>

            {webhookStatus && (
              <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/25 text-xs text-fuchsia-800 dark:text-fuchsia-200">
                {webhookStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
