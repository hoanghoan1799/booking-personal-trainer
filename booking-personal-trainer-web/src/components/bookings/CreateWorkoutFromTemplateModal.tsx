"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import type { ExerciseTemplate, ExerciseTemplateItem } from "@/types/template.types";
import { createWorkoutForBookingFromTemplate } from "@/services/workouts/workouts.service";
import { createTemplate, createTemplateItem } from "@/services/templates/templates.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useExercises } from "@/hooks/useExercises";
import ExercisePickerModal from "@/components/templates/ExercisePickerModal";
import type { Exercise } from "@/services/exercises/exercises.service";

type Option = { value: string; label: string };

interface CreateWorkoutFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  templates: ExerciseTemplate[];
  onSuccess: () => void;
}

type EditableTemplateItem = {
  readonly id: string;
  readonly exerciseId: string;
  readonly order: number;
  sets: string;
  reps: string;
  restSeconds: string;
  notes: string;
};

function getTemplateLabel(t: ExerciseTemplate): string {
  const suffix = t.templateType === "TRAINER" ? "Trainer" : t.templateType === "SYSTEM" ? "System" : "Public";
  return `${t.name} • ${suffix} • ${t.items.length} items`;
}

function parseNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export default function CreateWorkoutFromTemplateModal({
  isOpen,
  onClose,
  booking,
  templates,
  onSuccess,
}: CreateWorkoutFromTemplateModalProps) {
  const [templateId, setTemplateId] = useState<string>("");
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>("");
  const [templateDescription, setTemplateDescription] = useState<string>("");
  const [editableItems, setEditableItems] = useState<EditableTemplateItem[]>([]);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState<boolean>(false);
  const [addingItemForm, setAddingItemForm] = useState<{
    exerciseId: string;
    sets: string;
    reps: string;
    restSeconds: string;
    notes: string;
  }>({
    exerciseId: "",
    sets: "",
    reps: "",
    restSeconds: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { exercises } = useExercises({ limit: 200 });

  useEffect(() => {
    if (!isOpen) return;
    setTemplateId("");
    setIsCustomizing(false);
    setTemplateName("");
    setTemplateDescription("");
    setEditableItems([]);
    setAddingItemForm({
      exerciseId: "",
      sets: "",
      reps: "",
      restSeconds: "",
      notes: "",
    });
    setError(null);
  }, [isOpen]);

  const templateOptions: Option[] = useMemo(() => {
    return templates
      .slice()
      .filter((t) => !t.isDeleted)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.id, label: getTemplateLabel(t) }));
  }, [templates]);

  const selectedTemplate: ExerciseTemplate | null = useMemo(() => {
    if (!templateId) return null;
    return templates.find((t) => t.id === templateId) ?? null;
  }, [templateId, templates]);

  useEffect(() => {
    if (!selectedTemplate) return;
    setTemplateName(selectedTemplate.name);
    setTemplateDescription(selectedTemplate.description);
    setEditableItems(
      selectedTemplate.items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item.id,
          exerciseId: item.exerciseId,
          order: item.order,
          sets: item.sets === null ? "" : String(item.sets),
          reps: item.reps === null ? "" : String(item.reps),
          restSeconds: item.restSeconds === null ? "" : String(item.restSeconds),
          notes: item.notes ?? "",
        })),
    );
  }, [selectedTemplate]);

  const exerciseNameById = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e.name]));
  }, [exercises]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking?.id || !templateId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (!isCustomizing) {
        await createWorkoutForBookingFromTemplate(booking.id, { templateId });
        toast.success("Workout created from template");
        onSuccess();
        onClose();
        return;
      }

      const name = templateName.trim();
      if (!name) {
        setError("Template name is required");
        return;
      }

      const normalizedItems: Array<{
        exerciseId: string;
        order: number;
        sets: number | null;
        reps: number | null;
        restSeconds: number | null;
        notes: string;
      }> = editableItems
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, idx) => {
          const sets = parseNullableNumber(item.sets);
          const reps = parseNullableNumber(item.reps);
          const restSeconds = parseNullableNumber(item.restSeconds);
          return {
            exerciseId: item.exerciseId,
            order: idx + 1,
            sets,
            reps,
            restSeconds,
            notes: item.notes.trim(),
          };
        });

      const invalid = normalizedItems.some(
        (i) => i.sets === null || i.reps === null || i.restSeconds === null,
      );
      if (invalid) {
        setError("Sets, reps, and rest seconds must be valid numbers (>= 0)");
        return;
      }

      const clonedTemplate = await createTemplate({
        name: `${name} (Copy)`,
        description: templateDescription.trim(),
        templateType: "TRAINER",
        parentTemplateId: templateId,
      });

      await Promise.all(
        normalizedItems.map((item) =>
          createTemplateItem(clonedTemplate.id, {
            exerciseId: item.exerciseId,
            order: item.order,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            notes: item.notes,
          }),
        ),
      );

      await createWorkoutForBookingFromTemplate(booking.id, {
        templateId: clonedTemplate.id,
      });

      toast.success("Workout created from customized template");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create workout from template");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCustomizing = () => {
    if (!selectedTemplate) return;
    setIsCustomizing((prev) => !prev);
    setError(null);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<EditableTemplateItem>) => {
    setEditableItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditableItems((prev) =>
      prev
        .filter((i) => i.id !== itemId)
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    );
  };

  const handleSelectExerciseToAdd = (exercise: Exercise) => {
    setAddingItemForm((prev) => ({ ...prev, exerciseId: exercise.id }));
    setIsExercisePickerOpen(false);
  };

  const handleAddItem = () => {
    const exerciseId = addingItemForm.exerciseId.trim();
    if (!exerciseId) return;
    if (parseNullableNumber(addingItemForm.sets) === null) return;
    if (parseNullableNumber(addingItemForm.reps) === null) return;
    if (parseNullableNumber(addingItemForm.restSeconds) === null) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setEditableItems((prev) => [
      ...prev,
      {
        id,
        exerciseId,
        order: prev.length + 1,
        sets: addingItemForm.sets,
        reps: addingItemForm.reps,
        restSeconds: addingItemForm.restSeconds,
        notes: addingItemForm.notes,
      },
    ]);
    setAddingItemForm({
      exerciseId: "",
      sets: "",
      reps: "",
      restSeconds: "",
      notes: "",
    });
  };

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        Create workout from template
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        This will snapshot template items into the workout.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="template-id"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Template *
          </label>
          <select
            id="template-id"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className={selectClass}
            required
            aria-label="Select template"
          >
            <option value="">Select template</option>
            {templateOptions.map((o) => (
              <option
                key={o.value}
                value={o.value}
                className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                {selectedTemplate.name}
              </p>
              {selectedTemplate.description ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              ) : null}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Type: {selectedTemplate.templateType} • Items: {selectedTemplate.items.length}
              </p>
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              {selectedTemplate.items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No items.</p>
              ) : (
                <ul className="space-y-2" role="list" aria-label="Template items preview">
                  {selectedTemplate.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                      >
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {item.order}. {exerciseNameById.get(item.exerciseId) ?? item.exerciseId}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {[
                            item.sets !== null ? `${item.sets} sets` : null,
                            item.reps !== null ? `${item.reps} reps` : null,
                            item.restSeconds !== null ? `${item.restSeconds}s rest` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </p>
                        {item.notes ? (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.notes}
                          </p>
                        ) : null}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleCustomizing}
                aria-label="Toggle customize selected template"
              >
                {isCustomizing ? "Stop customizing" : "Customize (clone on save)"}
              </Button>
            </div>
          </div>
        ) : null}

        {isCustomizing && selectedTemplate ? (
          <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Template name
                </span>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Template name"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </span>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="mt-1 min-h-20 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  aria-label="Template description"
                />
              </label>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Customize items (snapshot fields)
              </p>
              <div className="mt-3 space-y-2">
                {editableItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No items.</p>
                ) : (
                  <ul className="space-y-2" role="list" aria-label="Editable template items list">
                    {editableItems
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                {item.order}. {exerciseNameById.get(item.exerciseId) ?? item.exerciseId}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              aria-label="Remove item"
                              className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <label>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Sets
                              </span>
                              <input
                                value={item.sets}
                                onChange={(e) => handleUpdateItem(item.id, { sets: e.target.value })}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                aria-label="Sets"
                              />
                            </label>
                            <label>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Reps
                              </span>
                              <input
                                value={item.reps}
                                onChange={(e) => handleUpdateItem(item.id, { reps: e.target.value })}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                aria-label="Reps"
                              />
                            </label>
                            <label>
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Rest (seconds)
                              </span>
                              <input
                                value={item.restSeconds}
                                onChange={(e) => handleUpdateItem(item.id, { restSeconds: e.target.value })}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                aria-label="Rest seconds"
                              />
                            </label>
                            <label className="sm:col-span-3">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Notes
                              </span>
                              <input
                                value={item.notes}
                                onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                aria-label="Notes"
                              />
                            </label>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Add item
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="sm:col-span-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Exercise
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                        {addingItemForm.exerciseId ? (
                          <span className="font-medium">
                            {exerciseNameById.get(addingItemForm.exerciseId) ?? addingItemForm.exerciseId}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">No exercise selected</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExercisePickerOpen(true)}
                        aria-label="Choose exercise for new item"
                      >
                        Choose
                      </Button>
                    </div>
                  </label>
                  <label>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Sets
                    </span>
                    <input
                      value={addingItemForm.sets}
                      onChange={(e) => setAddingItemForm((prev) => ({ ...prev, sets: e.target.value }))}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      aria-label="New item sets"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Reps
                    </span>
                    <input
                      value={addingItemForm.reps}
                      onChange={(e) => setAddingItemForm((prev) => ({ ...prev, reps: e.target.value }))}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      aria-label="New item reps"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Rest (seconds)
                    </span>
                    <input
                      value={addingItemForm.restSeconds}
                      onChange={(e) => setAddingItemForm((prev) => ({ ...prev, restSeconds: e.target.value }))}
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      aria-label="New item rest seconds"
                    />
                  </label>
                  <label className="sm:col-span-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Notes
                    </span>
                    <input
                      value={addingItemForm.notes}
                      onChange={(e) => setAddingItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      aria-label="New item notes"
                    />
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={
                      !addingItemForm.exerciseId.trim() ||
                      parseNullableNumber(addingItemForm.sets) === null ||
                      parseNullableNumber(addingItemForm.reps) === null ||
                      parseNullableNumber(addingItemForm.restSeconds) === null
                    }
                    aria-label="Add new item"
                  >
                    Add item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-error-600 dark:text-error-500" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!booking?.id || !templateId || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        selectedExerciseId={addingItemForm.exerciseId || null}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelect={handleSelectExerciseToAdd}
      />
    </Modal>
  );
}

