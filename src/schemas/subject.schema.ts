import { z } from "zod";

export const ALLOWED_SORT_FIELDS = ["createdAt", "name", "code", "credits", "year"] as const;

export const listSubjectsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  year: z.number().int().min(1).max(6).optional(),
  credits: z.number().int().min(1).max(20).optional(),
  active: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la materia es obligatorio").max(120),
  code: z.string().trim().toUpperCase().min(1, "El codigo es obligatorio").max(20),
  description: z.string().trim().max(500).optional(),
  credits: z.number().int().min(1, "Los creditos deben ser al menos 1").max(20),
  year: z.number().int().min(1, "El anio debe ser al menos 1").max(6),
  active: z.boolean().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
