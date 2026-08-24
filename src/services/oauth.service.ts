// Autorizacion OAuth 2.1 (Authorization Code + PKCE) para clientes MCP genericos
// (Claude Desktop, ChatGPT, o cualquier cliente con Dynamic Client Registration).
// El authorization code y el refresh token son opacos y de un solo uso; el access
// token final se emite como un ApiToken comun, la misma tabla que /mcp ya valida
// via resolveActorFromToken() — no hay un segundo mecanismo de verificacion.
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import User from "../models/User";
import OAuthClient, { IOAuthClientDocument } from "../models/OAuthClient";
import OAuthAuthorizationCode, { CodeChallengeMethod } from "../models/OAuthAuthorizationCode";
import OAuthRefreshToken from "../models/OAuthRefreshToken";
import { issueAccessTokenForUser } from "../auth/token.service";
import { UserRole } from "../types/auth.types";
import { UnauthorizedError, ValidationError } from "../core/errors";

const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const ACCESS_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_TTL_DAYS = 30;

function randomOpaqueValue(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ---------------------------------------------------------------------------
// Dynamic Client Registration (RFC7591)
// ---------------------------------------------------------------------------

export interface RegisteredClient {
  client_id: string;
  client_name: string;
  redirect_uris: string[];
  token_endpoint_auth_method: "none";
  grant_types: string[];
  response_types: string[];
}

// Clientes publicos, sin client_secret: Claude Desktop y ChatGPT prueban su
// identidad con PKCE, no con un secreto compartido que ademas no se podria
// guardar de forma segura en una app de escritorio o SPA.
export async function registerClient(
  clientName: string,
  redirectUris: string[]
): Promise<RegisteredClient> {
  const clientId = crypto.randomUUID();
  const record = await OAuthClient.create({ clientId, clientName, redirectUris });

  return {
    client_id: record.clientId,
    client_name: record.clientName,
    redirect_uris: record.redirectUris,
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  };
}

export async function findClientOrThrow(clientId: string): Promise<IOAuthClientDocument> {
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new ValidationError("client_id desconocido");
  return client;
}

export function assertRedirectUriRegistered(
  client: Pick<IOAuthClientDocument, "redirectUris">,
  redirectUri: string
): void {
  if (!client.redirectUris.includes(redirectUri)) {
    throw new ValidationError("redirect_uri no registrado para este client_id");
  }
}

// ---------------------------------------------------------------------------
// Authorization (login + emision del code)
// ---------------------------------------------------------------------------

export interface AuthorizeInput {
  email: string;
  password: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
}

// Valida credenciales y emite un authorization code de un solo uso. No toca
// cookies de sesion: el login en /oauth/authorize es independiente del login web.
export async function authorizeWithPassword(input: AuthorizeInput): Promise<string> {
  const client = await findClientOrThrow(input.clientId);
  assertRedirectUriRegistered(client, input.redirectUri);

  const user = await User.findOne({ email: input.email });
  if (!user) throw new UnauthorizedError("Credenciales invalidas");

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) throw new UnauthorizedError("Credenciales invalidas");

  const rawCode = randomOpaqueValue();
  await OAuthAuthorizationCode.create({
    codeHash: sha256Hex(rawCode),
    clientId: input.clientId,
    userId: user._id,
    role: user.role,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
  });

  return rawCode;
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

function verifyPkce(codeVerifier: string, codeChallenge: string, method: CodeChallengeMethod): boolean {
  if (method === "plain") return codeVerifier === codeChallenge;
  const computed = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return computed === codeChallenge;
}

export interface TokenResult {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

async function issueGrant(userId: string, role: UserRole, clientId: string): Promise<TokenResult> {
  const issued = await issueAccessTokenForUser(userId, role, `oauth:${clientId}`, ACCESS_TOKEN_TTL_DAYS);

  const rawRefreshToken = randomOpaqueValue();
  await OAuthRefreshToken.create({
    tokenHash: sha256Hex(rawRefreshToken),
    clientId,
    userId,
    role,
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  return {
    access_token: issued.token,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60,
    refresh_token: rawRefreshToken,
    scope: "mcp",
  };
}

export interface ExchangeAuthorizationCodeInput {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}

export async function exchangeAuthorizationCode(input: ExchangeAuthorizationCodeInput): Promise<TokenResult> {
  const record = await OAuthAuthorizationCode.findOne({ codeHash: sha256Hex(input.code) });

  const isValid =
    record &&
    !record.consumedAt &&
    record.expiresAt.getTime() >= Date.now() &&
    record.clientId === input.clientId &&
    record.redirectUri === input.redirectUri;

  if (!record || !isValid) {
    throw new UnauthorizedError("Authorization code invalido o expirado");
  }

  if (!verifyPkce(input.codeVerifier, record.codeChallenge, record.codeChallengeMethod)) {
    throw new UnauthorizedError("code_verifier invalido");
  }

  record.consumedAt = new Date();
  await record.save();

  return issueGrant(record.userId.toString(), record.role, record.clientId);
}

export interface ExchangeRefreshTokenInput {
  refreshToken: string;
  clientId: string;
}

export async function exchangeRefreshToken(input: ExchangeRefreshTokenInput): Promise<TokenResult> {
  const record = await OAuthRefreshToken.findOne({ tokenHash: sha256Hex(input.refreshToken) });

  const isValid =
    record &&
    record.status === "ACTIVE" &&
    record.expiresAt.getTime() >= Date.now() &&
    record.clientId === input.clientId;

  if (!record || !isValid) {
    throw new UnauthorizedError("Refresh token invalido, revocado o expirado");
  }

  // Rotacion: el refresh token usado se revoca, se emite uno nuevo junto al access token.
  record.status = "REVOKED";
  await record.save();

  return issueGrant(record.userId.toString(), record.role, record.clientId);
}
