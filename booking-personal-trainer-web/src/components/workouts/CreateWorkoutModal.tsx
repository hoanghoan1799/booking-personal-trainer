"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import type { User } from "@/types/user.types";
import type { Exercise } from "@/services/exercises/exercises.service";
import { createWorkout } from "@/services/workouts/workouts.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

const DATETIME_LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";

function getDefaultStartTime(): string {
  return dayjs().add(1, "day").hour(9).minute(0).second(0).millisecond(0).format(DATETIME_LOCAL_FORMAT);
}

function getDefaultEndTime(): string {
  return dayjs().add(1, "day").hour(10).minute(0).second(0).millisecond(0).format(DATETIME_LOCAL_FORMAT);
}

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainees: User[];
  exercises: Exercise[];
  onSuccess: () => void;
}

export default function CreateWorkoutModal({
  isOpen,
  onClose,
  trainees,
  exercises,
  onSuccess,
}: CreateWorkoutModalProps) {
  const [traineeId, setTraineeId] = useState("");
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setTraineeId("");
      setExerciseIds([]);
      setStartTime(getDefaultStartTime());
      setEndTime(getDefaultEndTime());
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traineeId || exerciseIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    const startISO = dayjs(startTime).toISOString();
    const endISO = dayjs(endTime).toISOString();

    try {
      await createWorkout({
        traineeId,
        exerciseIds,
        startTime: startISO,
        endTime: endISO,
      });
      toast.success("Workout created successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create workout");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const traineeOptions = trainees.map((t) => {
    const name = [t.firstName, t.lastName].filter(Boolean).join(" ") || t.userName;
    return { value: t.id, label: name };
  });

  const handleExerciseToggle = (id: string) => {
    setExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Create Workout
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="workout-trainee"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Trainee *
          </label>
          <select
            id="workout-trainee"
            value={traineeId}
            onChange={(e) => setTraineeId(e.target.value)}
            className={selectClass}
            required
            aria-label="Select trainee"
          >
            <option value="">Select trainee</option>
            {traineeOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Exercises *
          </label>
          <div
            className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900"
            role="group"
            aria-label="Select exercises"
          >
            {exercises.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No exercises available. Add exercises first.
              </p>
            ) : (
              <ul className="space-y-2">
                {exercises.map((ex) => (
                  <li key={ex.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`ex-${ex.id}`}
                      checked={exerciseIds.includes(ex.id)}
                      onChange={() => handleExerciseToggle(ex.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                      aria-label={`Select ${ex.name}`}
                    />
                    <label
                      htmlFor={`ex-${ex.id}`}
                      className="cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                    >
                      {ex.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="workout-start"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Start Time *
          </label>
          <input
            id="workout-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={selectClass}
            required
            aria-label="Workout start time"
          />
        </div>
        <div>
          <label
            htmlFor="workout-end"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            End Time *
          </label>
          <input
            id="workout-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime}
            className={selectClass}
            required
            aria-label="Workout end time"
          />
        </div>
        {error && (
          <p className="text-sm text-error-600 dark:text-error-500">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!traineeId || exerciseIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
