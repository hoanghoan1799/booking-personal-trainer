"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { useTemplates } from "@/hooks/useTemplates";
import { useToast } from "@/context/ToastContext";
import { getBookings } from "@/services/bookings/bookings.service";
import type { Booking } from "@/services/bookings/bookings.service";
import {
  getWorkout,
  updateWorkoutDetail,
  type Workout,
} from "@/services/workouts/workouts.service";
import WorkoutCard from "./WorkoutCard";
import { isTraineeFacingWorkoutUnlockedPayload } from "@/lib/workouts/trainee-payment-payload.helper";
import WorkoutDetailModal from "./WorkoutDetailModal";
import CreateWorkoutFromTemplateModal from "./CreateWorkoutFromTemplateModal";
import Button from "@/components/ui/button/Button";

type DisplayUser = {
  readonly id: string;
  readonly userName: string;
  readonly firstName?: string;
  readonly lastName?: string;
};

const getDisplayName = (user: DisplayUser): string => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};

const buildWorkoutGroupLabel = (input: {
  readonly groupBy: "TRAINER" | "TRAINEE";
  readonly user: DisplayUser | null | undefined;
}): string => {
  if (!input.user) {
    return input.groupBy === "TRAINER" ? "Trainer: —" : "Trainee: —";
  }
  const name = getDisplayName(input.user);
  return input.groupBy === "TRAINER" ? `Trainer: ${name}` : `Trainee: ${name}`;
};

const groupWorkoutsBy = (input: {
  readonly workouts: readonly Workout[];
  readonly groupBy: "TRAINER" | "TRAINEE";
}): ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly workouts: readonly Workout[];
}> => {
  const groups = new Map<string, { label: string; workouts: Workout[] }>();
  for (const workout of input.workouts) {
    const user =
      input.groupBy === "TRAINER"
        ? (workout.trainer as DisplayUser | null | undefined)
        : (workout.trainee as DisplayUser | null | undefined);
    const key = user?.id ?? "unknown";
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        label: buildWorkoutGroupLabel({ groupBy: input.groupBy, user }),
        workouts: [workout],
      });
      continue;
    }
    existing.workouts.push(workout);
  }
  return [...groups.entries()]
    .map(([key, value]) => ({ key, label: value.label, workouts: value.workouts }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
};

export default function WorkoutsContent() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { user: currentUser } = useProfile();
  const { templates, executeReload: executeReloadTemplates } = useTemplates();
  const currentUserId = currentUser?.id ?? null;
  const currentUserRole = (currentUser?.role as string | undefined) ?? null;
  const toast = useToast();
  const {
    workouts,
    isLoading,
    error,
    refetch,
    canView,
    canCreate,
  } = useWorkouts({
    status: statusFilter as "PENDING" | "IN_PROGRESS" | "DONE",
  });
  const groupBy: "TRAINER" | "TRAINEE" =
    currentUserRole === "TRAINER" ? "TRAINEE" : "TRAINER";
  const groupedWorkouts = useMemo(
    () => groupWorkoutsBy({ workouts, groupBy }),
    [workouts, groupBy],
  );

  const canUpdateWorkout = (workout: Workout) => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "TRAINER" && workout.trainer?.id === currentUser.id)
      return true;
    return false;
  };

  const resolveTraineeListPaymentUnlocked = (w: Workout): boolean | undefined => {
    if (currentUserRole !== "TRAINEE" || !currentUserId) {
      return undefined;
    }
    if (w.trainee?.id !== currentUserId) {
      return undefined;
    }
    return isTraineeFacingWorkoutUnlockedPayload(w);
  };

  const handleSaveWorkout = async (
    workoutId: string,
    payload: {
      status?: "PENDING" | "IN_PROGRESS" | "DONE";
      exerciseCompletions: { workoutExerciseId: string; isCompleted: boolean }[];
    },
  ) => {
    try {
      await updateWorkoutDetail(workoutId, payload);
      toast.success("Workout saved");
      handleCloseDetailModal();
      refetch();
      return undefined;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save workout";
      toast.error(msg);
      throw err;
    }
  };

  useEffect(() => {
    if (!canCreate || !createModalOpen || !currentUserId || !currentUserRole)
      return;
    if (currentUserRole !== "ADMIN" && currentUserRole !== "TRAINER") {
      const timeoutId = window.setTimeout(() => {
        setConfirmedBookings([]);
      }, 0);
      return (): void => {
        window.clearTimeout(timeoutId);
      };
    }
    const query =
      currentUserRole === "TRAINER"
        ? { trainerId: currentUserId, status: "CONFIRMED" as const, limit: 100 }
        : { status: "CONFIRMED" as const, limit: 200 };
    void getBookings(query)
      .then((res) => setConfirmedBookings(res.bookings))
      .catch(() => setConfirmedBookings([]));
  }, [canCreate, createModalOpen, currentUserId, currentUserRole]);

  const handleCreateSuccess = () => {
    void executeReloadTemplates();
    refetch();
  };

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedWorkout(null);
  };

  const handleAfterPaymentSuccess = async () => {
    await refetch();
    if (selectedWorkout) {
      try {
        const fresh = await getWorkout(selectedWorkout.id);
        setSelectedWorkout(fresh);
      } catch {
        /* ignore refresh errors */
      }
    }
  };

  if (!canView) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You don&apos;t have permission to view workouts. Contact your trainer to
        access your workouts.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading workouts...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-sm text-error-600 dark:text-error-500">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            Create Workout
          </Button>
        )}
      </div>

      {workouts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No workouts found.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedWorkouts.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {group.label}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {group.workouts.length} workouts
                </span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
                {group.workouts.map((w) => (
                  <li key={w.id}>
                    <WorkoutCard
                      workout={w}
                      onClick={handleWorkoutClick}
                      traineeListPaymentUnlocked={resolveTraineeListPaymentUnlocked(w)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <WorkoutDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        workout={selectedWorkout}
        canUpdate={selectedWorkout ? canUpdateWorkout(selectedWorkout) : false}
        onSave={handleSaveWorkout}
        onAfterPaymentSuccess={handleAfterPaymentSuccess}
      />
      <CreateWorkoutFromTemplateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        confirmedBookings={confirmedBookings}
        templates={templates}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
