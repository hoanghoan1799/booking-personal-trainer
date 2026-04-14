"use client";

import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import type {
  CreateTrainerAvailabilityInput,
  CreateTrainerTimeOffInput,
  TrainerAvailability,
  TrainerTimeOff,
  UpdateTrainerAvailabilityInput,
  UpdateTrainerTimeOffInput,
} from "@/services/trainer-schedule/trainer-schedule.types";
import {
  createAvailability,
  createTimeOff,
  deleteAvailability,
  deleteTimeOff,
  getMyAvailabilities,
  getMyTimeOff,
  updateAvailability,
  updateTimeOff,
} from "@/services/trainer-schedule/trainer-schedule.service";

type UseTrainerScheduleResult = {
  readonly availabilities: TrainerAvailability[];
  readonly timeOff: TrainerTimeOff[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refetchAll: () => Promise<void>;
  readonly createAvailability: (
    input: CreateTrainerAvailabilityInput,
  ) => Promise<void>;
  readonly updateAvailability: (input: {
    availabilityId: string;
    update: UpdateTrainerAvailabilityInput;
  }) => Promise<void>;
  readonly deleteAvailability: (input: { availabilityId: string }) => Promise<void>;
  readonly createTimeOff: (input: CreateTrainerTimeOffInput) => Promise<void>;
  readonly updateTimeOff: (input: {
    timeOffId: string;
    update: UpdateTrainerTimeOffInput;
  }) => Promise<void>;
  readonly deleteTimeOff: (input: { timeOffId: string }) => Promise<void>;
};

export const useTrainerSchedule = (): UseTrainerScheduleResult => {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [availabilities, setAvailabilities] = useState<TrainerAvailability[]>([]);
  const [timeOff, setTimeOff] = useState<TrainerTimeOff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    if (currentUser.role !== "TRAINER") {
      setAvailabilities([]);
      setTimeOff([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [availabilityRes, timeOffRes] = await Promise.all([
        getMyAvailabilities({ limit: 100 }),
        getMyTimeOff({ limit: 100 }),
      ]);
      setAvailabilities(availabilityRes.availabilities);
      setTimeOff(timeOffRes.timeOff);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load trainer schedule"),
      );
      setAvailabilities([]);
      setTimeOff([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isProfileLoading) {
      return;
    }
    void fetchAll();
  }, [fetchAll, isProfileLoading]);

  const handleCreateAvailability = useCallback(
    async (input: CreateTrainerAvailabilityInput): Promise<void> => {
      await createAvailability(input);
      await fetchAll();
    },
    [fetchAll],
  );

  const handleUpdateAvailability = useCallback(
    async (input: {
      availabilityId: string;
      update: UpdateTrainerAvailabilityInput;
    }): Promise<void> => {
      await updateAvailability(input);
      await fetchAll();
    },
    [fetchAll],
  );

  const handleDeleteAvailability = useCallback(
    async (input: { availabilityId: string }): Promise<void> => {
      await deleteAvailability(input);
      await fetchAll();
    },
    [fetchAll],
  );

  const handleCreateTimeOff = useCallback(
    async (input: CreateTrainerTimeOffInput): Promise<void> => {
      await createTimeOff(input);
      await fetchAll();
    },
    [fetchAll],
  );

  const handleUpdateTimeOff = useCallback(
    async (input: {
      timeOffId: string;
      update: UpdateTrainerTimeOffInput;
    }): Promise<void> => {
      await updateTimeOff(input);
      await fetchAll();
    },
    [fetchAll],
  );

  const handleDeleteTimeOff = useCallback(
    async (input: { timeOffId: string }): Promise<void> => {
      await deleteTimeOff(input);
      await fetchAll();
    },
    [fetchAll],
  );

  return {
    availabilities,
    timeOff,
    isLoading: isProfileLoading || isLoading,
    error,
    refetchAll: fetchAll,
    createAvailability: handleCreateAvailability,
    updateAvailability: handleUpdateAvailability,
    deleteAvailability: handleDeleteAvailability,
    createTimeOff: handleCreateTimeOff,
    updateTimeOff: handleUpdateTimeOff,
    deleteTimeOff: handleDeleteTimeOff,
  };
};

