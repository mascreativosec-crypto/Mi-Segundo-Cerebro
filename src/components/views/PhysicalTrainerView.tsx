import React, { useState, useRef } from 'react';
import { AppStoreData } from '../../services/storage';
import { WorkoutRoutine, WorkoutExercise, ExerciseSet, FitnessActivityLog } from '../../types';
import {
  Dumbbell,
  Droplets,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Apple,
  AlertTriangle,
  Footprints,
  Upload,
  Trash2,
  Edit3,
  Check,
  X,
  Trees,
  Flame,
  Activity,
} from 'lucide-react';

interface PhysicalTrainerViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

const getBmiDiagnostic = (bmi: number, heightCm: number, weightKg: number) => {
  const heightM = Math.max(heightCm / 100, 1);
  const minHealthyKg = Number((18.5 * heightM * heightM).toFixed(1));
  const maxHealthyKg = Number((24.9 * heightM * heightM).toFixed(1));

  if (bmi < 18.5) {
    const diff = Number((minHealthyKg - weightKg).toFixed(1));
    return {
      status: 'Bajo Peso',
      severity: 'info' as const,
      badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
      bannerClass: 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200',
      recommendation: `Tu IMC está por debajo del rango saludable (${minHealthyKg}–${maxHealthyKg} kg). Te faltan ~${diff} kg para entrar en peso óptimo.`,
    };
  }
  if (bmi < 25) {
    return {
      status: 'Peso Saludable / Óptimo',
      severity: 'ok' as const,
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      bannerClass: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200',
      recommendation: `Dentro del rango saludable (${minHealthyKg}–${maxHealthyKg} kg) para tu estatura de ${heightM.toFixed(2)} m. Enfócate en sobrecarga progresiva y recomposición.`,
    };
  }
  if (bmi < 30) {
    const excess = Number((weightKg - maxHealthyKg).toFixed(1));
    return {
      status: 'Alerta de Sobrepeso',
      severity: 'warn' as const,
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      bannerClass: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200',
      recommendation: `Sobrepeso detectado (${bmi}). Rango óptimo para tu estatura: ${minHealthyKg}–${maxHealthyKg} kg (+${excess} kg sobre el límite saludable). Activa déficit ligero + pasos diarios.`,
    };
  }
  const excess = Number((weightKg - maxHealthyKg).toFixed(1));
  return {
    status: 'Alerta Clínica de Obesidad',
    severity: 'danger' as const,
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    bannerClass: 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200',
    recommendation: `Alerta: IMC en rango de obesidad (${bmi}). Rango saludable para ${heightM.toFixed(2)} m: ${minHealthyKg}–${maxHealthyKg} kg (+${excess} kg). Prioriza caminata diaria de bajo impacto, fuerza y control calórico.`,
  };
};

export const PhysicalTrainerView: React.FC<PhysicalTrainerViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Bio stats editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [heightInput, setHeightInput] = useState<number>(data.profile.heightCm || 168);
  const [weightInput, setWeightInput] = useState<number>(data.profile.weightKg || 70);

  // Activity / steps sync form
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [actSteps, setActSteps] = useState<number>(8500);
  const [actDistanceKm, setActDistanceKm] = useState<number>(6.2);
  const [actCalories, setActCalories] = useState<number>(420);
  const [actMinutes, setActMinutes] = useState<number>(55);
  const [actSource, setActSource] = useState<FitnessActivityLog['sourceApp']>('Manual');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Routine creator
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineEnv, setNewRoutineEnv] = useState<'gym' | 'outdoor'>('gym');
  const [newRoutineDays, setNewRoutineDays] = useState('Miércoles / Sábado');
  const [newRoutineFocus, setNewRoutineFocus] = useState('');
  const [newRoutineMinutes, setNewRoutineMinutes] = useState(45);
  const [confirmDeleteRoutineId, setConfirmDeleteRoutineId] = useState<string | null>(null);

  // Exercise creator
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMetric, setNewExMetric] = useState<'weight_reps' | 'distance_time'>('weight_reps');
  const [newExGroup, setNewExGroup] = useState<WorkoutExercise['muscleGroup']>('Pecho');
  const [newExRest, setNewExRest] = useState(90);
  const [newExNotes, setNewExNotes] = useState('');
  const [newExSetsCount, setNewExSetsCount] = useState(3);

  const routines = data.workoutRoutines || [];
  const safeRoutineIdx = activeRoutineIndex < routines.length ? activeRoutineIndex : 0;
  const currentRoutine = routines[safeRoutineIdx];

  const todayStr = new Date().toISOString().split('T')[0];
  const fitnessLogs = data.fitnessLogs || [];
  const todayLogs = fitnessLogs.filter((l) => l.date === todayStr);
  const todaySteps = todayLogs.reduce((acc, l) => acc + l.steps, 0);
  const todayDistance = Number(todayLogs.reduce((acc, l) => acc + l.distanceKm, 0).toFixed(2));
  const todayCalories = todayLogs.reduce((acc, l) => acc + l.caloriesBurned, 0);

  const bmiDiag = getBmiDiagnostic(
    data.profile.calculatedBmi,
    data.profile.heightCm,
    data.profile.weightKg
  );

  // Rest timer tick
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, restTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
    setTimerRunning(true);
  };

  // Save Bio (height + weight + auto BMI)
  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    const validH = Math.max(100, Math.min(240, Number(heightInput) || 168));
    const validW = Math.max(30, Math.min(280, Number(weightInput) || 70));
    const heightM = validH / 100;
    const newBmi = Number((validW / (heightM * heightM)).toFixed(1));

    onUpdateData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        heightCm: validH,
        weightKg: validW,
        calculatedBmi: newBmi,
      },
    }));
    setIsEditingBio(false);
  };

  // Quick steps / activity log
  const handleQuickAddSteps = (stepsDelta: number) => {
    const kmDelta = Number(((stepsDelta * 0.74) / 1000).toFixed(2));
    const kcalDelta = Math.round(stepsDelta * 0.04);
    const minDelta = Math.round(stepsDelta / 100);

    onUpdateData((prev) => {
      const existingIdx = (prev.fitnessLogs || []).findIndex(
        (l) => l.date === todayStr && l.sourceApp === 'Manual'
      );
      if (existingIdx >= 0) {
        const updated = [...(prev.fitnessLogs || [])];
        const target = updated[existingIdx];
        updated[existingIdx] = {
          ...target,
          steps: target.steps + stepsDelta,
          distanceKm: Number((target.distanceKm + kmDelta).toFixed(2)),
          caloriesBurned: target.caloriesBurned + kcalDelta,
          activeMinutes: target.activeMinutes + minDelta,
        };
        return { ...prev, fitnessLogs: updated };
      }
      const newLog: FitnessActivityLog = {
        id: `fit_${Date.now()}`,
        date: todayStr,
        steps: stepsDelta,
        distanceKm: kmDelta,
        caloriesBurned: kcalDelta,
        activeMinutes: minDelta,
        sourceApp: 'Manual',
        notes: 'Registro rápido de actividad',
      };
      return { ...prev, fitnessLogs: [newLog, ...(prev.fitnessLogs || [])] };
    });
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: FitnessActivityLog = {
      id: `fit_${Date.now()}`,
      date: todayStr,
      steps: Math.max(0, Number(actSteps) || 0),
      distanceKm: Math.max(0, Number(actDistanceKm) || 0),
      caloriesBurned: Math.max(0, Number(actCalories) || 0),
      activeMinutes: Math.max(0, Number(actMinutes) || 0),
      sourceApp: actSource,
    };
    onUpdateData((prev) => ({
      ...prev,
      fitnessLogs: [newLog, ...(prev.fitnessLogs || [])],
    }));
    setShowActivityForm(false);
    setSyncNotice(`Actividad registrada desde ${actSource}.`);
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleImportFitnessFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let steps = 0;
      let distanceKm = 0;
      let caloriesBurned = 0;
      let activeMinutes = 30;
      let sourceApp: FitnessActivityLog['sourceApp'] = 'Apple Health';

      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        steps = Number(item.steps || item.stepCount || 6000);
        distanceKm = Number(item.distanceKm || item.distance || (steps * 0.74) / 1000);
        caloriesBurned = Number(item.caloriesBurned || item.calories || Math.round(steps * 0.04));
        activeMinutes = Number(item.activeMinutes || item.minutes || 40);
        if (item.sourceApp) sourceApp = item.sourceApp;
      } else {
        // Parse basic CSV line (date,steps,distanceKm,calories,minutes,source)
        const lines = text.trim().split('\n').filter(Boolean);
        const dataLine = (lines.length > 1 ? lines[1] : lines[0]).split(',');
        steps = Number(dataLine[1] || dataLine[0]) || 7500;
        distanceKm = Number(dataLine[2]) || Number(((steps * 0.74) / 1000).toFixed(2));
        caloriesBurned = Number(dataLine[3]) || Math.round(steps * 0.04);
        activeMinutes = Number(dataLine[4]) || 45;
        if (file.name.toLowerCase().includes('strava')) sourceApp = 'Strava';
        else if (file.name.toLowerCase().includes('garmin')) sourceApp = 'Garmin';
        else if (file.name.toLowerCase().includes('fit')) sourceApp = 'Google Fit';
      }

      const importedLog: FitnessActivityLog = {
        id: `fit_imp_${Date.now()}`,
        date: todayStr,
        steps: Math.round(steps),
        distanceKm: Number(distanceKm.toFixed(2)),
        caloriesBurned: Math.round(caloriesBurned),
        activeMinutes: Math.round(activeMinutes),
        sourceApp,
        notes: `Importado de ${file.name}`,
      };

      onUpdateData((prev) => ({
        ...prev,
        fitnessLogs: [importedLog, ...(prev.fitnessLogs || [])],
      }));
      setSyncNotice(`Sincronizado: +${importedLog.steps.toLocaleString()} pasos (${sourceApp}).`);
    } catch {
      setSyncNotice('Formato no reconocido. Usa JSON ({steps, distanceKm, calories}) o CSV estándar.');
    } finally {
      e.target.value = '';
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Routine CRUD
  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;
    const newRoutine: WorkoutRoutine = {
      id: `wr_${Date.now()}`,
      title: newRoutineTitle.trim(),
      environment: newRoutineEnv,
      dayOfWeek: newRoutineDays.trim() || 'Flexible',
      muscleFocus:
        newRoutineFocus.trim() ||
        (newRoutineEnv === 'outdoor' ? 'Resistencia Exterior / Cardio' : 'Fuerza Funcional'),
      estimatedMinutes: Math.max(10, Number(newRoutineMinutes) || 45),
      exercises: [],
    };
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: [...prev.workoutRoutines, newRoutine],
    }));
    setActiveRoutineIndex(routines.length);
    setShowAddRoutine(false);
    setNewRoutineTitle('');
    setNewRoutineFocus('');
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (routines.length <= 1) return;
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.filter((r) => r.id !== routineId),
    }));
    setActiveRoutineIndex(0);
    setConfirmDeleteRoutineId(null);
  };

  // Exercise CRUD inside current routine
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !currentRoutine) return;
    const count = Math.max(1, Math.min(10, Number(newExSetsCount) || 3));
    const sets: ExerciseSet[] = Array.from({ length: count }, (_, idx) => ({
      setNumber: idx + 1,
      setName: idx === 0 ? 'Calentamiento' : `Serie ${idx + 1}`,
      reps: newExMetric === 'weight_reps' ? 10 : 1,
      weightKg: newExMetric === 'weight_reps' ? 20 : 0,
      distanceKm: newExMetric === 'distance_time' ? 1.0 : undefined,
      durationMinutes: newExMetric === 'distance_time' ? 8 : undefined,
      completed: false,
    }));

    const newExercise: WorkoutExercise = {
      id: `ex_${Date.now()}`,
      name: newExName.trim(),
      environment: currentRoutine.environment || 'gym',
      metricType: newExMetric,
      muscleGroup: newExGroup,
      targetSets: count,
      targetReps: newExMetric === 'distance_time' ? 'Distancia / Tiempo' : '8-12 reps',
      restSeconds: Math.max(15, Number(newExRest) || 60),
      instructionNotes: newExNotes.trim() || 'Ejecuta con técnica controlada y respiración constante.',
      sets,
    };

    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.map((r, idx) =>
        idx === safeRoutineIdx ? { ...r, exercises: [...r.exercises, newExercise] } : r
      ),
    }));

    setShowAddExercise(false);
    setNewExName('');
    setNewExNotes('');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.map((r, idx) =>
        idx === safeRoutineIdx
          ? { ...r, exercises: r.exercises.filter((ex) => ex.id !== exerciseId) }
          : r
      ),
    }));
  };

  // Sets CRUD & editing
  const toggleSetComplete = (exerciseId: string, setNumber: number) => {
    onUpdateData((prev) => {
      const updatedRoutines = prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx !== safeRoutineIdx) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.setNumber !== setNumber) return s;
                const nowDone = !s.completed;
                if (nowDone) startRestTimer(ex.restSeconds);
                return { ...s, completed: nowDone };
              }),
            };
          }),
        };
      });
      return { ...prev, workoutRoutines: updatedRoutines };
    });
  };

  const updateSetField = (
    exerciseId: string,
    setNumber: number,
    patch: Partial<ExerciseSet>
  ) => {
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx !== safeRoutineIdx) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, ...patch } : s
              ),
            };
          }),
        };
      }),
    }));
  };

  const addSetToExercise = (exerciseId: string) => {
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx !== safeRoutineIdx) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const last = ex.sets[ex.sets.length - 1];
            const nextNum = ex.sets.length + 1;
            const newSet: ExerciseSet = {
              setNumber: nextNum,
              setName: `Serie ${nextNum}`,
              reps: last?.reps ?? 10,
              weightKg: last?.weightKg ?? 20,
              distanceKm: last?.distanceKm ?? (ex.metricType === 'distance_time' ? 1 : undefined),
              durationMinutes: last?.durationMinutes ?? (ex.metricType === 'distance_time' ? 10 : undefined),
              completed: false,
            };
            return { ...ex, sets: [...ex.sets, newSet], targetSets: nextNum };
          }),
        };
      }),
    }));
  };

  const removeSetFromExercise = (exerciseId: string, setNumber: number) => {
    onUpdateData((prev) => ({
      ...prev,
      workoutRoutines: prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx !== safeRoutineIdx) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId || ex.sets.length <= 1) return ex;
            const remaining = ex.sets
              .filter((s) => s.setNumber !== setNumber)
              .map((s, i) => ({ ...s, setNumber: i + 1 }));
            return { ...ex, sets: remaining, targetSets: remaining.length };
          }),
        };
      }),
    }));
  };

  const addGlassOfWater = () => {
    onUpdateData((prev) => ({
      ...prev,
      nutritionLog: {
        ...prev.nutritionLog,
        waterGlasses250ml: prev.nutritionLog.waterGlasses250ml + 1,
      },
    }));
  };

  const waterTotalLiters = ((data.nutritionLog.waterGlasses250ml * 250) / 1000).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Dumbbell className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mi Entrenador Físico Inteligente
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Composición corporal, actividad diaria, gimnasio y entrenamientos al aire libre.
              </p>
            </div>
          </div>

          {/* Editable User Bio Stats */}
          {!isEditingBio ? (
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">
                  Estatura
                </span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {(data.profile.heightCm / 100).toFixed(2)} m
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">
                  Peso Actual
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {data.profile.weightKg} kg
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">
                  IMC Real
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {data.profile.calculatedBmi}
                </span>
              </div>
              <button
                onClick={() => {
                  setHeightInput(data.profile.heightCm);
                  setWeightInput(data.profile.weightKg);
                  setIsEditingBio(true);
                }}
                className="ml-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-emerald-500" />
                <span>Editar</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSaveBio}
              className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-emerald-500/40 text-xs"
            >
              <div>
                <label className="text-[10px] text-slate-500 block font-semibold">Estatura (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={240}
                  value={heightInput}
                  onChange={(e) => setHeightInput(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block font-semibold">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={280}
                  value={weightInput}
                  onChange={(e) => setWeightInput(Number(e.target.value))}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-xs font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer mt-3"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer mt-3"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Clinical BMI Diagnostic Alert Banner */}
        <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${bmiDiag.bannerClass}`}>
          <div className="flex items-start sm:items-center gap-2.5">
            {bmiDiag.severity === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span className="font-bold mr-2">{bmiDiag.status}:</span>
              <span>{bmiDiag.recommendation}</span>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 self-start sm:self-center ${bmiDiag.badgeClass}`}>
            IMC {data.profile.calculatedBmi}
          </span>
        </div>

        {/* Nutrition + Hydration Row */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-1">
              <Apple className="w-4 h-4" />
              Nutrición Pre-Entrenamiento (60-90 min antes)
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.nutritionLog.preWorkoutMeal}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4" />
                Hidratación Hoy ({waterTotalLiters} L)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {data.nutritionLog.waterGlasses250ml} vasos de 250ml · Meta diaria 2.5L
              </span>
            </div>
            <button
              onClick={addGlassOfWater}
              className="px-3.5 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              +1 Vaso
            </button>
          </div>
        </div>
      </div>

      {/* Daily Steps, Distance & Fitness App Sync Card */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Footprints className="w-4 h-4 text-lime-500" />
              Pasos Diarios, Distancia & Sincronización Fitness
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registra tus pasos de hoy o importa datos desde Apple Health, Google Fit, Strava o Garmin (JSON/CSV).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickAddSteps(1000)}
              className="px-3 py-1.5 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-500/25 text-xs font-bold cursor-pointer"
            >
              +1,000 pasos
            </button>
            <button
              onClick={() => handleQuickAddSteps(2500)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold cursor-pointer"
            >
              +2,500 pasos
            </button>
            <button
              onClick={() => setShowActivityForm((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] hover:bg-slate-300/70 dark:hover:bg-white/[0.14] text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registro Manual / App</span>
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar App</span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleImportFitnessFile}
              className="hidden"
            />
          </div>
        </div>

        {syncNotice && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {syncNotice}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Pasos Hoy
            </span>
            <span className="text-xl font-extrabold text-lime-600 dark:text-lime-400 tabular-nums mt-0.5 block">
              {todaySteps.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Meta: 10,000 pasos</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Distancia Recorrida
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5 block">
              {todayDistance} km
            </span>
            <span className="text-[10px] text-slate-400">Caminata & running</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Calorías Activas
            </span>
            <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums mt-0.5 block flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {todayCalories} kcal
            </span>
            <span className="text-[10px] text-slate-400">Gasto adicional hoy</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Última Fuente Sync
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              {fitnessLogs[0]?.sourceApp || 'Manual'}
            </span>
            <span className="text-[10px] text-slate-400">{fitnessLogs.length} registros guardados</span>
          </div>
        </div>

        {showActivityForm && (
          <form
            onSubmit={handleSaveActivity}
            className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-emerald-500/30 grid grid-cols-2 sm:grid-cols-6 gap-3 items-end"
          >
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">App / Origen</label>
              <select
                value={actSource}
                onChange={(e) => setActSource(e.target.value as FitnessActivityLog['sourceApp'])}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Manual">Manual</option>
                <option value="Apple Health">Apple Health</option>
                <option value="Google Fit">Google Fit</option>
                <option value="Strava">Strava</option>
                <option value="Garmin">Garmin</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Pasos</label>
              <input
                type="number"
                value={actSteps}
                onChange={(e) => setActSteps(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Distancia (km)</label>
              <input
                type="number"
                step="0.1"
                value={actDistanceKm}
                onChange={(e) => setActDistanceKm(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Calorías</label>
              <input
                type="number"
                value={actCalories}
                onChange={(e) => setActCalories(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Minutos</label>
              <input
                type="number"
                value={actMinutes}
                onChange={(e) => setActMinutes(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Registrar
            </button>
          </form>
        )}
      </div>

      {/* Routine Selector, Creator & Rest Timer */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md flex flex-wrap items-center gap-1.5">
            {routines.map((routine, idx) => (
              <button
                key={routine.id}
                onClick={() => setActiveRoutineIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  idx === safeRoutineIdx
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {routine.environment === 'outdoor' ? (
                  <Trees className="w-3.5 h-3.5 text-lime-500" />
                ) : (
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>{routine.title}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddRoutine((prev) => !prev)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Rutina</span>
          </button>
        </div>

        {/* Rest Timer Widget */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm self-start lg:self-auto">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Descanso:</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
          </span>
          {timerRunning ? (
            <button
              onClick={() => setTimerRunning(false)}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={() => startRestTimer(60)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              +60s
            </button>
          )}
        </div>
      </div>

      {/* New Routine Creator Panel */}
      {showAddRoutine && (
        <form
          onSubmit={handleCreateRoutine}
          className="p-5 rounded-3xl backdrop-blur-2xl bg-white/85 dark:bg-slate-900/80 border border-emerald-500/30 shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Crear Nueva Rutina (Gimnasio o Aire Libre)
            </h3>
            <button
              type="button"
              onClick={() => setShowAddRoutine(false)}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              placeholder="Nombre (Ej: Running 5K Parque)"
              value={newRoutineTitle}
              onChange={(e) => setNewRoutineTitle(e.target.value)}
              className="sm:col-span-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <select
              value={newRoutineEnv}
              onChange={(e) => setNewRoutineEnv(e.target.value as 'gym' | 'outdoor')}
              className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="gym">Gimnasio (Cargas & Reps)</option>
              <option value="outdoor">Exterior / Aire Libre</option>
            </select>
            <input
              type="text"
              placeholder="Días (Ej: Mié / Sáb)"
              value={newRoutineDays}
              onChange={(e) => setNewRoutineDays(e.target.value)}
              className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Enfoque muscular o aeróbico"
              value={newRoutineFocus}
              onChange={(e) => setNewRoutineFocus(e.target.value)}
              className="sm:col-span-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              min={10}
              max={180}
              placeholder="Minutos estimados"
              value={newRoutineMinutes}
              onChange={(e) => setNewRoutineMinutes(Number(e.target.value))}
              className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-600 text-white text-xs font-bold cursor-pointer"
            >
              Crear Rutina
            </button>
          </div>
        </form>
      )}

      {/* Current Workout Routine Exercises */}
      {currentRoutine && (
        <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentRoutine.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-700 dark:text-lime-300 border border-lime-500/25">
                  {currentRoutine.environment === 'outdoor' ? 'Aire Libre' : 'Gimnasio'}
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {currentRoutine.muscleFocus} · Duración estimada {currentRoutine.estimatedMinutes} min
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {currentRoutine.dayOfWeek}
              </span>
              <button
                onClick={() => {
                  setNewExMetric(currentRoutine.environment === 'outdoor' ? 'distance_time' : 'weight_reps');
                  setShowAddExercise((prev) => !prev);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Ejercicio</span>
              </button>
              {routines.length > 1 && (
                confirmDeleteRoutineId === currentRoutine.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteRoutine(currentRoutine.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteRoutineId(null)}
                      className="px-2 py-1 text-[11px] text-slate-500 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteRoutineId(currentRoutine.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Eliminar rutina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Add Exercise Form */}
          {showAddExercise && (
            <form
              onSubmit={handleAddExercise}
              className="p-4 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-emerald-500/30 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre del ejercicio (Ej: Trote / Dominadas)"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <select
                  value={newExMetric}
                  onChange={(e) => setNewExMetric(e.target.value as 'weight_reps' | 'distance_time')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="weight_reps">Gimnasio (Carga kg + Reps)</option>
                  <option value="distance_time">Exterior / Cardio (Km + Min)</option>
                </select>
                <select
                  value={newExGroup}
                  onChange={(e) => setNewExGroup(e.target.value as WorkoutExercise['muscleGroup'])}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Pecho">Pecho</option>
                  <option value="Espalda">Espalda</option>
                  <option value="Piernas">Piernas</option>
                  <option value="Hombros">Hombros</option>
                  <option value="Brazos">Brazos</option>
                  <option value="Core">Core</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Exterior">Exterior</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Notas técnicas de ejecución..."
                  value={newExNotes}
                  onChange={(e) => setNewExNotes(e.target.value)}
                  className="sm:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newExSetsCount}
                    onChange={(e) => setNewExSetsCount(Number(e.target.value))}
                    placeholder="Series iniciales"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={15}
                    max={300}
                    value={newExRest}
                    onChange={(e) => setNewExRest(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Exercise List */}
          {currentRoutine.exercises.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-500">
              Esta rutina aún no tiene ejercicios. Haz clic en "+ Añadir Ejercicio" para construirla.
            </div>
          ) : (
            <div className="space-y-4">
              {currentRoutine.exercises.map((exercise) => {
                const isDistance = exercise.metricType === 'distance_time';
                return (
                  <div
                    key={exercise.id}
                    className="p-5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{exercise.name}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            {exercise.muscleGroup}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {exercise.instructionNotes}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>Descanso {exercise.restSeconds}s</span>
                        <button
                          onClick={() => addSetToExercise(exercise.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                        >
                          + Serie
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Eliminar ejercicio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06] font-semibold">
                            <th className="py-2 px-2">#</th>
                            <th className="py-2 px-3">Nombre de Serie</th>
                            <th className="py-2 px-3">{isDistance ? 'Distancia (km)' : 'Carga (kg)'}</th>
                            <th className="py-2 px-3">{isDistance ? 'Tiempo (min)' : 'Reps'}</th>
                            <th className="py-2 px-3 text-right">Hecho</th>
                            <th className="py-2 px-2 text-right"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set) => (
                            <tr
                              key={set.setNumber}
                              className={`border-b border-slate-200/60 dark:border-white/[0.04] ${
                                set.completed ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <td className="py-2 px-2 font-bold text-slate-500 tabular-nums">
                                #{set.setNumber}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={set.setName ?? `Serie ${set.setNumber}`}
                                  onChange={(e) =>
                                    updateSetField(exercise.id, set.setNumber, {
                                      setName: e.target.value,
                                    })
                                  }
                                  className="w-36 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-medium"
                                />
                              </td>
                              <td className="py-2 px-3">
                                {isDistance ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={set.distanceKm ?? 0}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, set.setNumber, {
                                        distanceKm: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold tabular-nums"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={set.weightKg}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, set.setNumber, {
                                        weightKg: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold tabular-nums"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {isDistance ? (
                                  <input
                                    type="number"
                                    value={set.durationMinutes ?? 0}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, set.setNumber, {
                                        durationMinutes: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold tabular-nums"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) =>
                                      updateSetField(exercise.id, set.setNumber, {
                                        reps: Number(e.target.value),
                                      })
                                    }
                                    className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold tabular-nums"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => toggleSetComplete(exercise.id, set.setNumber)}
                                  className="cursor-pointer"
                                >
                                  {set.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-emerald-500 ml-auto transition-colors" />
                                  )}
                                </button>
                              </td>
                              <td className="py-2 px-2 text-right">
                                {exercise.sets.length > 1 && (
                                  <button
                                    onClick={() => removeSetFromExercise(exercise.id, set.setNumber)}
                                    className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                    title="Quitar serie"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
