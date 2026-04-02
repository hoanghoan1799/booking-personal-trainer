"use client";

import { useState } from "react";
import type { Exercise } from "@/services/exercises/exercises.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface DeleteExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onConfirm: () => Promise<void>;
}

export default function DeleteExerciseModal({
  isOpen,
  onClose,
  exercise,
  onConfirm,
}: DeleteExerciseModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success("Exercise deleted");
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete exercise"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Delete Exercise
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Are you sure you want to delete <strong>{exercise.name}</strong>? This
        action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="bg-error-500 text-white hover:bg-error-600"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
