import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";
import type { ExerciseTemplate, ExerciseTemplateItem, TemplateType } from "@/types/template.types";

interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GetTemplatesQuery {
  page?: number;
  limit?: number;
  templateType?: TemplateType;
  includeDeleted?: boolean;
}

export interface GetTemplatesResponse {
  templates: ExerciseTemplate[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  templateType: TemplateType;
  parentTemplateId?: string | null;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  templateType?: TemplateType;
  parentTemplateId?: string | null;
}

export interface CreateTemplateItemInput {
  exerciseId: string;
  order: number;
  sets?: number | null;
  reps?: number | null;
  restSeconds?: number | null;
  notes?: string;
}

export interface UpdateTemplateItemInput {
  exerciseId?: string;
  order?: number;
  sets?: number | null;
  reps?: number | null;
  restSeconds?: number | null;
  notes?: string;
}

export interface ImportTemplatesCsvResult {
  totalRows: number;
  createdTemplates: number;
  createdItems: number;
  createdTemplateIds: string[];
}

function buildQueryString(query: GetTemplatesQuery): string {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === "") return;
    searchParams.set(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function normalizeIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeTemplateItem(item: any): ExerciseTemplateItem {
  return {
    id: String(item.id),
    templateId: String(item.templateId),
    exerciseId: String(item.exerciseId),
    order: Number(item.order) || 1,
    sets: item.sets === null || item.sets === undefined ? null : Number(item.sets),
    reps: item.reps === null || item.reps === undefined ? null : Number(item.reps),
    restSeconds:
      item.restSeconds === null || item.restSeconds === undefined ? null : Number(item.restSeconds),
    notes: typeof item.notes === "string" ? item.notes : "",
    createdAtIso: normalizeIso(item.createdAtIso),
    updatedAtIso: normalizeIso(item.updatedAtIso),
  };
}

function normalizeTemplate(template: any): ExerciseTemplate {
  return {
    id: String(template.id),
    name: typeof template.name === "string" ? template.name : "",
    description: typeof template.description === "string" ? template.description : "",
    createdBy: String(template.createdBy),
    templateType: template.templateType as TemplateType,
    parentTemplateId: template.parentTemplateId ?? null,
    isDeleted: Boolean(template.isDeleted),
    deletedAtIso: template.deletedAtIso ?? null,
    createdAtIso: normalizeIso(template.createdAtIso),
    updatedAtIso: normalizeIso(template.updatedAtIso),
    items: Array.isArray(template.items) ? template.items.map(normalizeTemplateItem) : [],
  };
}

export async function getTemplates(query: GetTemplatesQuery = {}): Promise<GetTemplatesResponse> {
  const qs = buildQueryString({ ...query, limit: query.limit ?? 100 });
  const res = await apiFetch<ApiResponse<ExerciseTemplate[]>>(`${API_ENDPOINTS.TEMPLATES}${qs}`);
  const templates = (res.data ?? []).map(normalizeTemplate);
  return {
    templates,
    meta: res.meta ?? {
      page: 1,
      limit: templates.length,
      totalItems: templates.length,
      totalPages: 1,
    },
  };
}

export async function createTemplate(input: CreateTemplateInput): Promise<ExerciseTemplate> {
  const res = await apiFetch<ApiResponse<ExerciseTemplate>>(API_ENDPOINTS.TEMPLATES, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeTemplate(res.data);
}

export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput,
): Promise<ExerciseTemplate> {
  const res = await apiFetch<ApiResponse<ExerciseTemplate>>(`${API_ENDPOINTS.TEMPLATES}/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return normalizeTemplate(res.data);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await apiFetch<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.TEMPLATES}/${templateId}`, {
    method: "DELETE",
  });
}

export async function createTemplateItem(
  templateId: string,
  input: CreateTemplateItemInput,
): Promise<ExerciseTemplateItem> {
  const res = await apiFetch<ApiResponse<ExerciseTemplateItem>>(
    `${API_ENDPOINTS.TEMPLATES}/${templateId}/items`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return normalizeTemplateItem(res.data);
}

export async function updateTemplateItem(
  templateId: string,
  itemId: string,
  input: UpdateTemplateItemInput,
): Promise<ExerciseTemplateItem> {
  const res = await apiFetch<ApiResponse<ExerciseTemplateItem>>(
    `${API_ENDPOINTS.TEMPLATES}/${templateId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return normalizeTemplateItem(res.data);
}

export async function deleteTemplateItem(templateId: string, itemId: string): Promise<void> {
  await apiFetch<ApiResponse<{ message: string }>>(
    `${API_ENDPOINTS.TEMPLATES}/${templateId}/items/${itemId}`,
    {
      method: "DELETE",
    },
  );
}

export async function importTemplatesCsv(file: File): Promise<ImportTemplatesCsvResult> {
  const body = new FormData();
  body.append("file", file);
  const res = await apiFetch<ApiResponse<ImportTemplatesCsvResult>>(
    `${API_ENDPOINTS.TEMPLATES}/import/csv`,
    {
      method: "POST",
      body,
    },
  );
  return res.data;
}

