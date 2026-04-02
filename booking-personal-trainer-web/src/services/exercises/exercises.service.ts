import type { MuscleGroup, Equipment } from "@/enums/exercise.enum";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  muscleGroup: string;
  equipment: string;
}

export interface GetExercisesQuery {
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  search?: string;
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
}

export interface GetExercisesResponse {
  exercises: Exercise[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface UpdateExerciseInput extends Partial<CreateExerciseInput> {}

interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

function buildQueryString(params: GetExercisesQuery): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function getExercises(
  query: GetExercisesQuery = {},
): Promise<GetExercisesResponse> {
  const qs = buildQueryString({ ...query, limit: query.limit ?? 100 });
  const res = await apiFetch<ApiResponse<Exercise[]>>(
    `${API_ENDPOINTS.EXERCISES}${qs}`,
  );
  return {
    exercises: res.data,
    meta: res.meta ?? {
      page: 1,
      limit: 100,
      totalItems: res.data.length,
      totalPages: 1,
    },
  };
}

export async function createExercise(
  input: CreateExerciseInput,
): Promise<Exercise> {
  const res = await apiFetch<{ data: Exercise }>(
    API_ENDPOINTS.EXERCISES,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function updateExercise(
  id: string,
  input: UpdateExerciseInput,
): Promise<Exercise> {
  const res = await apiFetch<{ data: Exercise }>(
    `${API_ENDPOINTS.EXERCISES}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deleteExercise(id: string): Promise<void> {
  await apiFetch<{ message?: string }>(
    `${API_ENDPOINTS.EXERCISES}/${id}`,
    { method: "DELETE" },
  );
}
