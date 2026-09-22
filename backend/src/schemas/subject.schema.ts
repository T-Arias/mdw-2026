import { z } from "zod";

export const ALLOWED_SUBJECT_SORT_FIELDS = [
  "createdAt",
  "name",
  "code",
  "credits",
  "year",
] as const;

export const listSubjectsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SUBJECT_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  career: z.string().trim().min(1).optional(),
  year: z.number().int().min(1).max(6).optional(),
  active: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  code: z.string().trim().min(1, "Code is required").max(20).toUpperCase(),
  career: z.string().trim().min(1, "Career is required"),
  credits: z.number().int().min(1).max(12),
  year: z.number().int().min(1).max(6),
  description: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required to update" }
);

export type ListSubjectsInput = z.infer<typeof listSubjectsSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
