// Schema de Zod para la emision de API tokens (fuente de verdad tambien para
// el inputSchema del endpoint HTTP; no hay tool MCP que emita tokens).
import { z } from "zod";

export const issueTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  role: z.enum(["ADMIN", "USER"]),
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

export type IssueTokenInput = z.infer<typeof issueTokenSchema>;
