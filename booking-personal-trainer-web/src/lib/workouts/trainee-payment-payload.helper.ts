import type { Workout } from "@/services/workouts/workouts.service";

/**
 * Unpaid trainee workout responses omit exercises and totalExercises; paid responses
 * include them (even when the workout has zero exercises, totalExercises is 0).
 */
export const isTraineeFacingWorkoutUnlockedPayload = (
  workout: Workout,
): boolean => {
  return (
    workout.totalExercises != null || (workout.exercises?.length ?? 0) > 0
  );
};
