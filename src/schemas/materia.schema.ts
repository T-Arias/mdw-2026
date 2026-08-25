import { z } from "zod";

export const ALLOWED_SORT_FIELDS = ["createdAt", "nombre", "profesor", "career"] as const;

export const listMateriasSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  career: z.string().trim().min(1).optional(),
  profesor: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createMateriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la materia es obligatorio").max(80),
  profesor: z.string().trim().min(1, "El profesor es obligatorio"),
  career: z.string().trim().min(1, "La carrera es obligatoria"),
  horario: z.string().trim().min(1, "El horario es obligatorio"),
  active: z.boolean().optional(),
});

export const updateMateriaSchema = createMateriaSchema.partial();

export type ListMateriasInput = z.infer<typeof listMateriasSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
