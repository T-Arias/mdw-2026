import { z } from "zod";

export const ALLOWED_SORT_FIELDS = ["createdAt", "nombre", "codigo", "cuatrimestre"] as const;

export const listMateriasSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cuatrimestre: z.number().int().min(1).max(2).optional(),
  activa: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createMateriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  codigo: z.string().trim().min(1, "El codigo es obligatorio").max(20),
  cargaHoraria: z.number().int().min(1, "La carga horaria debe ser mayor a 0"),
  cuatrimestre: z.number().int().min(1).max(2, "El cuatrimestre debe ser 1 o 2"),
  activa: z.boolean().optional(),
});

export const updateMateriaSchema = createMateriaSchema.partial();

export type ListMateriasInput = z.infer<typeof listMateriasSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;