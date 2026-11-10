import { z } from "zod";

// El limite de largo no es estetico: cada caracter son tokens que pagamos y que gastan el rate limit.
export const chatSchema = z.object({
  message: z.string().trim().min(1, "El mensaje es obligatorio").max(1000, "Maximo 1000 caracteres"),
});

export type ChatInput = z.infer<typeof chatSchema>;
