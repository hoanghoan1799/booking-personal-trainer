"use client";

import type { Exercise } from "@/services/exercises/exercises.service";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";

interface ExerciseCardProps {
  exercise: Exercise;
  onView?: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  canManage?: boolean;
}

export default function ExerciseCard({
  exercise,
  onView,
  onEdit,
  onDelete,
  canManage = false,
}: ExerciseCardProps) {
  const handleCardClick = () => {
    onView?.(exercise);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onView && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onView(exercise);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800 ${
        onView ? "cursor-pointer transition-colors hover:border-brand-400 hover:bg-gray-50 dark:hover:border-brand-600 dark:hover:bg-white/[0.04]" : ""
      }`}
      role={onView ? "button" : "listitem"}
      tabIndex={onView ? 0 : undefined}
      onClick={onView ? handleCardClick : undefined}
      onKeyDown={onView ? handleKeyDown : undefined}
      aria-label={onView ? `View details for ${exercise.name}` : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-gray-800 dark:text-white/90">
          {exercise.name}
        </h4>
        {canManage && (onEdit || onDelete) && (
          <div
            className="flex shrink-0 gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(exercise)}
                aria-label={`Edit ${exercise.name}`}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(exercise)}
                className="text-error-600 hover:border-error-300 dark:text-error-500"
                aria-label={`Delete ${exercise.name}`}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      {exercise.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {exercise.description}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Badge color="info" size="sm">
          {exercise.muscleGroup}
        </Badge>
        <Badge color="light" size="sm">
          {exercise.equipment}
        </Badge>
      </div>
    </div>
  );
}
