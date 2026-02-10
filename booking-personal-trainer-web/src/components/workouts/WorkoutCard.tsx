"use client";

import type { Workout } from "@/services/workouts/workouts.service";
import Badge from "@/components/ui/badge/Badge";

function getDisplayName(user: { firstName?: string; lastName?: string; userName: string }) {
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

function getStatusColor(status: string): "primary" | "success" | "error" | "warning" | "info" {
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

interface WorkoutCardProps {
  workout: Workout;
  onClick?: (workout: Workout) => void;
}

export default function WorkoutCard({
  workout,
  onClick,
}: WorkoutCardProps) {
  const trainerName = workout.trainer ? getDisplayName(workout.trainer) : "—";
  const traineeName = workout.trainee ? getDisplayName(workout.trainee) : "—";
  const completed = workout.completedExercises ?? 0;
  const total = workout.totalExercises ?? workout.exercises?.length ?? 0;

  const handleCardClick = () => {
    onClick?.(workout);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(workout);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 ${onClick ? "cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50/50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50" : ""}`}
      role={onClick ? "button" : "listitem"}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? handleCardClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={onClick ? `View workout details for ${traineeName}` : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge color={getStatusColor(workout.status)} size="sm">
          {workout.status}
        </Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completed}/{total} exercises
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-500">Trainer:</span> {trainerName}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-500">Trainee:</span> {traineeName}
        </span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {formatDateTime(workout.startTime)} – {formatDateTime(workout.endTime)}
      </span>
      {workout.exercises && workout.exercises.length > 0 && (
        <ul className="mt-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          {workout.exercises
            .slice()
            .sort((a, b) => a.order - b.order)
            .slice(0, 3)
            .map((we, i) => (
              <li key={i}>
                {we.order}. {we.exercise?.name ?? "—"}
                {we.isCompleted && " ✓"}
              </li>
            ))}
          {workout.exercises.length > 3 && (
            <li>+{workout.exercises.length - 3} more</li>
          )}
        </ul>
      )}
    </div>
  );
}
