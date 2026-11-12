/**
 * @license Apache-2.0
 * CONTRACT DE INTEGRACIÓN MODULAR: SÚPER MAÑANA & SÚPER NOCHE
 *
 * Este archivo define los puntos de conexión, tipos de datos y adaptadores
 * para la futura integración del código independiente que proveerá el usuario.
 *
 * CÓMO INTEGRAR EL CÓDIGO EXTERNO:
 * 1. Implementar la interfaz `ISuperMorningAdapter` o `ISuperNightAdapter`.
 * 2. Mapear los estados del componente externo a `ISuperMorningRoutine` o `ISuperNightReview`.
 * 3. Reemplazar o envolver los componentes en `src/modules/super-morning/` y `src/modules/super-night/`.
 */

import { ISuperMorningRoutine, ISuperNightReview, RoutineStep } from '../../types';

export interface ISuperMorningAdapter {
  name: string;
  version: string;
  getRoutineForDate(date: string): Promise<ISuperMorningRoutine> | ISuperMorningRoutine;
  saveRoutine(routine: ISuperMorningRoutine): Promise<void> | void;
  onStepComplete?(stepId: string): void;
  onAllCompleted?(completedAt: string): void;
}

export interface ISuperNightAdapter {
  name: string;
  version: string;
  getReviewForDate(date: string): Promise<ISuperNightReview> | ISuperNightReview;
  saveReview(review: ISuperNightReview): Promise<void> | void;
  onReviewSubmit?(review: ISuperNightReview): void;
}

export interface ModuleIntegrationHook {
  sourceCodeProvided: boolean;
  version: string;
  lastSyncTimestamp?: string;
  adapterConfig?: Record<string, any>;
}

export const defaultRoutineStepsTemplate: RoutineStep[] = [
  { id: 'step_water', label: 'Hidratación 500ml + exposición a luz solar natural', durationMinutes: 5, completed: false },
  { id: 'step_faith', label: 'Silencio, oración / meditación y gratitud', durationMinutes: 10, completed: false },
  { id: 'step_priorities', label: 'Fijación innegociable de las 3 Prioridades del día', durationMinutes: 10, completed: false },
  { id: 'step_fuel', label: 'Desayuno pre-entreno y preparación física', durationMinutes: 20, completed: false },
  { id: 'step_mindset', label: 'Mensaje de Activación de Mentalidad (IA Coach)', durationMinutes: 5, completed: false }
];
