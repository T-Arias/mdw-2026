import { z } from "zod";
import { CUATRIMESTRES } from "../models/Materia";

export const ALLOWED_SORT_FIELDS = [
  "createdAt",
  "nombre",
  "codigo",
  "anio",
  "creditos",
] as const;

const CODIGO_REGEX = /^[A-Z]{2,4}-\d{3}$/;

// Filtros del listado. Llegan por body porque el método es QUERY, no GET.
export const listMateriasSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  carrera: z.string().trim().min(1).optional(),
  cuatrimestre: z.enum(CUATRIMESTRES).optional(),
  anio: z.number().int().min(1).max(6).optional(),
  activa: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createMateriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(CODIGO_REGEX, "Formato de código inválido (ej: MDW-401)"),
  creditos: z
    .number()
    .int("Los créditos deben ser un número entero")
    .min(1, "Los créditos no pueden ser menos de 1")
    .max(20, "Los créditos no pueden superar 20"),
  anio: z
    .number()
    .int("El año debe ser un número entero")
    .min(1, "El año no puede ser menor a 1")
    .max(6, "El año no puede ser mayor a 6"),
  cuatrimestre: z.enum(CUATRIMESTRES),
  carrera: z.string().trim().min(1, "La carrera es obligatoria").max(120),
  activa: z.boolean().optional(),
});

// El PUT es parcial: mandás sólo lo que querés cambiar, pero eso se valida igual.
export const updateMateriaSchema = createMateriaSchema.partial();

export type ListMateriasInput = z.infer<typeof listMateriasSchema>;
export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaSchema>;
