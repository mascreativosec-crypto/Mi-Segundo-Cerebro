import { AppStoreData } from '../services/storage';
import { Habit, ReadingGoalState } from '../types';

export function getLocalDateStr(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadingTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export interface ReadingWeekDay {
  dateStr: string;
  letter: string;
  seconds: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function getCurrentWeekReadingDays(goal: ReadingGoalState): ReadingWeekDay[] {
  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const offsetToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetToMonday);
  const targetSec = Math.max(60, (goal.dailyTargetMinutes || 15) * 60);

  return WEEK_LETTERS.map((letter, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dateStr = getLocalDateStr(d);
    const seconds = goal.dailySecondsByDate?.[dateStr] || 0;
    return {
      dateStr,
      letter,
      seconds,
      completed: seconds >= targetSec,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    };
  });
}

export function computeReadingStreaks(goal: ReadingGoalState): {
  currentStreak: number;
  bestStreak: number;
} {
  const targetSec = Math.max(60, (goal.dailyTargetMinutes || 15) * 60);
  const map = goal.dailySecondsByDate || {};

  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const completedToday = (map[todayStr] || 0) >= targetSec;

  // Walk backwards starting from today if completed, otherwise from yesterday
  let currentStreak = 0;
  const startOffset = completedToday ? 0 : 1;
  for (let i = startOffset; i < 3650; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = getLocalDateStr(d);
    if ((map[key] || 0) >= targetSec) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  // Also compute historical best streak across all recorded dates
  const completedDates = Object.keys(map)
    .filter((k) => (map[k] || 0) >= targetSec)
    .sort();

  let run = 0;
  let computedBest = 0;
  let prevTime: number | null = null;
  for (const dateStr of completedDates) {
    const [y, m, day] = dateStr.split('-').map(Number);
    const t = Date.UTC(y, (m || 1) - 1, day || 1);
    if (prevTime !== null && t - prevTime === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > computedBest) computedBest = run;
    prevTime = t;
  }

  const bestStreak = Math.max(goal.bestStreak || 0, computedBest, currentStreak);
  return { currentStreak, bestStreak };
}

export function findLinkedReadingHabit(habits: Habit[], linkedHabitId?: string): Habit | undefined {
  if (linkedHabitId) {
    const exact = habits.find((h) => h.id === linkedHabitId && !h.isArchived);
    if (exact) return exact;
  }
  return (
    habits.find((h) => !h.isArchived && /lectura|leer|libro/i.test(h.title)) ||
    habits.find((h) => !h.isArchived && h.pillar === 'intelectual')
  );
}

/**
 * Adds deltaSeconds to today's reading goal total, updates reading streaks,
 * and automatically marks the linked reading Habit as completed for today once the goal is reached.
 */
export function applyReadingSecondsToStore(
  prev: AppStoreData,
  deltaSeconds: number
): AppStoreData {
  if (!deltaSeconds || deltaSeconds <= 0) return prev;

  const todayLocal = getLocalDateStr();
  const todayIso = new Date().toISOString().split('T')[0];
  const prevGoal: ReadingGoalState = prev.readingGoal || {
    dailyTargetMinutes: 15,
    dailySecondsByDate: {},
    annualBooksTarget: 12,
    bestStreak: 0,
    linkedHabitId: 'h3',
  };

  const prevSeconds = prevGoal.dailySecondsByDate?.[todayLocal] || 0;
  const nextSeconds = prevSeconds + Math.round(deltaSeconds);
  const nextDailySecondsByDate = {
    ...(prevGoal.dailySecondsByDate || {}),
    [todayLocal]: nextSeconds,
  };

  const draftGoal: ReadingGoalState = {
    ...prevGoal,
    dailySecondsByDate: nextDailySecondsByDate,
  };

  const { bestStreak } = computeReadingStreaks(draftGoal);
  const nextGoal: ReadingGoalState = {
    ...draftGoal,
    bestStreak,
  };

  const targetSec = Math.max(60, (nextGoal.dailyTargetMinutes || 15) * 60);
  const reachedGoalNow = nextSeconds >= targetSec;

  let nextHabits = prev.habits;
  if (reachedGoalNow) {
    const linked = findLinkedReadingHabit(prev.habits, nextGoal.linkedHabitId);
    if (linked) {
      const alreadyDoneToday =
        linked.completedDates.includes(todayIso) || linked.completedDates.includes(todayLocal);
      if (!alreadyDoneToday) {
        nextHabits = prev.habits.map((h) => {
          if (h.id !== linked.id) return h;
          const nextStreak = (h.currentStreak || 0) + 1;
          return {
            ...h,
            completedDates: [...h.completedDates, todayIso],
            currentStreak: nextStreak,
            bestStreak: Math.max(h.bestStreak || 0, nextStreak),
          };
        });
      }
    }
  }

  return {
    ...prev,
    readingGoal: nextGoal,
    habits: nextHabits,
  };
}
