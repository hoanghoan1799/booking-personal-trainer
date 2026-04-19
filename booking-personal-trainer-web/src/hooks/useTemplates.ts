"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExerciseTemplate, ExerciseTemplateItem, TemplateType } from "@/types/template.types";
import {
  createTemplate,
  createTemplateItem,
  deleteTemplate,
  deleteTemplateItem,
  forkTemplate,
  getTemplates,
  updateTemplate,
  updateTemplateItem,
} from "@/services/templates/templates.service";
import { utcNowIso } from "@/lib/date-time/utc-date-time.helper";
import { useProfile } from "./useProfile";

type CreateTemplateParams = {
  name: string;
  description: string;
  templateType: TemplateType;
  parentTemplateId: string | null;
};

type UpdateTemplateParams = {
  templateId: string;
  name: string;
  description: string;
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
  return utcNowIso();
}

export function useTemplates() {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const executeReload = useCallback(async (): Promise<void> => {
    const role = currentUser?.role as string | undefined;
    const canFetch = role === "ADMIN" || role === "TRAINER";
    if (!canFetch) {
      setTemplates([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getTemplates({ limit: 200 });
      setTemplates(res.templates);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.role]);

  useEffect(() => {
    if (isProfileLoading) return;
    void executeReload();
  }, [executeReload, isProfileLoading]);

  const templatesById = useMemo(() => {
    return new Map(templates.map((t) => [t.id, t]));
  }, [templates]);

  const executeCreateTemplate = useCallback(
    async (params: CreateTemplateParams): Promise<ExerciseTemplate> => {
      setIsLoading(true);
      try {
        const created = await createTemplate({
          name: params.name.trim(),
          description: params.description.trim(),
          templateType: params.templateType,
          parentTemplateId: params.parentTemplateId,
        });
        setTemplates((prev) => [created, ...prev]);
        return created;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeUpdateTemplate = useCallback(
    async (params: UpdateTemplateParams): Promise<void> => {
      setIsLoading(true);
      try {
        const updated = await updateTemplate(params.templateId, {
          name: params.name.trim(),
          description: params.description.trim(),
          templateType: params.templateType,
          parentTemplateId: params.parentTemplateId,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeDeleteTemplate = useCallback(
    async (params: DeleteTemplateParams): Promise<void> => {
      setIsLoading(true);
      try {
        await deleteTemplate(params.templateId);
        setTemplates((prev) => prev.filter((t) => t.id !== params.templateId));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeForkTemplate = useCallback(
    async (templateId: string): Promise<ExerciseTemplate> => {
      setIsLoading(true);
      try {
        const forked = await forkTemplate(templateId);
        setTemplates((prev) => [forked, ...prev]);
        return forked;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const executeAddTemplateItem = useCallback(
    async (params: AddTemplateItemParams): Promise<void> => {
      setIsLoading(true);
      try {
        const template = templatesById.get(params.templateId);
        const order = (template?.items?.length ?? 0) + 1;
        const created = await createTemplateItem(params.templateId, {
          exerciseId: params.item.exerciseId,
          order,
          sets: params.item.sets,
          reps: params.item.reps,
          restSeconds: params.item.restSeconds,
          notes: params.item.notes,
        });
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === params.templateId ? { ...t, items: [...t.items, created] } : t,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [templatesById]
  );

  const executeRemoveTemplateItem = useCallback(
    async (params: RemoveTemplateItemParams): Promise<void> => {
      setIsLoading(true);
      try {
        await deleteTemplateItem(params.templateId, params.itemId);
        setTemplates((prev) =>
          prev.map((t) => {
            if (t.id !== params.templateId) return t;
            const nextItems = t.items
              .filter((i) => i.id !== params.itemId)
              .map((item, idx) => ({ ...item, order: idx + 1, updatedAtIso: getNowIso() }));
            return { ...t, items: nextItems, updatedAtIso: getNowIso() };
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeUpdateTemplateItem = useCallback(
    async (params: UpdateTemplateItemParams): Promise<void> => {
      setIsLoading(true);
      try {
        const updated = await updateTemplateItem(params.templateId, params.itemId, {
          exerciseId: params.exerciseId.trim(),
          notes: params.notes.trim(),
          sets: params.sets,
          reps: params.reps,
          restSeconds: params.restSeconds,
        });
        setTemplates((prev) =>
          prev.map((t) => {
            if (t.id !== params.templateId) return t;
            const nextItems = t.items.map((i) => (i.id === updated.id ? updated : i));
            return { ...t, items: nextItems, updatedAtIso: getNowIso() };
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    templates,
    templatesById,
    isLoading: isProfileLoading || isLoading,
    executeReload,
    executeCreateTemplate,
    executeUpdateTemplate,
    executeDeleteTemplate,
    executeForkTemplate,
    executeAddTemplateItem,
    executeRemoveTemplateItem,
    executeUpdateTemplateItem,
  };
}

