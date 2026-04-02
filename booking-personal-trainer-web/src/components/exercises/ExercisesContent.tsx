"use client";

import { useState } from "react";
import type { Exercise, CreateExerciseInput } from "@/services/exercises/exercises.service";
import {
  createExercise,
  updateExercise,
  deleteExercise,
} from "@/services/exercises/exercises.service";
import { MUSCLE_GROUP, EQUIPMENT, MuscleGroup, Equipment } from "@/enums/exercise.enum";
import { useExercises } from "@/hooks/useExercises";
import ExerciseCard from "./ExerciseCard";
import ExerciseDetailModal from "./ExerciseDetailModal";
import ExerciseFormModal from "./ExerciseFormModal";
import DeleteExerciseModal from "./DeleteExerciseModal";
import Button from "@/components/ui/button/Button";

export default function ExercisesContent() {
  const [muscleFilter, setMuscleFilter] = useState<string>("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewExercise, setViewExercise] = useState<Exercise | null>(null);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [deleteExerciseState, setDeleteExerciseState] =
    useState<Exercise | null>(null);

  const {
    exercises,
    isLoading,
    error,
    refetch,
    canView,
    canManage,
  } = useExercises({
    muscleGroup: muscleFilter as MuscleGroup,
    equipment: equipmentFilter as Equipment,
    search: search ,
  });

  const handleCreateSubmit = async (data: CreateExerciseInput) => {
    await createExercise(data);
    refetch();
  };

  const handleEditSubmit = async (data: CreateExerciseInput) => {
    if (!editExercise) return;
    await updateExercise(editExercise.id, data);
    refetch();
    setEditExercise(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteExerciseState) return;
    await deleteExercise(deleteExerciseState.id);
    refetch();
    setDeleteExerciseState(null);
  };

  if (!canView) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You don&apos;t have permission to view exercises.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading exercises...
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
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Search exercises"
          />
          <select
            value={muscleFilter}
            onChange={(e) => setMuscleFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Filter by muscle group"
          >
            <option value="">All muscles</option>
            {Object.values(MUSCLE_GROUP).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            aria-label="Filter by equipment"
          >
            <option value="">All equipment</option>
            {Object.values(EQUIPMENT).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            Add Exercise
          </Button>
        )}
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No exercises found.
        </p>
      ) : (
        <div className="space-y-10">
          {Object.values(MUSCLE_GROUP).map((group) => {
            const groupExercises = exercises.filter(
              (ex) => ex.muscleGroup === group,
            );
            if (groupExercises.length === 0) return null;

            return (
              <section key={group} className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  {group}
                </h4>
                <ul
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  role="list"
                >
                  {groupExercises.map((ex) => (
                    <li key={ex.id}>
                      <ExerciseCard
                        exercise={ex}
                        canManage={canManage}
                        onView={(e) => setViewExercise(e)}
                        onEdit={
                          canManage ? (e) => setEditExercise(e) : undefined
                        }
                        onDelete={
                          canManage
                            ? (e) => setDeleteExerciseState(e)
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {/* Exercises with muscle groups not in enum (e.g. from API) */}
          {exercises.filter(
            (ex) => !Object.values(MUSCLE_GROUP).includes(ex.muscleGroup as MuscleGroup),
          ).length > 0 && (
            <section className="space-y-4">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Other
              </h4>
              <ul
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
              >
                {exercises
                  .filter(
                    (ex) =>
                      !Object.values(MUSCLE_GROUP).includes(ex.muscleGroup as MuscleGroup),
                  )
                  .map((ex) => (
                    <li key={ex.id}>
                      <ExerciseCard
                        exercise={ex}
                        canManage={canManage}
                        onView={(e) => setViewExercise(e)}
                        onEdit={
                          canManage ? (e) => setEditExercise(e) : undefined
                        }
                        onDelete={
                          canManage
                            ? (e) => setDeleteExerciseState(e)
                            : undefined
                        }
                      />
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <ExerciseFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Add Exercise"
        submitLabel="Create"
      />

      <ExerciseFormModal
        isOpen={Boolean(editExercise)}
        onClose={() => setEditExercise(null)}
        exercise={editExercise}
        onSubmit={handleEditSubmit}
        title="Edit Exercise"
        submitLabel="Save"
      />

      <DeleteExerciseModal
        isOpen={Boolean(deleteExerciseState)}
        onClose={() => setDeleteExerciseState(null)}
        exercise={deleteExerciseState}
        onConfirm={handleDeleteConfirm}
      />

      <ExerciseDetailModal
        isOpen={Boolean(viewExercise)}
        onClose={() => setViewExercise(null)}
        exercise={viewExercise}
      />
    </>
  );
}
