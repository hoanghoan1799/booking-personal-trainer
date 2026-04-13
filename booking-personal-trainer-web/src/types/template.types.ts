export type TemplateType = "SYSTEM" | "TRAINER" | "PUBLIC";

export interface ExerciseTemplateItem {
  id: string;
  templateId: string;
  exerciseId: string;
  order: number;
  sets: number | null;
  reps: number | null;
  restSeconds: number | null;
  notes: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  templateType: TemplateType;
  parentTemplateId: string | null;
  isDeleted: boolean;
  deletedAtIso: string | null;
  createdAtIso: string;
  updatedAtIso: string;
  items: ExerciseTemplateItem[];
}

