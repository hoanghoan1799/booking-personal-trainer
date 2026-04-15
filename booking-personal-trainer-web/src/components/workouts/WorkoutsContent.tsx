"use client";

import { useState, useEffect } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/context/ToastContext";
import { getUsers } from "@/services/users/users.service";
import { getBookings } from "@/services/bookings/bookings.service";
import { getExercises } from "@/services/exercises/exercises.service";
import {
  getWorkout,
  updateWorkoutDetail,
  type Workout,
} from "@/services/workouts/workouts.service";
import type { User } from "@/types/user.types";
import type { Exercise } from "@/services/exercises/exercises.service";
import WorkoutCard from "./WorkoutCard";
import WorkoutDetailModal from "./WorkoutDetailModal";
import CreateWorkoutModal from "./CreateWorkoutModal";
import Button from "@/components/ui/button/Button";

export default function WorkoutsContent() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [trainees, setTrainees] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { user: currentUser } = useProfile();
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

  const canUpdateWorkout = (workout: Workout) => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "TRAINER" && workout.trainer?.id === currentUser.id)
      return true;
    return false;
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

    if (currentUserRole === "ADMIN") {
      getUsers({ role: "TRAINEE", limit: 100 })
        .then((res) => setTrainees(res.users))
        .catch(() => setTrainees([]));
    } else if (currentUserRole === "TRAINER") {
      getBookings({
        trainerId: currentUserId,
        status: "CONFIRMED",
        limit: 100,
      })
        .then((res) => {
          const traineeMap = new Map<string, User>();
          res.bookings.forEach((b) => {
            if (b.trainee && !traineeMap.has(b.trainee.id)) {
              traineeMap.set(b.trainee.id, b.trainee);
            }
          });
          setTrainees(Array.from(traineeMap.values()));
        })
        .catch(() => setTrainees([]));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrainees([]);
    }

    getExercises({ limit: 200 })
      .then((res) => setExercises(res.exercises))
      .catch(() => setExercises([]));
  }, [canCreate, createModalOpen, currentUserId, currentUserRole]);

  const handleCreateSuccess = () => {
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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {workouts.map((w) => (
            <li key={w.id}>
              <WorkoutCard
                workout={w}
                onClick={handleWorkoutClick}
              />
            </li>
          ))}
        </ul>
      )}

      <WorkoutDetailModal
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        workout={selectedWorkout}
        canUpdate={selectedWorkout ? canUpdateWorkout(selectedWorkout) : false}
        onSave={handleSaveWorkout}
        onAfterPaymentSuccess={handleAfterPaymentSuccess}
      />
      <CreateWorkoutModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        trainees={trainees}
        exercises={exercises}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
