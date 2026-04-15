"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { APP_ROUTES } from "@/lib/route.constants";
import { useTemplates } from "@/hooks/useTemplates";
import { useExercises } from "@/hooks/useExercises";
import { useProfile } from "@/hooks/useProfile";
import type { ExerciseTemplate, ExerciseTemplateItem, TemplateType } from "@/types/template.types";
import ExercisePickerModal from "@/components/templates/ExercisePickerModal";
import type { Exercise } from "@/services/exercises/exercises.service";

type TemplateFormState = {
  name: string;
  description: string;
  templateType: TemplateType;
};

type TemplateItemFormState = {
  exerciseId: string;
  notes: string;
  sets: string;
  reps: string;
  restSeconds: string;
};

type ExercisePickerTarget = "create" | "edit";

const DEFAULT_FORM_STATE: TemplateFormState = {
  name: "",
  description: "",
  templateType: "TRAINER",
};

const DEFAULT_ITEM_FORM_STATE: TemplateItemFormState = {
  exerciseId: "",
  notes: "",
  sets: "",
  reps: "",
  restSeconds: "",
};

function parseNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatIsoToReadableDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function getTemplateTypeBadgeClassName(templateType: TemplateType): string {
  if (templateType === "SYSTEM") {
    return "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300";
  }
  if (templateType === "PUBLIC") {
    return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export default function TemplatesContent() {
  const {
    templates,
    isLoading,
    executeCreateTemplate,
    executeUpdateTemplate,
    executeDeleteTemplate,
    executeForkTemplate,
    executeAddTemplateItem,
    executeRemoveTemplateItem,
    executeUpdateTemplateItem,
  } = useTemplates();

  const [query, setQuery] = useState("");
  const [templateTypeFilter, setTemplateTypeFilter] = useState<"ALL" | TemplateType>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ExerciseTemplate | null>(null);
  const [createForm, setCreateForm] = useState<TemplateFormState>(DEFAULT_FORM_STATE);
  const [editForm, setEditForm] = useState<TemplateFormState>(DEFAULT_FORM_STATE);
  const [newItemForm, setNewItemForm] = useState<TemplateItemFormState>(DEFAULT_ITEM_FORM_STATE);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [exercisePickerTarget, setExercisePickerTarget] = useState<ExercisePickerTarget>("edit");
  const [createItems, setCreateItems] = useState<ExerciseTemplateItem[]>([]);
  const [createItemForm, setCreateItemForm] = useState<TemplateItemFormState>(DEFAULT_ITEM_FORM_STATE);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const { user: currentUser } = useProfile();
  const currentUserId = currentUser?.id ?? "local-user";
  const canEditTemplate = (t: ExerciseTemplate): boolean => {
    if (t.templateType !== "TRAINER") return false;
    return t.createdBy === currentUserId;
  };
  const canForkTemplate = (t: ExerciseTemplate): boolean => {
    return t.templateType === "SYSTEM" || t.templateType === "PUBLIC";
  };

  const { exercises } = useExercises();
  const exerciseNameById = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e.name]));
  }, [exercises]);

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        t.name.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery) ||
        t.templateType.toLowerCase().includes(normalizedQuery);
      const matchesType = templateTypeFilter === "ALL" ? true : t.templateType === templateTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [query, templateTypeFilter, templates]);

  const handleOpenCreate = () => {
    setCreateForm(DEFAULT_FORM_STATE);
    setCreateItems([]);
    setCreateItemForm(DEFAULT_ITEM_FORM_STATE);
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleSubmitCreate = async () => {
    const name = createForm.name.trim();
    if (!name) return;
    const created = await executeCreateTemplate({
      name,
      description: createForm.description,
      templateType: createForm.templateType,
      parentTemplateId: null,
    });
    if (createItems.length > 0) {
      await Promise.all(
        createItems.map((item) =>
          executeAddTemplateItem({
          templateId: created.id,
          item: {
            ...item,
            templateId: created.id,
          },
          }),
        ),
      );
    }
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (template: ExerciseTemplate) => {
    if (!canEditTemplate(template)) return;
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description,
      templateType: template.templateType,
    });
    setNewItemForm(DEFAULT_ITEM_FORM_STATE);
    setEditingItemId(null);
    setIsEditOpen(true);
  };

  const handleOpenPreview = (template: ExerciseTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedTemplate(null);
    setEditingItemId(null);
  };

  const handleSubmitEdit = async () => {
    if (!selectedTemplate) return;
    const name = editForm.name.trim();
    if (!name) return;
    await executeUpdateTemplate({
      templateId: selectedTemplate.id,
      name,
      description: editForm.description,
      templateType: editForm.templateType,
      parentTemplateId: null,
    });
    setIsEditOpen(false);
    setSelectedTemplate(null);
  };

  const handleAddItem = async () => {
    if (!selectedTemplate) return;
    const exerciseId = newItemForm.exerciseId.trim();
    if (!exerciseId) return;
    const sets = parseNullableNumber(newItemForm.sets);
    const reps = parseNullableNumber(newItemForm.reps);
    const restSeconds = parseNullableNumber(newItemForm.restSeconds);
    if (sets === null || reps === null || restSeconds === null) return;
    const nowIso = new Date().toISOString();
    const existingCount = selectedTemplate.items.length;
    const item: ExerciseTemplateItem = {
      id: createClientId(),
      templateId: selectedTemplate.id,
      exerciseId,
      notes: newItemForm.notes.trim(),
      sets,
      reps,
      restSeconds,
      order: existingCount + 1,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    await executeAddTemplateItem({ templateId: selectedTemplate.id, item });
    setSelectedTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [...prev.items, item] };
    });
    setNewItemForm(DEFAULT_ITEM_FORM_STATE);
  };

  const handleStartEditItem = (item: ExerciseTemplateItem) => {
    setEditingItemId(item.id);
    setNewItemForm({
      exerciseId: item.exerciseId,
      notes: item.notes,
      sets: item.sets !== null ? String(item.sets) : "",
      reps: item.reps !== null ? String(item.reps) : "",
      restSeconds: item.restSeconds !== null ? String(item.restSeconds) : "",
    });
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setNewItemForm(DEFAULT_ITEM_FORM_STATE);
  };

  const handleSaveEditItem = async () => {
    if (!selectedTemplate) return;
    if (!editingItemId) return;
    const exerciseId = newItemForm.exerciseId.trim();
    if (!exerciseId) return;
    const sets = parseNullableNumber(newItemForm.sets);
    const reps = parseNullableNumber(newItemForm.reps);
    const restSeconds = parseNullableNumber(newItemForm.restSeconds);
    if (sets === null || reps === null || restSeconds === null) return;
    await executeUpdateTemplateItem({
      templateId: selectedTemplate.id,
      itemId: editingItemId,
      exerciseId,
      notes: newItemForm.notes.trim(),
      sets,
      reps,
      restSeconds,
    });
    setSelectedTemplate((prev) => {
      if (!prev) return prev;
      const nextItems = prev.items.map((i) => {
        if (i.id !== editingItemId) return i;
        return {
          ...i,
          exerciseId,
          notes: newItemForm.notes.trim(),
          sets,
          reps,
          restSeconds,
          updatedAtIso: new Date().toISOString(),
        };
      });
      return { ...prev, items: nextItems };
    });
    setEditingItemId(null);
    setNewItemForm(DEFAULT_ITEM_FORM_STATE);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (exercisePickerTarget === "create") {
      setCreateItemForm((prev) => ({ ...prev, exerciseId: exercise.id }));
      setIsExercisePickerOpen(false);
      return;
    }
    setNewItemForm((prev) => ({ ...prev, exerciseId: exercise.id }));
    setIsExercisePickerOpen(false);
  };

  const handleAddCreateItem = () => {
    const exerciseId = createItemForm.exerciseId.trim();
    if (!exerciseId) return;
    const sets = parseNullableNumber(createItemForm.sets);
    const reps = parseNullableNumber(createItemForm.reps);
    const restSeconds = parseNullableNumber(createItemForm.restSeconds);
    if (sets === null || reps === null || restSeconds === null) return;
    const nowIso = new Date().toISOString();
    const item: ExerciseTemplateItem = {
      id: createClientId(),
      templateId: "pending",
      exerciseId,
      notes: createItemForm.notes.trim(),
      sets,
      reps,
      restSeconds,
      order: createItems.length + 1,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    setCreateItems((prev) => [...prev, item].map((it, idx) => ({ ...it, order: idx + 1 })));
    setCreateItemForm(DEFAULT_ITEM_FORM_STATE);
  };

  const handleRemoveCreateItem = (itemId: string) => {
    setCreateItems((prev) =>
      prev
        .filter((i) => i.id !== itemId)
        .map((it, idx) => ({ ...it, order: idx + 1 }))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedTemplate) return;
    void executeRemoveTemplateItem({ templateId: selectedTemplate.id, itemId });
    setSelectedTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((i) => i.id !== itemId) };
    });
  };

  const handleOpenDelete = (template: ExerciseTemplate) => {
    if (!canEditTemplate(template)) return;
    setSelectedTemplate(template);
    setIsDeleteOpen(true);
  };

  const handleForkTemplate = async (template: ExerciseTemplate) => {
    if (!canForkTemplate(template)) return;
    const forked = await executeForkTemplate(template.id);
    handleOpenEdit(forked);
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setSelectedTemplate(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    await executeDeleteTemplate({ templateId: selectedTemplate.id });
    setIsDeleteOpen(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="w-full sm:max-w-sm">
            <span className="sr-only">Search templates</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, description, tag..."
              aria-label="Search templates"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </label>
          <label className="w-full sm:w-auto">
            <span className="sr-only">Filter by template type</span>
            <select
              value={templateTypeFilter}
              onChange={(e) => setTemplateTypeFilter(e.target.value as "ALL" | TemplateType)}
              aria-label="Filter templates by template type"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="ALL">All types</option>
              <option value="SYSTEM">System</option>
              <option value="TRAINER">Trainer</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={APP_ROUTES.TEMPLATES_UPLOAD}
            className="inline-flex"
            aria-label="Go to template upload page"
          >
            <Button variant="outline">Upload</Button>
          </Link>
          <Button onClick={handleOpenCreate} aria-label="Create a new template">
            Create Template
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-gray-50 dark:bg-gray-900/40">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Updated
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                    No templates match your filters.
                  </TableCell>
                  <TableCell className="px-4 py-6">
                    <span className="sr-only">Empty</span>
                  </TableCell>
                  <TableCell className="px-4 py-6">
                    <span className="sr-only">Empty</span>
                  </TableCell>
                  <TableCell className="px-4 py-6">
                    <span className="sr-only">Empty</span>
                  </TableCell>
                  <TableCell className="px-4 py-6">
                    <span className="sr-only">Empty</span>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((t) => (
                  <TableRow
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview template ${t.name}`}
                    onClick={() => handleOpenPreview(t)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      handleOpenPreview(t);
                    }}
                    className="border-t border-gray-100 outline-none hover:bg-gray-50 focus:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.03]"
                  >
                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {t.name}
                        </p>
                        {t.description ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t.description}
                          </p>
                        ) : null}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Items: {t.items.length}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getTemplateTypeBadgeClassName(
                          t.templateType
                        )}`}
                      >
                        {t.templateType}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatIsoToReadableDate(t.updatedAtIso)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        {canForkTemplate(t) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleForkTemplate(t);
                            }}
                            aria-label={`Fork template ${t.name}`}
                          >
                            Fork
                          </Button>
                        ) : null}
                        {canEditTemplate(t) ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(t);
                              }}
                              aria-label={`Edit template ${t.name}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDelete(t);
                              }}
                              aria-label={`Delete template ${t.name}`}
                              className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Create Template
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a template and manage its items.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </span>
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Upper Body - Intermediate"
                aria-label="Template name"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </span>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="What’s this template for?"
                aria-label="Template description"
                className="mt-1 min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Template type
              </span>
              <select
                value={createForm.templateType}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    templateType: e.target.value as TemplateType,
                  }))
                }
                aria-label="Template type"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="TRAINER">Trainer</option>
                <option value="SYSTEM">System</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Template items</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add items while creating this template.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercise</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {createItemForm.exerciseId ? (
                      <span className="font-medium">
                        {exerciseNameById.get(createItemForm.exerciseId) ?? createItemForm.exerciseId}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No exercise selected</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setExercisePickerTarget("create");
                      setIsExercisePickerOpen(true);
                    }}
                    aria-label="Open exercise picker for create template"
                  >
                    Choose
                  </Button>
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
                <input
                  value={createItemForm.notes}
                  onChange={(e) => setCreateItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                  aria-label="Create template item notes"
                  placeholder="Some note"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sets</span>
                <input
                  value={createItemForm.sets}
                  onChange={(e) => setCreateItemForm((prev) => ({ ...prev, sets: e.target.value }))}
                  aria-label="Create template item sets"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reps</span>
                <input
                  value={createItemForm.reps}
                  onChange={(e) => setCreateItemForm((prev) => ({ ...prev, reps: e.target.value }))}
                  aria-label="Create template item reps"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seconds</span>
                <input
                  value={createItemForm.restSeconds}
                  onChange={(e) =>
                    setCreateItemForm((prev) => ({ ...prev, restSeconds: e.target.value }))
                  }
                  aria-label="Create template item rest seconds"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <Button
                size="sm"
                onClick={handleAddCreateItem}
                disabled={
                  !createItemForm.exerciseId.trim() ||
                  parseNullableNumber(createItemForm.sets) === null ||
                  parseNullableNumber(createItemForm.reps) === null ||
                  parseNullableNumber(createItemForm.restSeconds) === null
                }
                aria-label="Add item while creating template"
              >
                Add item
              </Button>
            </div>
            <div className="mt-4 max-h-64 overflow-auto rounded-lg pr-1">
              {createItems.length > 0 ? (
                <ul className="space-y-2" role="list" aria-label="Create template items list">
                  {createItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {item.order}. {exerciseNameById.get(item.exerciseId) ?? item.exerciseId}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {item.sets} sets • {item.reps} reps • {item.restSeconds}s rest
                        </p>
                        {item.notes ? (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.notes}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCreateItem(item.id)}
                        aria-label="Remove item from create template"
                        className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No items yet.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCloseCreate} aria-label="Cancel create">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={!createForm.name.trim()}
              aria-label="Create template"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Edit template
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the fields and save.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </span>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                aria-label="Template name"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </span>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                aria-label="Template description"
                className="mt-1 min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Template type
              </span>
              <select
                value={editForm.templateType}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    templateType: e.target.value as TemplateType,
                  }))
                }
                aria-label="Template type"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="TRAINER">Trainer</option>
                <option value="SYSTEM">System</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Template items</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add exercises/steps inside this template.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercise Name</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    {newItemForm.exerciseId ? (
                      <span className="font-medium">
                        {exerciseNameById.get(newItemForm.exerciseId) ?? newItemForm.exerciseId}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No exercise selected</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExercisePickerOpen(true)}
                    aria-label="Open exercise picker"
                  >
                    Choose
                  </Button>
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
                <input
                  value={newItemForm.notes}
                  onChange={(e) => setNewItemForm((prev) => ({ ...prev, notes: e.target.value }))}
                  aria-label="Template item notes"
                  placeholder="Some note"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sets</span>
                <input
                  value={newItemForm.sets}
                  onChange={(e) => setNewItemForm((prev) => ({ ...prev, sets: e.target.value }))}
                  aria-label="Template item sets"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reps</span>
                <input
                  value={newItemForm.reps}
                  onChange={(e) => setNewItemForm((prev) => ({ ...prev, reps: e.target.value }))}
                  aria-label="Template item reps"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rest Seconds</span>
                <input
                  value={newItemForm.restSeconds}
                  onChange={(e) =>
                    setNewItemForm((prev) => ({ ...prev, restSeconds: e.target.value }))
                  }
                  aria-label="Template item rest seconds"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-end">
              {editingItemId ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditItem}
                    aria-label="Cancel editing item"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEditItem}
                    disabled={
                      !selectedTemplate ||
                      !newItemForm.exerciseId.trim() ||
                      parseNullableNumber(newItemForm.sets) === null ||
                      parseNullableNumber(newItemForm.reps) === null ||
                      parseNullableNumber(newItemForm.restSeconds) === null
                    }
                    aria-label="Save edited item"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAddItem}
                  disabled={
                    !selectedTemplate ||
                    !newItemForm.exerciseId.trim() ||
                    parseNullableNumber(newItemForm.sets) === null ||
                    parseNullableNumber(newItemForm.reps) === null ||
                    parseNullableNumber(newItemForm.restSeconds) === null
                  }
                  aria-label="Add item to template"
                >
                  Add item
                </Button>
              )}
            </div>
            <div className="mt-4 max-h-64 overflow-auto rounded-lg pr-1">
              {selectedTemplate && selectedTemplate.items.length > 0 ? (
                <ul className="space-y-2" role="list" aria-label="Template items list">
                  {selectedTemplate.items
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="min-w-0">
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
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEditItem(item)}
                            aria-label={`Edit item ${item.exerciseId}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label={`Remove item ${item.exerciseId}`}
                            className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No items yet.</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCloseEdit} aria-label="Cancel edit">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEdit}
                disabled={!editForm.name.trim()}
                aria-label="Save template"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        selectedExerciseId={newItemForm.exerciseId || null}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelect={handleSelectExercise}
      />

      <Modal isOpen={isPreviewOpen} onClose={handleClosePreview} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Template preview
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View template details and items.
            </p>
          </div>
          {previewTemplate ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {previewTemplate.name}
                  </p>
                  {previewTemplate.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {previewTemplate.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Type: {previewTemplate.templateType} • Items: {previewTemplate.items.length}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Items</p>
                <div className="mt-3 max-h-80 overflow-auto rounded-lg pr-1">
                  {previewTemplate.items.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No items.</p>
                  ) : (
                    <ul className="space-y-2" role="list" aria-label="Preview template items list">
                      {previewTemplate.items
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
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No template selected.</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClosePreview} aria-label="Close preview">
              Close
            </Button>
            {previewTemplate ? (
              <div className="flex items-center gap-2">
                {canForkTemplate(previewTemplate) ? (
                  <Button
                    onClick={() => {
                      handleClosePreview();
                      void handleForkTemplate(previewTemplate);
                    }}
                    aria-label="Fork from preview"
                  >
                    Fork
                  </Button>
                ) : null}
                {canEditTemplate(previewTemplate) ? (
                  <Button
                    onClick={() => {
                      handleClosePreview();
                      handleOpenEdit(previewTemplate);
                    }}
                    aria-label="Edit from preview"
                  >
                    Edit
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} className="max-w-xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Delete template
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This will delete the template.
            </p>
          </div>
          <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {selectedTemplate ? (
              <span>
                You are deleting <span className="font-semibold">{selectedTemplate.name}</span>.
              </span>
            ) : (
              <span>No template selected.</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDelete} aria-label="Cancel delete">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              aria-label="Confirm delete"
              className="bg-error-600 hover:bg-error-700 disabled:bg-error-300"
              disabled={!selectedTemplate}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

