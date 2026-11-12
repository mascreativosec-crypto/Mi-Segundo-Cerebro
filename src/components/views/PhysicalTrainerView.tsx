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
      {/* Top Banner: User Bio Calibration */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 via-[#0d1a13] to-[#070e0a] border border-emerald-500/20 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Mi Entrenador Físico Inteligente</h1>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  CALIBRADO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Salud, vitalidad, composición corporal y recuperación basada en sobrecarga progresiva.
              </p>
            </div>
          </div>

          {/* User Bio Stats */}
          <div className="flex items-center gap-3 bg-[#08100c] border border-emerald-500/15 rounded-xl px-4 py-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">ESTATURA</span>
              <span className="font-bold text-white tabular-nums">1.68 m</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 block">PESO ACTUAL</span>
              <span className="font-bold text-emerald-400 tabular-nums">70 kg</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 block">IMC REFERENCIAL</span>
              <span className="font-bold text-slate-300 tabular-nums">24.8</span>
            </div>
          </div>
        </div>

        {/* Nutritional & Pre-Workout Recommendation Box */}
        <div className="mt-4 pt-4 border-t border-emerald-500/15 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800/80">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2 mb-1">
              <Apple className="w-3.5 h-3.5" />
              Nutrición Pre-Entrenamiento (60-90 min antes)
            </span>
            <p className="text-xs text-slate-300">
              {data.nutritionLog.preWorkoutMeal}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#08100c] border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-1">
                <Droplets className="w-3.5 h-3.5" />
                Hidratación Hoy ({waterTotalLiters} L)
              </span>
              <span className="text-[11px] text-slate-400">
                {data.nutritionLog.waterGlasses250ml} vasos de 250ml · Meta recomendada 2.5L
              </span>
            </div>
            <button
              onClick={addGlassOfWater}
              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium cursor-pointer"
            >
              +1 Vaso
            </button>
          </div>
        </div>
      </div>

      {/* Routine Selector & Rest Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Routine tabs */}
        <div className="flex items-center gap-2">
          {data.workoutRoutines.map((routine, idx) => (
            <button
              key={routine.id}
              onClick={() => setActiveRoutineIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                idx === activeRoutineIndex
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                  : 'bg-[#0c1812] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {routine.title}
            </button>
          ))}
        </div>

        {/* Rest Timer Widget */}
        <div className="flex items-center gap-3 bg-[#0c1812] border border-emerald-500/20 px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-mono">Cronómetro de Descanso:</span>
          <span className="text-base font-mono font-bold text-emerald-400 tabular-nums">
            {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
          </span>
          {timerRunning ? (
            <button
              onClick={() => setTimerRunning(false)}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={() => startRestTimer(60)}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              +60s
            </button>
          )}
        </div>
      </div>

      {/* Current Workout Routine Exercises */}
      <div className="rounded-2xl bg-[#0c1812] border border-emerald-500/15 p-5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{currentRoutine?.title}</h2>
            <span className="text-xs text-slate-400">
              {currentRoutine?.muscleFocus} · Duración estimada {currentRoutine?.estimatedMinutes} min
            </span>
          </div>

          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {currentRoutine?.dayOfWeek}
          </span>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {currentRoutine?.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="p-4 rounded-xl bg-[#08100c] border border-slate-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{exercise.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{exercise.instructionNotes}</p>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-400">
                  <span>Descanso {exercise.restSeconds}s</span>
                </div>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 font-mono">
                      <th className="py-1 px-2">Serie</th>
                      <th className="py-1 px-2">Carga (kg)</th>
                      <th className="py-1 px-2">Reps</th>
                      <th className="py-1 px-2 text-right">Completado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set) => (
                      <tr
                        key={set.setNumber}
                        className={`border-b border-slate-900 ${
                          set.completed ? 'bg-emerald-950/10' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 font-mono font-bold text-slate-400">
                          #{set.setNumber}
                        </td>
                        <td className="py-1.5 px-2 font-mono">
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
                            className="w-16 bg-slate-900/60 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-center"
                          />
                        </td>
                        <td className="py-1.5 px-2 font-mono">
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
                            className="w-16 bg-slate-900/60 border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 text-center"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            onClick={() => toggleSetComplete(exercise.id, set.setNumber)}
                            className="cursor-pointer"
                          >
                            {set.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400 ml-auto transition-colors" />
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
