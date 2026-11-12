import React, { useState } from 'react';
import { AppStoreData } from '../../services/storage';
import { WorkoutRoutine, WorkoutExercise, ExerciseSet } from '../../types';
import {
  Dumbbell,
  Activity,
  Heart,
  Droplets,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  RotateCcw,
  Apple
} from 'lucide-react';

interface PhysicalTrainerViewProps {
  data: AppStoreData;
  onUpdateData: (updater: (prev: AppStoreData) => AppStoreData) => void;
}

export const PhysicalTrainerView: React.FC<PhysicalTrainerViewProps> = ({
  data,
  onUpdateData,
}) => {
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const currentRoutine = data.workoutRoutines[activeRoutineIndex] || data.workoutRoutines[0];

  // Rest timer tick
  React.useEffect(() => {
    let interval: any = null;
    if (timerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, restTimerSeconds]);

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
    setTimerRunning(true);
  };

  const toggleSetComplete = (exerciseId: string, setNumber: number) => {
    onUpdateData((prev) => {
      const updatedRoutines = prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx === activeRoutineIndex) {
          const updatedExercises = routine.exercises.map((ex) => {
            if (ex.id === exerciseId) {
              const updatedSets = ex.sets.map((s) => {
                if (s.setNumber === setNumber) {
                  const nowDone = !s.completed;
                  if (nowDone) startRestTimer(ex.restSeconds);
                  return { ...s, completed: nowDone };
                }
                return s;
              });
              return { ...ex, sets: updatedSets };
            }
            return ex;
          });
          return { ...routine, exercises: updatedExercises };
        }
        return routine;
      });
      return { ...prev, workoutRoutines: updatedRoutines };
    });
  };

  const updateSetWeightReps = (exerciseId: string, setNumber: number, reps: number, weightKg: number) => {
    onUpdateData((prev) => {
      const updatedRoutines = prev.workoutRoutines.map((routine, rIdx) => {
        if (rIdx === activeRoutineIndex) {
          const updatedExercises = routine.exercises.map((ex) => {
            if (ex.id === exerciseId) {
              const updatedSets = ex.sets.map((s) =>
                s.setNumber === setNumber ? { ...s, reps, weightKg } : s
              );
              return { ...ex, sets: updatedSets };
            }
            return ex;
          });
          return { ...routine, exercises: updatedExercises };
        }
        return routine;
      });
      return { ...prev, workoutRoutines: updatedRoutines };
    });
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
      {/* Top Banner - Apple Liquid Glass with Lime/Emerald gradient squircle */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lime-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Dumbbell className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mi Entrenador Físico Inteligente
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Salud, vitalidad, composición corporal y sobrecarga progresiva programada.
              </p>
            </div>
          </div>

          {/* User Bio Stats - Apple Frosted Card */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] text-xs">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Estatura</span>
              <span className="font-bold text-slate-900 dark:text-white">1.68 m</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">Peso Actual</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">70 kg</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block uppercase">IMC Referencial</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">24.8</span>
            </div>
          </div>
        </div>

        {/* Nutritional & Pre-Workout Recommendation Box */}
        <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Routine Selector & Rest Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Routine tabs */}
        <div className="p-1.5 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md flex items-center gap-1.5">
          {data.workoutRoutines.map((routine, idx) => (
            <button
              key={routine.id}
              onClick={() => setActiveRoutineIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                idx === activeRoutineIndex
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {routine.title}
            </button>
          ))}
        </div>

        {/* Rest Timer Widget */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Descanso:</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
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

      {/* Current Workout Routine Exercises */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{currentRoutine?.title}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentRoutine?.muscleFocus} · Duración estimada {currentRoutine?.estimatedMinutes} min
            </span>
          </div>

          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {currentRoutine?.dayOfWeek}
          </span>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {currentRoutine?.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="p-5 rounded-2xl bg-slate-50/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.06] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{exercise.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exercise.instructionNotes}</p>
                </div>
                <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Descanso {exercise.restSeconds}s</span>
                </div>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06] font-semibold">
                      <th className="py-2 px-3">Serie</th>
                      <th className="py-2 px-3">Carga (kg)</th>
                      <th className="py-2 px-3">Reps</th>
                      <th className="py-2 px-3 text-right">Completado</th>
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
                        <td className="py-2 px-3 font-bold text-slate-600 dark:text-slate-400">
                          #{set.setNumber}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={set.weightKg}
                            onChange={(e) =>
                              updateSetWeightReps(
                                exercise.id,
                                set.setNumber,
                                set.reps,
                                Number(e.target.value)
                              )
                            }
                            className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSetWeightReps(
                                exercise.id,
                                set.setNumber,
                                Number(e.target.value),
                                set.weightKg
                              )
                            }
                            className="w-20 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 text-slate-900 dark:text-white text-center font-bold"
                          />
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
