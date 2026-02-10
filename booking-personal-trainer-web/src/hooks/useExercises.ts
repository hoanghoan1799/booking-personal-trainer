"use client";

import { useCallback, useEffect, useState } from "react";
import type { Exercise, GetExercisesQuery } from "@/services/exercises/exercises.service";
import { getExercises } from "@/services/exercises/exercises.service";
import { useProfile } from "./useProfile";

export function useExercises(query: GetExercisesQuery = {}) {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExercises = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const role = currentUser.role as string;
    if (role !== "ADMIN" && role !== "TRAINER") {
      setExercises([]);
      setMeta(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await getExercises(query);
      setExercises(res.exercises);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load exercises"));
      setExercises([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, query.muscleGroup, query.equipment, query.search]);

  useEffect(() => {
    if (isProfileLoading) return;
    fetchExercises();
  }, [fetchExercises, isProfileLoading]);

  return {
    exercises,
    meta,
    isLoading: isProfileLoading || isLoading,
    error,
    refetch: fetchExercises,
    canView: currentUser?.role === "ADMIN" || currentUser?.role === "TRAINER",
    canManage: currentUser?.role === "ADMIN",
  };
}
