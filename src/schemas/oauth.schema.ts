// Schemas de Zod para el flujo OAuth 2.1 (Dynamic Client Registration, Authorization
// Code + PKCE, token exchange). Fuente de verdad para lo que entra por /oauth/*.
import { z } from "zod";

export const registerClientSchema = z.object({
  client_name: z.string().trim().min(1).max(120).optional().default("Cliente MCP"),
  redirect_uris: z.array(z.string().url()).min(1, "redirect_uris es requerido"),
});

export type RegisterClientInput = z.infer<typeof registerClientSchema>;

const codeChallengeMethodSchema = z.enum(["S256", "plain"]).default("S256");

export const authorizeQuerySchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: codeChallengeMethodSchema,
  scope: z.string().optional(),
});

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;

export const authorizeLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("El email no tiene un formato valido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().optional(),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: codeChallengeMethodSchema,
  scope: z.string().optional(),
});

export type AuthorizeLoginInput = z.infer<typeof authorizeLoginSchema>;

export const tokenBodySchema = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("authorization_code"),
    code: z.string().min(1),
    redirect_uri: z.string().url(),
    client_id: z.string().min(1),
    code_verifier: z.string().min(43).max(128),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
  }),
]);

export type TokenBodyInput = z.infer<typeof tokenBodySchema>;
