import { z } from "zod";

export const ALLOWED_SORT_FIELDS = ["createdAt", "name", "career"] as const;

export const listSubjectsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  career: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  career: z.string().trim().min(1, "La carrera es obligatoria"),
  year: z.number().int().min(1, "El año debe ser al menos 1").max(6, "El año no puede superar 6"),
  active: z.boolean().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
