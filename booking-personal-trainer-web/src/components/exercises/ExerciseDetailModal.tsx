"use client";

import type { Exercise } from "@/services/exercises/exercises.service";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import Image from "next/image";

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

export default function ExerciseDetailModal({
  isOpen,
  onClose,
  exercise,
}: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {exercise.name}
      </h3>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge color="info" size="sm">
            {exercise.muscleGroup}
          </Badge>
          <Badge color="light" size="sm">
            {exercise.equipment}
          </Badge>
        </div>
        {exercise.description && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {exercise.description}
            </p>
          </div>
        )}
        {exercise.thumbnailUrl && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Thumbnail
            </h4>
            <Image
              src={exercise.thumbnailUrl}
              alt={`${exercise.name} thumbnail`}
              width={640}
              height={360}
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
              className="h-auto max-h-48 w-auto rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </div>
        )}
        {exercise.videoUrl && (
          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Video
            </h4>
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-500 hover:underline"
            >
              Watch video
            </a>
          </div>
        )}
        {!exercise.description && !exercise.thumbnailUrl && !exercise.videoUrl && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No additional details available.
          </p>
        )}
      </div>
    </Modal>
  );
}
