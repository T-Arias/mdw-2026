import { z } from "zod";

export const ALLOWED_MATERIA_SORT_FIELDS = ["createdAt", "nombre", "promedio"] as const;

export const listMateriasSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.enum(ALLOWED_MATERIA_SORT_FIELDS).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    estado: z.boolean().optional(),
    search: z.string().trim().min(1).max(120).optional(),
});

export const createMateriaSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
    estado: z.boolean().optional().default(true),
    promedio: z.number().min(0, "El promedio debe ser >= 0").max(10, "El promedio debe ser <= 10"),
});

export const updateMateriaSchema = createMateriaSchema.partial();

export type ListMateriasInput = z.infer<typeof listMateriasSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
