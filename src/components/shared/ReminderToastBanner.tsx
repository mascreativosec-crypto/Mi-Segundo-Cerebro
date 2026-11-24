import React, { useEffect, useRef, useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { BusinessTask, NoteReminderItem, ReminderOriginModule } from '../../types';
import {
  BellRing,
  Briefcase,
  CheckSquare,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Check,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export type ReminderToastKind =
  | 'business_task'
  | 'personal_task'
  | 'task'
  | 'module'
  | 'reminder'
  | 'automation';

export interface ReminderToastPayload {
  id: string;
  title: string;
  content: string;
  timeLabel?: string;
  kind: ReminderToastKind;
  badgeLabel: string;
  targetView: string;
  reminderId?: string;
  linkedTaskId?: string;
}

interface ReminderToastBannerProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
  onSelectToast: (toast: ReminderToastPayload) => void;
}

const SOUND_PREF_KEY = 'msc_reminder_sound_enabled';
const TOAST_DURATION_MS = 8000;

export function playReminderAlertSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Soft crystalline executive chime (C6 -> E6 -> G6)
    const notes = [
      { freq: 1046.5, start: 0, duration: 0.2, gain: 0.11 },
      { freq: 1318.51, start: 0.13, duration: 0.25, gain: 0.12 },
      { freq: 1567.98, start: 0.26, duration: 0.42, gain: 0.1 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gainNode.gain.setValueAtTime(0.0001, now + n.start);
      gainNode.gain.exponentialRampToValueAtTime(n.gain, now + n.start + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.05);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Ignore autoplay restriction errors until user interacts
  }
}

function getCurrentTimeHHMM(date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getTodayDateStr(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function addMinutesHHMM(hhmm: string | undefined, mins: number): string {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) {
    const [h, m] = hhmm.split(':').map(Number);
    const candidate = new Date();
    candidate.setHours(h, m, 0, 0);
    if (candidate.getTime() > now.getTime()) {
      hours = h;
      minutes = m;
    }
  }
  const target = new Date();
  target.setHours(hours, minutes + mins, 0, 0);
  return getCurrentTimeHHMM(target);
}

const ORIGIN_MODULE_ROUTE_MAP: Partial<
  Record<ReminderOriginModule, { view: string; label: string }>
> = {
  super_manana: { view: 'super_morning', label: 'Súper Mañana' },
  super_noche: { view: 'super_night', label: 'Súper Noche' },
  finanzas: { view: 'personal_finances', label: 'Finanzas' },
  fisico: { view: 'physical_trainer', label: 'Físico' },
  sabiduria: { view: 'wisdom_library', label: 'Biblioteca' },
  business: { view: 'business', label: 'Empresas' },
  personal: { view: 'personal', label: 'Personal' },
};

function resolveToastDestination(
  rem: NoteReminderItem,
  tasks: BusinessTask[]
): {
  kind: ReminderToastKind;
  badgeLabel: string;
  targetView: string;
  linkedTaskId?: string;
} {
  // 1. Direct link to an existing task (Business Kanban or Personal Task Modal)
  if (rem.linkedTaskId) {
    const linkedTask = tasks.find((t) => t.id === rem.linkedTaskId);
    if (linkedTask) {
      if (linkedTask.scope === 'business' || Boolean(linkedTask.businessId)) {
        return {
          kind: 'business_task',
          badgeLabel: 'Tarea Empresarial',
          targetView: 'business',
          linkedTaskId: linkedTask.id,
        };
      }
      return {
        kind: 'personal_task',
        badgeLabel: 'Tarea Personal',
        targetView: 'tasks_general',
        linkedTaskId: linkedTask.id,
      };
    }
  }

  // 2. Task reminder without linkedTaskId
  if (rem.category === 'tarea') {
    const isBusiness = rem.targetView === 'business' || rem.originModule === 'business';
    return {
      kind: 'task',
      badgeLabel: isBusiness ? 'Tarea Empresarial' : 'Tarea',
      targetView: isBusiness ? 'business' : 'tasks_general',
    };
  }

  // 3. Super Morning explicit reminder
  if (rem.category === 'super_manana' || rem.originModule === 'super_manana') {
    return {
      kind: 'module',
      badgeLabel: 'Súper Mañana',
      targetView: rem.targetView || 'super_morning',
    };
  }

  // 4. Other module-originated reminders
  if (rem.originModule && ORIGIN_MODULE_ROUTE_MAP[rem.originModule]) {
    const mapped = ORIGIN_MODULE_ROUTE_MAP[rem.originModule]!;
    return {
      kind: 'module',
      badgeLabel: mapped.label,
      targetView: rem.targetView || mapped.view,
    };
  }

  // 5. Explicit non-default target view
  if (rem.targetView && rem.targetView !== 'second_brain') {
    return {
      kind: 'module',
      badgeLabel: 'Recordatorio',
      targetView: rem.targetView,
    };
  }

  // 6. General reminder -> Second Brain inbox
  return {
    kind: 'reminder',
    badgeLabel: 'Recordatorio',
    targetView: 'second_brain',
  };
}

function buildReminderToast(
  rem: NoteReminderItem,
  tasks: BusinessTask[],
  idPrefix: string
): ReminderToastPayload {
  const dest = resolveToastDestination(rem, tasks);
  return {
    id: `${idPrefix}_${rem.id}`,
    title: rem.title,
    content: rem.content || '',
    timeLabel: rem.reminderTime,
    kind: dest.kind,
    badgeLabel: dest.badgeLabel,
    targetView: dest.targetView,
    reminderId: rem.id,
    linkedTaskId: dest.linkedTaskId,
  };
}

function getKindVisuals(kind: ReminderToastKind) {
  switch (kind) {
    case 'business_task':
      return {
        icon: Briefcase,
        iconBox: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
        badge: 'text-blue-600 dark:text-blue-400',
        bar: 'bg-blue-500',
        border: 'border-blue-500/25 dark:border-blue-400/25',
      };
    case 'personal_task':
    case 'task':
      return {
        icon: CheckSquare,
        iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        badge: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        border: 'border-emerald-500/25 dark:border-emerald-400/25',
      };
    case 'automation':
      return {
        icon: Sparkles,
        iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
        badge: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        border: 'border-amber-500/30 dark:border-amber-400/25',
      };
    default:
      return {
        icon: BellRing,
        iconBox: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/25',
        badge: 'text-violet-600 dark:text-violet-400',
        bar: 'bg-violet-500',
        border: 'border-slate-200/90 dark:border-white/15',
      };
  }
}

export const ReminderToastBanner: React.FC<ReminderToastBannerProps> = ({
  data,
  onUpdateData,
  onSelectToast,
}) => {
  const [queue, setQueue] = useState<ReminderToastPayload[]>([]);
  const [remainingMs, setRemainingMs] = useState<number>(TOAST_DURATION_MS);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(SOUND_PREF_KEY);
    return saved !== 'false';
  });

  const initialQueuedRef = useRef<boolean>(false);
  const triggeredKeysRef = useRef<Set<string>>(new Set());
  const remainingRef = useRef<number>(TOAST_DURATION_MS);

  const activeToast = queue[0] ?? null;

  // 1. On initial app entry: enqueue up to 3 pending reminders for today (sequentially)
  useEffect(() => {
    if (initialQueuedRef.current) return;
    initialQueuedRef.current = true;

    const now = new Date();
    const todayStr = getTodayDateStr(now);
    const currentHHMM = getCurrentTimeHHMM(now);

    const pendingToday = (data.notesReminders || [])
      .filter((r) => !r.completed && (!r.reminderDate || r.reminderDate <= todayStr))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.reminderTime && b.reminderTime) return a.reminderTime.localeCompare(b.reminderTime);
        if (a.reminderTime) return -1;
        if (b.reminderTime) return 1;
        return 0;
      })
      .slice(0, 3);

    if (pendingToday.length > 0) {
      const initialToasts = pendingToday.map((rem) => {
        if (rem.reminderTime && rem.reminderTime === currentHHMM) {
          triggeredKeysRef.current.add(`rem_${rem.id}_${todayStr}_${currentHHMM}`);
        }
        return buildReminderToast(rem, data.tasks || [], 'entry');
      });

      setQueue(initialToasts);
      if (soundEnabled) {
        playReminderAlertSound();
      }
    }
  }, [data.notesReminders, data.tasks, soundEnabled]);

  // 2. Monitor exact scheduled time every 15 seconds for reminders & enabled automations
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentHHMM = getCurrentTimeHHMM(now);
      const currentDay = getTodayDateStr(now);
      const newlyTriggered: ReminderToastPayload[] = [];

      // User notesReminders with exact reminderTime
      for (const rem of data.notesReminders || []) {
        if (rem.completed || !rem.reminderTime) continue;
        const targetDay = rem.reminderDate || currentDay;
        if (targetDay !== currentDay) continue;
        if (rem.reminderTime === currentHHMM) {
          const triggerKey = `rem_${rem.id}_${currentDay}_${currentHHMM}`;
          if (!triggeredKeysRef.current.has(triggerKey)) {
            triggeredKeysRef.current.add(triggerKey);
            newlyTriggered.push(
              buildReminderToast(rem, data.tasks || [], `sched_${currentHHMM}`)
            );
          }
        }
      }

      // Active automations with exact triggerTime
      for (const rule of data.automations || []) {
        if (!rule.enabled || !rule.triggerTime) continue;
        if (rule.triggerTime === currentHHMM) {
          const triggerKey = `auto_${rule.id}_${currentDay}_${currentHHMM}`;
          if (!triggeredKeysRef.current.has(triggerKey)) {
            triggeredKeysRef.current.add(triggerKey);
            newlyTriggered.push({
              id: triggerKey,
              title: rule.name,
              content: rule.messageTemplate || rule.description,
              timeLabel: rule.triggerTime,
              kind: 'automation',
              badgeLabel: 'Automatización',
              targetView: rule.targetModule || 'mi_dia',
            });
          }
        }
      }

      if (newlyTriggered.length > 0) {
        setQueue((prev) => {
          const incomingReminderIds = new Set(
            newlyTriggered.map((t) => t.reminderId).filter(Boolean)
          );
          const incomingIds = new Set(newlyTriggered.map((t) => t.id));
          const filteredPrev = prev.filter(
            (existing) =>
              !incomingIds.has(existing.id) &&
              !(existing.reminderId && incomingReminderIds.has(existing.reminderId))
          );
          return [...newlyTriggered, ...filteredPrev];
        });
        if (soundEnabled) {
          playReminderAlertSound();
        }
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 15000);
    return () => clearInterval(interval);
  }, [data.notesReminders, data.automations, data.tasks, soundEnabled]);

  // Reset countdown & trigger subtle slide-in whenever the active toast changes
  useEffect(() => {
    if (!activeToast) {
      setIsVisible(false);
      return;
    }
    remainingRef.current = TOAST_DURATION_MS;
    setRemainingMs(TOAST_DURATION_MS);
    setIsPaused(false);
    setIsVisible(false);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeToast?.id]);

  // Auto-dismiss countdown with pause on hover / focus
  useEffect(() => {
    if (!activeToast || isPaused) return;

    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(now - lastTick, 250);
      lastTick = now;

      const next = remainingRef.current - elapsed;
      if (next <= 0) {
        remainingRef.current = 0;
        setRemainingMs(0);
        clearInterval(timer);
        setQueue((current) => current.slice(1));
        return;
      }
      remainingRef.current = next;
      setRemainingMs(next);
    }, 50);

    return () => clearInterval(timer);
  }, [activeToast?.id, isPaused]);

  const dismissActiveToast = () => {
    setQueue((prev) => prev.slice(1));
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_PREF_KEY, String(next));
      if (next) playReminderAlertSound();
      return next;
    });
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeToast?.reminderId) return;
    const nextTime = addMinutesHHMM(activeToast.timeLabel, 15);
    const currentDay = getTodayDateStr();
    const remId = activeToast.reminderId;
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((r) =>
        r.id === remId ? { ...r, reminderDate: currentDay, reminderTime: nextTime } : r
      ),
    }));
    dismissActiveToast();
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeToast?.reminderId) return;
    const remId = activeToast.reminderId;
    onUpdateData((prev) => ({
      ...prev,
      notesReminders: (prev.notesReminders || []).map((r) =>
        r.id === remId ? { ...r, completed: true } : r
      ),
    }));
    dismissActiveToast();
  };

  const handleOpenDestination = () => {
    if (!activeToast) return;
    const selected = activeToast;
    dismissActiveToast();
    onSelectToast(selected);
  };

  if (!activeToast) return null;

  const visuals = getKindVisuals(activeToast.kind);
  const IconComponent = visuals.icon;
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / TOAST_DURATION_MS) * 100));

  return (
    <div
      aria-live="polite"
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[90] w-[calc(100vw-1.5rem)] max-w-md pointer-events-none"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenDestination}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenDestination();
          }
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        className={`pointer-events-auto relative rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border ${visuals.border} shadow-2xl shadow-slate-950/20 overflow-hidden cursor-pointer select-none transition-all duration-300 ease-out hover:scale-[1.01] ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
        }`}
      >
        <div className="px-3.5 pt-3 pb-2.5 flex items-start gap-3">
          {/* Category Icon */}
          <div
            className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${visuals.iconBox}`}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          {/* Main Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${visuals.badge}`}>
                  {activeToast.badgeLabel}
                </span>
                {activeToast.timeLabel && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    <span>·</span>
                    <Clock className="w-2.5 h-2.5" />
                    <span>{activeToast.timeLabel}</span>
                  </span>
                )}
                {queue.length > 1 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                    +{queue.length - 1} más
                  </span>
                )}
              </div>

              {/* Sound & Close Controls */}
              <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-0.5">
                <button
                  type="button"
                  onClick={toggleSound}
                  title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido de alertas'}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/10'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissActiveToast();
                  }}
                  title="Cerrar notificación"
                  aria-label="Cerrar notificación"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white mt-0.5 leading-snug line-clamp-1">
              {activeToast.title}
            </p>

            {activeToast.content && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2">
                {activeToast.content}
              </p>
            )}

            {/* Action Bar */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Abrir</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>

              {activeToast.reminderId && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSnooze}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-3 h-3" />
                    <span>Completar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom 8-second countdown bar (pauses on hover) */}
        <div className="h-[3px] w-full bg-slate-200/70 dark:bg-white/10">
          <div
            className={`h-full ${visuals.bar} transition-[width] duration-75 ease-linear`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
