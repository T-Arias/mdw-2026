// Schemas de Zod para autenticacion: fuente de verdad para validar lo que entra por HTTP.
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  email: z.string().trim().toLowerCase().email("El email no tiene un formato valido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("El email no tiene un formato valido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
