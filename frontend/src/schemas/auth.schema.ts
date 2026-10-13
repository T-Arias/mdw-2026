import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
