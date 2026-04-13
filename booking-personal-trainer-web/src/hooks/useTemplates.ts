"use client";

import { useCallback, useMemo, useState } from "react";
import type { ExerciseTemplate, ExerciseTemplateItem, TemplateType } from "@/types/template.types";

const STORAGE_KEY = "bpt.exerciseTemplates.v2";

type SaveTemplatesParams = {
  templates: ExerciseTemplate[];
};

type CreateTemplateParams = {
  name: string;
  description: string;
  createdBy: string;
  templateType: TemplateType;
  parentTemplateId: string | null;
};

type ImportTemplatesParams = {
  templates: ExerciseTemplate[];
};

type UpdateTemplateParams = {
  templateId: string;
  name: string;
  description: string;
  createdBy: string;
  templateType: TemplateType;
  parentTemplateId: string | null;
};

type DeleteTemplateParams = {
  templateId: string;
};

type AddTemplateItemParams = {
  templateId: string;
  item: ExerciseTemplateItem;
};

type RemoveTemplateItemParams = {
  templateId: string;
  itemId: string;
};

type UpdateTemplateItemParams = {
  templateId: string;
  itemId: string;
  exerciseId: string;
  notes: string;
  sets: number | null;
  reps: number | null;
  restSeconds: number | null;
};

function getNowIso(): string {
  return new Date().toISOString();
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getUniqueTemplateName(params: {
  existingTemplates: ExerciseTemplate[];
  requestedName: string;
}): string {
  const base = params.requestedName.trim() || "Untitled template";
  const existingNames = new Set(params.existingTemplates.map((t) => t.name.toLowerCase()));
  if (!existingNames.has(base.toLowerCase())) return base;
  const MAX_SUFFIX_ATTEMPTS = 200;
  for (let i = 2; i <= MAX_SUFFIX_ATTEMPTS; i += 1) {
    const candidate = `${base} (${i})`;
    if (!existingNames.has(candidate.toLowerCase())) return candidate;
  }
  return `${base} (${Date.now()})`;
}

function getDefaultTemplates(): ExerciseTemplate[] {
  const nowIso = getNowIso();
  const templateId = createId();
  return [
    {
      id: templateId,
      name: "Full Body - Beginner",
      description: "A simple full-body routine for beginners.",
      createdBy: "local-user",
      templateType: "SYSTEM",
      parentTemplateId: null,
      isDeleted: false,
      deletedAtIso: null,
      items: [
        {
          id: createId(),
          templateId,
          exerciseId: "exercise-bodyweight-squat",
          notes: "",
          sets: 3,
          reps: 12,
          restSeconds: 60,
          order: 1,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
        },
      ],
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    },
  ];
}

function sanitizeItems(
  rawItems: ExerciseTemplateItem[] | undefined,
  templateId: string
): ExerciseTemplateItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .filter((i) => i && typeof i === "object")
    .map((i) => {
      const nowIso = getNowIso();
      const item = i as ExerciseTemplateItem;
      const sets = typeof item.sets === "number" && Number.isFinite(item.sets) ? item.sets : null;
      const reps = typeof item.reps === "number" && Number.isFinite(item.reps) ? item.reps : null;
      const restSeconds =
        typeof item.restSeconds === "number" && Number.isFinite(item.restSeconds)
          ? item.restSeconds
          : null;
      const order = typeof item.order === "number" && Number.isFinite(item.order) ? item.order : 0;
      return {
        id: typeof item.id === "string" && item.id ? item.id : createId(),
        templateId: typeof item.templateId === "string" && item.templateId ? item.templateId : templateId,
        exerciseId: typeof item.exerciseId === "string" ? item.exerciseId : "",
        notes: typeof item.notes === "string" ? item.notes : "",
        sets,
        reps,
        restSeconds,
        order,
        createdAtIso:
          typeof item.createdAtIso === "string" && item.createdAtIso ? item.createdAtIso : nowIso,
        updatedAtIso:
          typeof item.updatedAtIso === "string" && item.updatedAtIso ? item.updatedAtIso : nowIso,
      };
    })
    .filter((i) => i.exerciseId.trim().length > 0)
    .sort((a, b) => a.order - b.order);
}

function readTemplatesFromStorage(): ExerciseTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ExerciseTemplate[]).map((t) => {
      const nowIso = getNowIso();
      const template = t as ExerciseTemplate;
      const templateId = typeof template.id === "string" && template.id ? template.id : createId();
      return {
        id: templateId,
        name: typeof template.name === "string" ? template.name : "",
        description: typeof template.description === "string" ? template.description : "",
        createdBy: typeof template.createdBy === "string" ? template.createdBy : "local-user",
        templateType:
          template.templateType === "SYSTEM" || template.templateType === "TRAINER" || template.templateType === "PUBLIC"
            ? template.templateType
            : "TRAINER",
        parentTemplateId:
          typeof template.parentTemplateId === "string" && template.parentTemplateId
            ? template.parentTemplateId
            : null,
        isDeleted: Boolean(template.isDeleted),
        deletedAtIso: typeof template.deletedAtIso === "string" ? template.deletedAtIso : null,
        createdAtIso:
          typeof template.createdAtIso === "string" && template.createdAtIso ? template.createdAtIso : nowIso,
        updatedAtIso:
          typeof template.updatedAtIso === "string" && template.updatedAtIso ? template.updatedAtIso : nowIso,
        items: sanitizeItems(template.items, templateId),
      };
    });
  } catch {
    return [];
  }
}

function writeTemplatesToStorage(params: SaveTemplatesParams): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params.templates));
  } catch {
    // ignore storage write errors (quota, private mode)
  }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>(() => {
    const stored = readTemplatesFromStorage();
    if (stored.length > 0) return stored;
    const defaults = getDefaultTemplates();
    writeTemplatesToStorage({ templates: defaults });
    return defaults;
  });
  const [isLoading, setIsLoading] = useState(false);

  const executeReload = useCallback((): void => {
    setIsLoading(true);
    const stored = readTemplatesFromStorage();
    if (stored.length > 0) {
      setTemplates(stored);
      setIsLoading(false);
      return;
    }
    const defaults = getDefaultTemplates();
    setTemplates(defaults);
    writeTemplatesToStorage({ templates: defaults });
    setIsLoading(false);
  }, []);

  const templatesById = useMemo(() => {
    return new Map(templates.map((t) => [t.id, t]));
  }, [templates]);

  const executeCreateTemplate = useCallback(
    (params: CreateTemplateParams): ExerciseTemplate => {
      const nowIso = getNowIso();
      const templateId = createId();
      const newTemplate: ExerciseTemplate = {
        id: createId(),
        name: getUniqueTemplateName({ existingTemplates: templates, requestedName: params.name }),
        description: params.description.trim(),
        createdBy: params.createdBy.trim() || "local-user",
        templateType: params.templateType,
        parentTemplateId: params.parentTemplateId,
        isDeleted: false,
        deletedAtIso: null,
        items: [],
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };
      const next = [newTemplate, ...templates];
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
      return newTemplate;
    },
    [templates]
  );

  const executeImportTemplates = useCallback(
    (params: ImportTemplatesParams): void => {
      if (params.templates.length === 0) return;
      const nowIso = getNowIso();
      const existingIds = new Set(templates.map((t) => t.id));
      const nextImports = params.templates.map((t) => {
        const hasIdConflict = existingIds.has(t.id);
        const id = hasIdConflict ? createId() : t.id;
        const name = getUniqueTemplateName({ existingTemplates: templates, requestedName: t.name });
        return {
          ...t,
          id,
          name,
          createdBy: t.createdBy?.trim() || "local-user",
          templateType: t.templateType,
          parentTemplateId: t.parentTemplateId ?? null,
          isDeleted: Boolean(t.isDeleted),
          deletedAtIso: t.deletedAtIso ?? null,
          items: sanitizeItems(t.items, id).map((item, idx) => ({
            ...item,
            templateId: id,
            order: idx + 1,
            updatedAtIso: nowIso,
          })),
          createdAtIso: t.createdAtIso || nowIso,
          updatedAtIso: nowIso,
        };
      });
      const next = [...nextImports, ...templates];
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  const executeUpdateTemplate = useCallback(
    (params: UpdateTemplateParams): void => {
      const nowIso = getNowIso();
      const next = templates.map((t) => {
        if (t.id !== params.templateId) return t;
        return {
          ...t,
          name: params.name.trim(),
          description: params.description.trim(),
          createdBy: params.createdBy.trim() || "local-user",
          templateType: params.templateType,
          parentTemplateId: params.parentTemplateId,
          updatedAtIso: nowIso,
        };
      });
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  const executeDeleteTemplate = useCallback(
    (params: DeleteTemplateParams): void => {
      const next = templates.filter((t) => t.id !== params.templateId);
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  const executeAddTemplateItem = useCallback(
    (params: AddTemplateItemParams): void => {
      const nowIso = getNowIso();
      const next = templates.map((t) => {
        if (t.id !== params.templateId) return t;
        const nextItems = [...t.items, params.item].map((item, idx) => {
          return { ...item, templateId: t.id, order: idx + 1, updatedAtIso: nowIso };
        });
        return {
          ...t,
          items: nextItems,
          updatedAtIso: nowIso,
        };
      });
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  const executeRemoveTemplateItem = useCallback(
    (params: RemoveTemplateItemParams): void => {
      const nowIso = getNowIso();
      const next = templates.map((t) => {
        if (t.id !== params.templateId) return t;
        const nextItems = t.items
          .filter((i) => i.id !== params.itemId)
          .map((item, idx) => ({ ...item, order: idx + 1, updatedAtIso: nowIso }));
        return { ...t, items: nextItems, updatedAtIso: nowIso };
      });
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  const executeUpdateTemplateItem = useCallback(
    (params: UpdateTemplateItemParams): void => {
      const nowIso = getNowIso();
      const next = templates.map((t) => {
        if (t.id !== params.templateId) return t;
        const nextItems = t.items.map((i) => {
          if (i.id !== params.itemId) return i;
          return {
            ...i,
            exerciseId: params.exerciseId.trim(),
            notes: params.notes.trim(),
            sets: params.sets,
            reps: params.reps,
            restSeconds: params.restSeconds,
            updatedAtIso: nowIso,
          };
        });
        return { ...t, items: nextItems, updatedAtIso: nowIso };
      });
      setTemplates(next);
      writeTemplatesToStorage({ templates: next });
    },
    [templates]
  );

  return {
    templates,
    templatesById,
    isLoading,
    executeReload,
    executeCreateTemplate,
    executeImportTemplates,
    executeUpdateTemplate,
    executeDeleteTemplate,
    executeAddTemplateItem,
    executeRemoveTemplateItem,
    executeUpdateTemplateItem,
  };
}

