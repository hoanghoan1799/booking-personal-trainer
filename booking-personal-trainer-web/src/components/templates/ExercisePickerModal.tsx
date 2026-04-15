"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useExercises } from "@/hooks/useExercises";
import type { Exercise } from "@/services/exercises/exercises.service";

type ExercisePickerModalProps = {
  isOpen: boolean;
  selectedExerciseId: string | null;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  /** When set, uses this list instead of the default hook (e.g. full catalog for name resolution). */
  exercisesOverride?: Exercise[];
  /** When using exercisesOverride, set true while the parent is still loading. */
  exercisesOverrideLoading?: boolean;
};

function groupExercisesByMuscleGroup(exercises: Exercise[]): Record<string, Exercise[]> {
  return exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.muscleGroup || "OTHER";
    acc[key] = acc[key] ? [...acc[key], ex] : [ex];
    return acc;
  }, {});
}

export default function ExercisePickerModal(props: ExercisePickerModalProps) {
  const hook = useExercises({ limit: 500 });
  const useOverride = props.exercisesOverride !== undefined;
  const exercises: Exercise[] = useOverride
    ? (props.exercisesOverride ?? [])
    : hook.exercises;
  const isLoading = useOverride
    ? Boolean(props.exercisesOverrideLoading)
    : hook.isLoading;
  const error = useOverride ? null : hook.error;
  const canView = useOverride ? true : hook.canView;
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => {
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        ex.equipment.toLowerCase().includes(q)
      );
    });
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const groupedRecord = groupExercisesByMuscleGroup(filtered);
    return Object.entries(groupedRecord).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} className="max-w-3xl p-6">
      <div className="space-y-5">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Choose exercise
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Exercises are grouped by muscle group. Click one to select.
          </p>
        </div>

        <label>
          <span className="sr-only">Search exercises</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, muscle group, equipment..."
            aria-label="Search exercises"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        {!canView ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            Your role cannot view exercises. Ask an admin/trainer account to load the exercises list.
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading exercises...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-200">
            {error.message}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            {grouped.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-400">No exercises found.</p>
            ) : (
              <div className="space-y-4">
                {grouped.map(([muscleGroup, list]) => (
                  <section key={muscleGroup} className="space-y-2">
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {muscleGroup}
                    </p>
                    <ul className="space-y-1" role="list" aria-label={`${muscleGroup} exercises`}>
                      {list
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((ex) => {
                          const isSelected = props.selectedExerciseId === ex.id;
                          return (
                            <li key={ex.id}>
                              <button
                                type="button"
                                onClick={() => props.onSelect(ex)}
                                aria-label={`Select exercise ${ex.name}`}
                                className={`w-full rounded-lg border px-3 py-2 text-left transition outline-none ${
                                  isSelected
                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                      {ex.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                      {ex.equipment} • {ex.muscleGroup}
                                    </p>
                                  </div>
                                  {isSelected ? (
                                    <span className="shrink-0 rounded-full bg-brand-500 px-2 py-1 text-xs font-medium text-white">
                                      Selected
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={props.onClose} aria-label="Close exercise picker">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

