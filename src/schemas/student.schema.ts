import { z } from "zod";

export const ALLOWED_SORT_FIELDS = ["createdAt", "firstName", "lastName", "enrollmentDate"] as const;

export const listStudentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  career: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(80),
  email: z.string().trim().toLowerCase().email("El email no tiene un formato valido"),
  career: z.string().trim().min(1, "La carrera es obligatoria"),
  enrollmentDate: z.iso.datetime().optional(),
  active: z.boolean().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type ListStudentsInput = z.infer<typeof listStudentsSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;