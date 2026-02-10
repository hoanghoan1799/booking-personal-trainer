"use client";

import { useState, useEffect } from "react";
import type { Exercise, CreateExerciseInput } from "@/services/exercises/exercises.service";
import { MUSCLE_GROUP, EQUIPMENT, MuscleGroup, Equipment } from "@/enums/exercise.enum";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: Exercise | null;
  onSubmit: (data: CreateExerciseInput) => Promise<void>;
  title: string;
  submitLabel: string;
}

const MUSCLE_OPTIONS = Object.values(MUSCLE_GROUP).map((v) => ({
  value: v,
  label: v,
}));
const EQUIPMENT_OPTIONS = Object.values(EQUIPMENT).map((v) => ({
  value: v,
  label: v,
}));

export default function ExerciseFormModal({
  isOpen,
  onClose,
  exercise,
  onSubmit,
  title,
  submitLabel,
}: ExerciseFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_GROUP.CHEST);
  const [equipment, setEquipment] = useState<string>(EQUIPMENT.BARBELL);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setDescription(exercise.description ?? "");
      setMuscleGroup(exercise.muscleGroup);
      setEquipment(exercise.equipment);
      setThumbnailUrl(exercise.thumbnailUrl ?? "");
      setVideoUrl(exercise.videoUrl ?? "");
    } else {
      setName("");
      setDescription("");
      setMuscleGroup(MUSCLE_GROUP.CHEST);
      setEquipment(EQUIPMENT.BARBELL);
      setThumbnailUrl("");
      setVideoUrl("");
    }
  }, [exercise, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        muscleGroup: muscleGroup as MuscleGroup,
        equipment: equipment as Equipment,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      });
      toast.success(submitLabel === "Create" ? "Exercise created" : "Exercise updated");
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Something went wrong");
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

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="exercise-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name *
          </label>
          <InputField
            id="exercise-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Exercise name"
            required
            aria-label="Exercise name"
          />
        </div>
        <div>
          <label
            htmlFor="exercise-description"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <textarea
            id="exercise-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className={selectClass}
            aria-label="Exercise description"
          />
        </div>
        <div>
          <label
            htmlFor="exercise-muscle"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Muscle Group *
          </label>
          <select
            id="exercise-muscle"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            className={selectClass}
            required
            aria-label="Muscle group"
          >
            {MUSCLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="exercise-equipment"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Equipment *
          </label>
          <select
            id="exercise-equipment"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className={selectClass}
            required
            aria-label="Equipment"
          >
            {EQUIPMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="exercise-thumbnail"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Thumbnail URL
          </label>
          <InputField
            id="exercise-thumbnail"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
            aria-label="Thumbnail URL"
          />
        </div>
        <div>
          <label
            htmlFor="exercise-video"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Video URL
          </label>
          <InputField
            id="exercise-video"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            aria-label="Video URL"
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
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
