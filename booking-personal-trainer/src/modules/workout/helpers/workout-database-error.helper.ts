import { WorkoutConstants } from '../constants/workout.constants';

export const isUniqueViolation = (err: unknown): boolean =>
  (err as { readonly code?: unknown } | null | undefined)?.code ===
  WorkoutConstants.Postgres.UniqueViolationCode;
