"use client";

import { useCallback, useEffect, useState } from "react";
import type { Workout } from "@/services/workouts/workouts.service";
import type { GetWorkoutsQuery } from "@/services/workouts/workouts.service";
import { getWorkouts } from "@/services/workouts/workouts.service";
import { useProfile } from "./useProfile";

export function useWorkouts(query: GetWorkoutsQuery = {}) {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkouts = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const role = currentUser.role as string;
    setIsLoading(true);
    setError(null);

    const finalQuery = { ...query };
    if (role === "TRAINER") {
      finalQuery.trainerId = currentUser.id;
    } else if (role === "TRAINEE") {
      finalQuery.traineeId = currentUser.id;
    }

    try {
      const res = await getWorkouts(finalQuery);
      setWorkouts(res.workouts);
      setMeta(res.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load workouts"),
      );
      setWorkouts([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUser,
    query.trainerId,
    query.traineeId,
    query.status,
    query.page,
  ]);

  useEffect(() => {
    if (isProfileLoading) return;
    fetchWorkouts();
  }, [fetchWorkouts, isProfileLoading]);

  return {
    workouts,
    meta,
    isLoading: isProfileLoading || isLoading,
    error,
    refetch: fetchWorkouts,
    canView:
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "TRAINER" ||
      currentUser?.role === "TRAINEE",
    canCreate: currentUser?.role === "ADMIN" || currentUser?.role === "TRAINER",
  };
}
