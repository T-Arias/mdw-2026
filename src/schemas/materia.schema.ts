import { z } from "zod";

export const ALLOWED_MATERIA_SORT_FIELDS = [
  "createdAt",
  "nombre",
  "codigo",
  "creditos",
  "anio",
] as const;

export const listMateriasSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_MATERIA_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  carrera: z.string().trim().min(1).optional(),
  anio: z.coerce.number().int().min(1).max(6).optional(),
  activa: z.coerce.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createMateriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  codigo: z.string().trim().min(1, "El código es obligatorio").max(20).toUpperCase(),
  carrera: z.string().trim().min(1, "La carrera es obligatoria"),
  creditos: z.number().int().min(1).max(12),
  anio: z.number().int().min(1).max(6),
  descripcion: z.string().trim().max(500).optional(),
  activa: z.boolean().optional(),
});

export const updateMateriaSchema = createMateriaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Se requiere al menos un campo para actualizar" }
);

export type ListMateriasInput = z.infer<typeof listMateriasSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;