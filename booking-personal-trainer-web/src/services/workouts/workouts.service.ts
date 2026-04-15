import type { User } from "@/types/user.types";
import type { Exercise } from "@/services/exercises/exercises.service";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";

export interface WorkoutExercise {
  id: string;
  order: number;
  sets?: number | null;
  reps?: number | null;
  restSeconds?: number | null;
  notes?: string;
  isCompleted: boolean;
  exercise: Exercise;
}

export interface Workout {
  id: string;
  bookingId?: string | null;
  templateId?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  trainer: User;
  trainee: User;
  exercises: WorkoutExercise[];
  totalExercises?: number;
  completedExercises?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetWorkoutsQuery {
  trainerId?: string;
  traineeId?: string;
  status?: "PENDING" | "IN_PROGRESS" | "DONE";
  page?: number;
  limit?: number;
}

export interface GetWorkoutsResponse {
  workouts: Workout[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateWorkoutInput {
  traineeId: string;
  exerciseIds: string[];
  startTime: string;
  endTime: string;
}

export interface CreateWorkoutForBookingFromTemplateInput {
  templateId: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

function buildQueryString(params: GetWorkoutsQuery): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function getWorkouts(
  query: GetWorkoutsQuery = {},
): Promise<GetWorkoutsResponse> {
  const qs = buildQueryString({ ...query, limit: query.limit ?? 50 });
  const res = await apiFetch<ApiResponse<Workout[]>>(
    `${API_ENDPOINTS.WORKOUTS}${qs}`,
  );
  return {
    workouts: res.data,
    meta: res.meta ?? {
      page: 1,
      limit: 50,
      totalItems: res.data.length,
      totalPages: 1,
    },
  };
}

export async function getWorkout(id: string): Promise<Workout> {
  const res = await apiFetch<{ data: Workout }>(
    `${API_ENDPOINTS.WORKOUTS}/${id}`,
  );
  return res.data;
}

export async function createWorkout(
  input: CreateWorkoutInput,
): Promise<Workout> {
  const res = await apiFetch<{ data: Workout }>(
    API_ENDPOINTS.WORKOUTS,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function createWorkoutForBookingFromTemplate(
  bookingId: string,
  input: CreateWorkoutForBookingFromTemplateInput,
): Promise<Workout> {
  const res = await apiFetch<{ data: Workout }>(
    `${API_ENDPOINTS.BOOKINGS}/${bookingId}/workouts`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export type WorkoutStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface UpdateWorkoutDetailInput {
  status?: WorkoutStatus;
  exerciseCompletions?: { workoutExerciseId: string; isCompleted: boolean }[];
}

export async function updateWorkoutDetail(
  workoutId: string,
  input: UpdateWorkoutDetailInput,
): Promise<Workout> {
  const res = await apiFetch<{ data: Workout }>(
    `${API_ENDPOINTS.WORKOUTS}/${workoutId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}
