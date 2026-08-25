import { z } from "zod";

export const createMateriaSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  year: z.number().int().min(1, "El año es obligatorio"),
  status: z.enum(["cursando", "aprobada", "regular", "libre"]).default("cursando"),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "El ID del estudiante no es válido"),
});

export const updateMateriaSchema = createMateriaSchema.partial();

export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;