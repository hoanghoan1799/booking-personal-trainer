"use client";

import { useEffect, useState } from "react";
import type {
  Workout,
  WorkoutExercise,
  WorkoutStatus,
} from "@/services/workouts/workouts.service";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";

const WORKOUT_STATUSES: WorkoutStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];

function getDisplayName(user: {
  firstName?: string;
  lastName?: string;
  userName: string;
}) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusColor(
  status: string,
): "primary" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "info";
    case "PENDING":
      return "warning";
    default:
      return "primary";
  }
}

function toExercisesArray(
  raw: Workout["exercises"],
): WorkoutExercise[] {
  if (Array.isArray(raw)) return raw;
  const o = raw as { items?: WorkoutExercise[] } | undefined;
  if (o?.items && Array.isArray(o.items)) return o.items;
  if (raw && typeof raw === "object") {
    return Object.values(raw).filter(
      (v): v is WorkoutExercise =>
        v != null &&
        typeof v === "object" &&
        "order" in v &&
        "exercise" in v,
    );
  }
  return [];
}

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  canUpdate?: boolean;
  onSave?: (
    workoutId: string,
    payload: {
      status?: WorkoutStatus;
      exerciseCompletions: { workoutExerciseId: string; isCompleted: boolean }[];
    },
  ) => Promise<Workout | void>;
}

export default function WorkoutDetailModal({
  isOpen,
  onClose,
  workout,
  canUpdate = false,
  onSave,
}: WorkoutDetailModalProps) {
  const [localStatus, setLocalStatus] = useState<WorkoutStatus>("PENDING");
  const [localExercises, setLocalExercises] = useState<
    {
      id: string;
      order: number;
      sets?: number | null;
      reps?: number | null;
      restSeconds?: number | null;
      notes?: string;
      isCompleted: boolean;
      exercise: WorkoutExercise["exercise"];
    }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const workoutId = workout?.id ?? null;
  const workoutStatus = (workout?.status as WorkoutStatus | undefined) ?? null;
  const workoutExercises = workout?.exercises ?? null;

  useEffect(() => {
    if (!workoutId || !workoutStatus || !workoutExercises) return;
    setSaveError(null);
    setLocalStatus(workoutStatus ?? "PENDING");
    const arr = toExercisesArray(workoutExercises);
    setLocalExercises(
      arr
        .sort((a, b) => a.order - b.order)
        .map((we) => ({
          id: we.id,
          order: we.order,
          sets: we.sets ?? null,
          reps: we.reps ?? null,
          restSeconds: we.restSeconds ?? null,
          notes: we.notes ?? "",
          isCompleted: we.isCompleted,
          exercise: we.exercise,
        })),
    );
  }, [workoutId, workoutStatus, workoutExercises]);

  if (!workout) return null;

  const trainerName = workout.trainer ? getDisplayName(workout.trainer) : "—";
  const traineeName = workout.trainee ? getDisplayName(workout.trainee) : "—";
  const completed = localExercises.filter((e) => e.isCompleted).length;
  const total = localExercises.length;

  const initialExercises = toExercisesArray(workout.exercises).sort(
    (a, b) => a.order - b.order,
  );
  const statusChanged = localStatus !== (workout.status as WorkoutStatus);
  const exercisesChanged =
    localExercises.length !== initialExercises.length ||
    localExercises.some((le) => {
      const initial = initialExercises.find((ie) => ie.id === le.id);
      return initial ? initial.isCompleted !== le.isCompleted : false;
    });
  const hasChanges = statusChanged || exercisesChanged;

  const handleToggleExercise = (id: string) => {
    setLocalExercises((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, isCompleted: !e.isCompleted } : e,
      ),
    );
  };

  const handleCheckAll = (checked: boolean) => {
    setLocalExercises((prev) =>
      prev.map((e) => ({ ...e, isCompleted: checked })),
    );
  };

  const handleSave = async () => {
    if (!hasChanges || !onSave || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const exerciseCompletions = localExercises.map((e) => ({
        workoutExerciseId: e.id,
        isCompleted: e.isCompleted,
      }));
      const payload: {
        status?: WorkoutStatus;
        exerciseCompletions: { workoutExerciseId: string; isCompleted: boolean }[];
      } = { exerciseCompletions };
      if (statusChanged) payload.status = localStatus;
      await onSave(workout.id, payload);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save workout",
      );
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="space-y-4">
        <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Workout Details
        </h5>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              Status:{" "}
            </span>
            {canUpdate ? (
              <select
                value={localStatus}
                onChange={(e) =>
                  setLocalStatus(e.target.value as WorkoutStatus)
                }
                className="h-8 rounded border border-gray-300 bg-white px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                aria-label="Workout status"
              >
                {WORKOUT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <Badge color={getStatusColor(workout.status)} size="sm">
                {workout.status}
              </Badge>
            )}
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              Trainer:{" "}
            </span>
            <span className="text-gray-800 dark:text-white/90">
              {trainerName}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              Trainee:{" "}
            </span>
            <span className="text-gray-800 dark:text-white/90">
              {traineeName}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              Start:{" "}
            </span>
            <span className="text-gray-800 dark:text-white/90">
              {formatDateTime(workout.startTime)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              End:{" "}
            </span>
            <span className="text-gray-800 dark:text-white/90">
              {formatDateTime(workout.endTime)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-500">
              Progress:{" "}
            </span>
            <span className="text-gray-800 dark:text-white/90">
              {completed}/{total} exercises completed
            </span>
          </div>
        </div>
        {saveError && (
          <div
            role="alert"
            className="rounded-lg border border-error-500/30 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-500"
          >
            {saveError}
          </div>
        )}
        {localExercises.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h6 className="font-medium text-gray-700 dark:text-gray-300">
                Exercises
              </h6>
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => handleCheckAll(completed < total)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  aria-label={
                    completed < total
                      ? "Mark all as complete"
                      : "Mark all as incomplete"
                  }
                >
                  {completed < total ? "Check All" : "Uncheck All"}
                </button>
              )}
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              {localExercises.map((we) => (
                <li
                  key={we.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  {canUpdate ? (
                    <label className="flex flex-1 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={we.isCompleted}
                        onChange={() => handleToggleExercise(we.id)}
                        className="h-4 w-4 rounded border-gray-300 text-success-600 focus:ring-success-500"
                        aria-label={`Mark ${we.exercise?.name ?? "exercise"} as ${we.isCompleted ? "incomplete" : "complete"}`}
                      />
                      <span className="font-medium text-gray-500 dark:text-gray-500">
                        {we.order}.
                      </span>
                      <span>{we.exercise?.name ?? "—"}</span>
                      {we.isCompleted && (
                        <span className="ml-auto text-success-600">✓</span>
                      )}
                    </label>
                  ) : (
                    <>
                      <span className="font-medium text-gray-500 dark:text-gray-500">
                        {we.order}.
                      </span>
                      <span className="min-w-0 flex-1 truncate">{we.exercise?.name ?? "—"}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {[
                          we.sets != null ? `${we.sets}x` : null,
                          we.reps != null ? `${we.reps} reps` : null,
                          we.restSeconds != null ? `${we.restSeconds}s` : null,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </span>
                      {we.isCompleted && (
                        <span className="ml-auto text-success-600">✓</span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2">
          {canUpdate && onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="rounded-lg bg-blue-light-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-light-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
