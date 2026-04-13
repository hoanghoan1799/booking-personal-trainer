"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

type PendingImportRow = {
  id: string;
  sourceFileName: string;
  template: ExerciseTemplate;
};

type ImportErrorRow = {
  id: string;
  sourceFileName: string;
  message: string;
};

type PendingTemplateFormState = {
  name: string;
  description: string;
  templateType: TemplateType;
};

type PendingItemFormState = {
  exerciseId: string;
  notes: string;
  sets: string;
  reps: string;
  restSeconds: string;
};

const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function formatEpochMs(epochMs: number): string {
  const d = new Date(epochMs);
  if (Number.isNaN(d.getTime())) return String(epochMs);
  return d.toLocaleString();
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isTemplateType(value: unknown): value is TemplateType {
  return value === "SYSTEM" || value === "TRAINER" || value === "PUBLIC";
}

function parseNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1];
        if (next === '"') {
          currentValue += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      currentValue += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }
    if (char === "\n") {
      currentRow.push(currentValue);
      currentValue = "";
      const isBlankRow = currentRow.every((cell) => cell.trim().length === 0);
      if (!isBlankRow) rows.push(currentRow.map((c) => c.trim()));
      currentRow = [];
      continue;
    }
    if (char === "\r") continue;
    currentValue += char;
  }
  currentRow.push(currentValue);
  const isBlankRow = currentRow.every((cell) => cell.trim().length === 0);
  if (!isBlankRow) rows.push(currentRow.map((c) => c.trim()));
  return rows;
}

function toImportedTemplateFromCsvRow(params: {
  headerIndex: Record<string, number>;
  row: string[];
  createdBy: string;
}): ExerciseTemplate | null {
  const nowIso = new Date().toISOString();
  const nameIndex = params.headerIndex.name;
  const rawName = typeof nameIndex === "number" ? params.row[nameIndex] : "";
  if (!rawName || !rawName.trim()) return null;
  const descriptionIndex = params.headerIndex.description;
  const rawDescription = typeof descriptionIndex === "number" ? params.row[descriptionIndex] : "";
  const templateTypeIndex = params.headerIndex.templatetype ?? params.headerIndex.template_type;
  const rawTemplateType = typeof templateTypeIndex === "number" ? params.row[templateTypeIndex] : "";
  const normalizedType = rawTemplateType.trim().toUpperCase();
  const templateType: TemplateType = isTemplateType(normalizedType) ? normalizedType : "TRAINER";
  const parentTemplateIdIndex =
    params.headerIndex.parenttemplateid ?? params.headerIndex.parent_template_id;
  const rawParentTemplateId =
    typeof parentTemplateIdIndex === "number" ? params.row[parentTemplateIdIndex] : "";
  const exerciseIdIndex = params.headerIndex.exerciseid ?? params.headerIndex.exercise_id;
  const rawExerciseId = typeof exerciseIdIndex === "number" ? params.row[exerciseIdIndex] : "";
  const notesIndex = params.headerIndex.itemnotes ?? params.headerIndex.item_notes ?? params.headerIndex.notes;
  const rawNotes = typeof notesIndex === "number" ? params.row[notesIndex] : "";
  const setsIndex = params.headerIndex.sets;
  const rawSets = typeof setsIndex === "number" ? params.row[setsIndex] : "";
  const repsIndex = params.headerIndex.reps;
  const rawReps = typeof repsIndex === "number" ? params.row[repsIndex] : "";
  const restSecondsIndex = params.headerIndex.restseconds ?? params.headerIndex.rest_seconds;
  const rawRestSeconds = typeof restSecondsIndex === "number" ? params.row[restSecondsIndex] : "";
  const orderIndex = params.headerIndex.order;
  const rawOrder = typeof orderIndex === "number" ? params.row[orderIndex] : "";
  const hasAnyItemData =
    Boolean(rawExerciseId.trim()) ||
    Boolean(rawNotes.trim()) ||
    Boolean(rawSets.trim()) ||
    Boolean(rawReps.trim()) ||
    Boolean(rawRestSeconds.trim()) ||
    Boolean(rawOrder.trim());
  const templateId = createClientId();
  const parsedOrder = parseNullableNumber(rawOrder);
  const itemOrder = parsedOrder !== null ? Math.max(1, Math.floor(parsedOrder)) : 1;
  const items: ExerciseTemplateItem[] = hasAnyItemData
    ? [
        {
          id: createClientId(),
          templateId,
          exerciseId: rawExerciseId.trim() || "exercise-id",
          notes: rawNotes.trim(),
          sets: parseNullableNumber(rawSets),
          reps: parseNullableNumber(rawReps),
          restSeconds: parseNullableNumber(rawRestSeconds),
          order: itemOrder,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        },
      ]
    : [];
  return {
    id: templateId,
    name: rawName.trim(),
    description: rawDescription.trim(),
    createdBy: params.createdBy,
    templateType,
    parentTemplateId: rawParentTemplateId.trim() || null,
    isDeleted: false,
    deletedAtIso: null,
    items,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export default function TemplatesUploadContent() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { executeImportTemplates } = useTemplates();
  const [pendingImports, setPendingImports] = useState<PendingImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<ImportErrorRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ExerciseTemplate | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editTemplateForm, setEditTemplateForm] = useState<PendingTemplateFormState>({
    name: "",
    description: "",
    templateType: "TRAINER",
  });
  const [newItemForm, setNewItemForm] = useState<PendingItemFormState>({
    exerciseId: "",
    notes: "",
    sets: "",
    reps: "",
    restSeconds: "",
  });
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const { user: currentUser } = useProfile();
  const currentUserId = currentUser?.id ?? "local-user";
  const { exercises } = useExercises();
  const exerciseNameById = useMemo(() => {
    return new Map(exercises.map((e) => [e.id, e.name]));
  }, [exercises]);

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleImportFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsParsing(true);
    const nextImports: PendingImportRow[] = [];
    const nextErrors: ImportErrorRow[] = [];
    await Promise.all(
      files.map(async (file) => {
        const sourceFileName = file.name;
        if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
          nextErrors.push({
            id: createClientId(),
            sourceFileName,
            message: `File is too large (${formatBytes(file.size)}). Max allowed is ${formatBytes(
              MAX_CSV_FILE_SIZE_BYTES
            )}.`,
          });
          return;
        }
        try {
          const text = await file.text();
          const rows = parseCsv(text);
          if (rows.length === 0) {
            nextErrors.push({
              id: createClientId(),
              sourceFileName,
              message: "CSV is empty.",
            });
            return;
          }
          const header = rows[0].map((h) => h.trim().toLowerCase());
          const headerIndex: Record<string, number> = {};
          header.forEach((h, idx) => {
            headerIndex[h] = idx;
          });
          if (typeof headerIndex.name !== "number") {
            nextErrors.push({
              id: createClientId(),
              sourceFileName,
              message: 'Missing required "name" column in CSV header.',
            });
            return;
          }
          const dataRows = rows.slice(1);
          const importedByName = new Map<string, ExerciseTemplate>();
          dataRows.forEach((row) => {
            const t = toImportedTemplateFromCsvRow({ headerIndex, row, createdBy: currentUserId });
            if (!t) return;
            const key = t.name.trim().toLowerCase();
            const existing = importedByName.get(key);
            if (!existing) {
              importedByName.set(key, t);
              return;
            }
            const mergedItems = [...existing.items, ...t.items].map((item, idx) => ({
              ...item,
              order: idx + 1,
            }));
            importedByName.set(key, { ...existing, items: mergedItems });
          });
          const imported = Array.from(importedByName.values());
          if (imported.length === 0) {
            nextErrors.push({
              id: createClientId(),
              sourceFileName,
              message: 'No valid rows found. Ensure at least one row has a non-empty "name".',
            });
            return;
          }
          imported.forEach((template) => {
            nextImports.push({ id: template.id, sourceFileName, template });
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to parse CSV file.";
          nextErrors.push({ id: createClientId(), sourceFileName, message });
        }
      })
    );
    setPendingImports((prev) => [...nextImports, ...prev]);
    setImportErrors((prev) => [...nextErrors, ...prev]);
    setIsParsing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await handleImportFiles(Array.from(files));
  };

  const handleRemovePendingImport = (rowId: string) => {
    setPendingImports((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleRemoveImportError = (rowId: string) => {
    setImportErrors((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleSave = () => {
    if (pendingImports.length === 0) return;
    executeImportTemplates({ templates: pendingImports.map((p) => p.template) });
    setPendingImports([]);
    setImportErrors([]);
    router.push(APP_ROUTES.TEMPLATES);
  };

  const handleCancel = () => {
    setPendingImports([]);
    setImportErrors([]);
    router.push(APP_ROUTES.TEMPLATES);
  };

  const handleOpenPreview = (template: ExerciseTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  };

  const handleOpenEdit = (rowId: string) => {
    const row = pendingImports.find((r) => r.id === rowId);
    if (!row) return;
    setEditingRowId(rowId);
    setEditTemplateForm({
      name: row.template.name,
      description: row.template.description,
      templateType: row.template.templateType,
    });
    setNewItemForm({ exerciseId: "", notes: "", sets: "", reps: "", restSeconds: "" });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingRowId(null);
  };

  const handleSaveEdit = () => {
    if (!editingRowId) return;
    const name = editTemplateForm.name.trim();
    if (!name) return;
    setPendingImports((prev) =>
      prev.map((r) => {
        if (r.id !== editingRowId) return r;
        return {
          ...r,
          template: {
            ...r.template,
            name,
            description: editTemplateForm.description.trim(),
            createdBy: r.template.createdBy,
            templateType: editTemplateForm.templateType,
            parentTemplateId: null,
            updatedAtIso: new Date().toISOString(),
          },
        };
      })
    );
    setIsEditOpen(false);
    setEditingRowId(null);
  };

  const handleAddItemToPending = () => {
    if (!editingRowId) return;
    const exerciseId = newItemForm.exerciseId.trim();
    if (!exerciseId) return;
    const sets = parseNullableNumber(newItemForm.sets);
    const reps = parseNullableNumber(newItemForm.reps);
    const restSeconds = parseNullableNumber(newItemForm.restSeconds);
    if (sets === null || reps === null || restSeconds === null) return;
    const nowIso = new Date().toISOString();
    const item: ExerciseTemplateItem = {
      id: createClientId(),
      templateId: editingRowId,
      exerciseId,
      notes: newItemForm.notes.trim(),
      sets,
      reps,
      restSeconds,
      order: 1,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
    setPendingImports((prev) =>
      prev.map((r) => {
        if (r.id !== editingRowId) return r;
        const nextItems = [...r.template.items, item].map((it, idx) => ({ ...it, order: idx + 1 }));
        return {
          ...r,
          template: { ...r.template, items: nextItems, updatedAtIso: nowIso },
        };
      })
    );
    setNewItemForm({ exerciseId: "", notes: "", sets: "", reps: "", restSeconds: "" });
  };

  const handleRemoveItemFromPending = (itemId: string) => {
    if (!editingRowId) return;
    const nowIso = new Date().toISOString();
    setPendingImports((prev) =>
      prev.map((r) => {
        if (r.id !== editingRowId) return r;
        const nextItems = r.template.items
          .filter((i) => i.id !== itemId)
          .map((it, idx) => ({ ...it, order: idx + 1 }));
        return { ...r, template: { ...r.template, items: nextItems, updatedAtIso: nowIso } };
      })
    );
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setNewItemForm((prev) => ({ ...prev, exerciseId: exercise.id }));
    setIsExercisePickerOpen(false);
  };

  const isSaveDisabled = pendingImports.length === 0 || isParsing;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Import templates</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a CSV file containing your templates and template items.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
            accept="text/csv,.csv"
            aria-label="Select CSV files to import templates"
          />
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel import"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled} aria-label="Save imported templates">
            Save
          </Button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV templates (drag and drop or click)"
        onClick={handlePickFiles}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          handlePickFiles();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
            const lowerName = f.name.toLowerCase();
            return lowerName.endsWith(".csv") || f.type === "text/csv";
          });
          await handleImportFiles(droppedFiles);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center outline-none transition
          ${isDragging ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"}
          focus:ring-2 focus:ring-brand-500 dark:bg-white/[0.03]
        `}
      >
        <div className="mx-auto max-w-xl space-y-2">
          <p className="text-base font-semibold text-gray-800 dark:text-white/90">
            Drag & drop CSV files here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Or{" "}
            <span className="font-medium text-brand-600 underline-offset-2 group-hover:underline dark:text-brand-400">
              click to browse
            </span>{" "}
            to import templates.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Supported: .csv (templates + items)
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">How it works</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This page reads CSV and creates brand-new templates in your browser storage. Required column: <span className="font-medium">name</span>.
            Optional template columns: <span className="font-medium">description</span>, <span className="font-medium">templateType</span> (SYSTEM/TRAINER/PUBLIC).
            Optional item columns: <span className="font-medium">exerciseId</span>, <span className="font-medium">notes</span>, <span className="font-medium">sets</span>, <span className="font-medium">reps</span>, <span className="font-medium">restSeconds</span>, <span className="font-medium">order</span>.
          </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Max file size: <span className="font-medium">{formatBytes(MAX_CSV_FILE_SIZE_BYTES)}</span>.
            </p>
        </div>
      </div>

      {importErrors.length > 0 ? (
        <div className="rounded-xl border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-error-700 dark:text-error-200">Some files could not be imported</p>
              <p className="mt-1 text-sm text-error-700/80 dark:text-error-200/80">
                Fix the CSV structure and try again.
              </p>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {importErrors.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-error-800 dark:text-error-200">
                    {e.sourceFileName}
                  </p>
                  <p className="text-sm text-error-700/80 dark:text-error-200/80">{e.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveImportError(e.id)}
                  aria-label={`Dismiss error for ${e.sourceFileName}`}
                  className="ring-error-500/30 text-error-700 hover:bg-error-50 dark:hover:bg-error-500/10"
                >
                  Dismiss
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-gray-50 dark:bg-gray-900/40">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Template
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
                  Source file
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
              {pendingImports.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
                    No templates queued for import yet. Drop a CSV file above or click the dropzone to pick one.
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
                pendingImports.map((row) => (
                  <TableRow
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Preview imported template ${row.template.name}`}
                    onClick={() => handleOpenPreview(row.template)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      handleOpenPreview(row.template);
                    }}
                    className="border-t border-gray-100 outline-none hover:bg-gray-50 focus:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.03]"
                  >
                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {row.template.name}
                        </p>
                        {row.template.description ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {row.template.description}
                          </p>
                        ) : null}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Items: {row.template.items.length}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{row.template.templateType}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{row.sourceFileName}</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Imported at: {formatEpochMs(new Date(row.template.createdAtIso).getTime())}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(row.id);
                          }}
                          aria-label={`Edit imported template ${row.template.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePendingImport(row.id);
                          }}
                          aria-label={`Remove ${row.template.name} from pending imports`}
                          className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isPreviewOpen} onClose={handleClosePreview} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Template preview
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Preview before saving to your templates list.
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
                    <ul className="space-y-2" role="list" aria-label="Imported template items list">
                      {previewTemplate.items
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((item: ExerciseTemplateItem) => (
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
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={handleCloseEdit} className="max-w-2xl p-6">
        <div className="space-y-5">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Edit imported template
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the queued template before saving.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
              <input
                value={editTemplateForm.name}
                onChange={(e) => setEditTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                aria-label="Imported template name"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
              <textarea
                value={editTemplateForm.description}
                onChange={(e) =>
                  setEditTemplateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                aria-label="Imported template description"
                className="mt-1 min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Template type
              </span>
              <select
                value={editTemplateForm.templateType}
                onChange={(e) =>
                  setEditTemplateForm((prev) => ({
                    ...prev,
                    templateType: e.target.value as TemplateType,
                  }))
                }
                aria-label="Imported template type"
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
                Add or remove items before saving.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercise id</span>
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
                  aria-label="Imported item notes"
                  placeholder="Some note"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sets</span>
                <input
                  value={newItemForm.sets}
                  onChange={(e) => setNewItemForm((prev) => ({ ...prev, sets: e.target.value }))}
                  aria-label="Imported item sets"
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
                  aria-label="Imported item reps"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-brand-500 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rest seconds</span>
                <input
                  value={newItemForm.restSeconds}
                  onChange={(e) =>
                    setNewItemForm((prev) => ({ ...prev, restSeconds: e.target.value }))
                  }
                  aria-label="Imported item rest seconds"
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
                onClick={handleAddItemToPending}
                disabled={
                  !editingRowId ||
                  !newItemForm.exerciseId.trim() ||
                  parseNullableNumber(newItemForm.sets) === null ||
                  parseNullableNumber(newItemForm.reps) === null ||
                  parseNullableNumber(newItemForm.restSeconds) === null
                }
                aria-label="Add item to imported template"
              >
                Add item
              </Button>
            </div>
            <div className="mt-4 max-h-64 overflow-auto rounded-lg pr-1">
              {editingRowId ? (
                pendingImports.find((r) => r.id === editingRowId)?.template.items?.length ? (
                  <ul className="space-y-2" role="list" aria-label="Imported template items list editable">
                    {pendingImports
                      .find((r) => r.id === editingRowId)
                      ?.template.items.slice()
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItemFromPending(item.id)}
                            aria-label={`Remove imported item ${item.exerciseId}`}
                            className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No items yet.</p>
                )
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No template selected.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCloseEdit} aria-label="Cancel edit imported template">
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editTemplateForm.name.trim()}
              aria-label="Save changes to imported template"
            >
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        selectedExerciseId={newItemForm.exerciseId || null}
        onClose={() => setIsExercisePickerOpen(false)}
        onSelect={handleSelectExercise}
      />
    </div>
  );
}

