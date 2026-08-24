// Emite y valida tokens opacos revocables. El valor en claro solo existe en la
// respuesta de issueToken(); de ahi en mas solo vive su hash (sha256) en Mongo.
//
// Token opaco (no JWT) a proposito: si igual hay que pegarle a la base para chequear
// el estado, un JWT firmado solo suma una segunda fuente de verdad que puede
// contradecir a la primera (firma valida pero revocado). Toda la autoridad vive en la fila.
import crypto from "node:crypto";
import ApiToken, { IApiTokenDocument } from "../models/ApiToken";
import { UserRole } from "../types/auth.types";
import { ActorContext, requireActor } from "../core/context";
import { can } from "./policy";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../core/errors";

const TOKEN_PREFIX = "mcp_";
const ROLE_RANK: Record<UserRole, number> = { USER: 0, ADMIN: 1 };

function generateRawToken(): string {
  return `${TOKEN_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
}

// sha256, no bcrypt: un token de 32 bytes aleatorios no es fuerza-brutable y no
// necesita un hash lento; sha256 es deterministico, asi se puede buscar por igualdad.
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export interface IssueTokenInput {
  name: string;
  role: UserRole;
  expiresInDays: number;
}

export interface IssuedToken {
  id: string;
  name: string;
  role: UserRole;
  expiresAt: Date;
  token: string;
}

export interface TokenSummary {
  id: string;
  name: string;
  userId: string;
  role: UserRole;
  status: IApiTokenDocument["status"];
  expiresAt: Date;
  lastUsedAt?: Date;
}

function toSummary(record: IApiTokenDocument): TokenSummary {
  return {
    id: record._id.toString(),
    name: record.name,
    userId: record.userId.toString(),
    role: record.role,
    status: record.status,
    expiresAt: record.expiresAt,
    lastUsedAt: record.lastUsedAt,
  };
}

// Guardrail contra escalada de privilegios: un token hereda como maximo el rol de
// quien lo emite. ADMIN puede emitir ADMIN o USER; USER solo puede emitir USER.
export async function issueToken(input: IssueTokenInput): Promise<IssuedToken> {
  const actor = requireActor();

  if (ROLE_RANK[input.role] > ROLE_RANK[actor.role]) {
    throw new ForbiddenError("No podes emitir un token con un rol superior al tuyo");
  }

  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

  const record = await ApiToken.create({
    name: input.name,
    userId: actor.userId,
    role: input.role,
    tokenHash: hashToken(rawToken),
    status: "ACTIVE",
    expiresAt,
  });

  return {
    id: record._id.toString(),
    name: record.name,
    role: record.role,
    expiresAt: record.expiresAt,
    token: rawToken,
  };
}

// Usado por el flujo OAuth: el propio usuario (ya autenticado con email+password
// en /oauth/authorize) se emite un access token para si mismo, no hay un actor
// "emisor" distinto ni riesgo de escalada de rol que chequear via issueToken().
export async function issueAccessTokenForUser(
  userId: string,
  role: UserRole,
  name: string,
  expiresInDays: number
): Promise<IssuedToken> {
  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const record = await ApiToken.create({
    name,
    userId,
    role,
    tokenHash: hashToken(rawToken),
    status: "ACTIVE",
    expiresAt,
  });

  return {
    id: record._id.toString(),
    name: record.name,
    role: record.role,
    expiresAt: record.expiresAt,
    token: rawToken,
  };
}

export async function resolveActorFromToken(rawToken: string): Promise<ActorContext> {
  const record = await ApiToken.findOne({ tokenHash: hashToken(rawToken) });

  if (!record || record.status !== "ACTIVE" || record.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError("Token invalido, revocado o expirado");
  }

  // No bloquea la respuesta por una escritura de telemetria.
  void ApiToken.updateOne({ _id: record._id }, { lastUsedAt: new Date() }).exec();

  return { userId: record.userId.toString(), role: record.role };
}

// ADMIN (via el permiso tokens:manage) ve y administra los tokens de cualquiera;
// cualquier actor administra los suyos propios.
export async function listTokens(): Promise<TokenSummary[]> {
  const actor = requireActor();
  const filter = can(actor.role, "tokens:manage") ? {} : { userId: actor.userId };
  const records = await ApiToken.find(filter).sort({ createdAt: -1 });
  return records.map(toSummary);
}

export async function revokeToken(id: string): Promise<void> {
  const actor = requireActor();
  const record = await ApiToken.findById(id);

  if (!record) throw new NotFoundError("Token no encontrado");

  const isOwner = record.userId.toString() === actor.userId;
  if (!isOwner && !can(actor.role, "tokens:manage")) {
    throw new ForbiddenError();
  }

  record.status = "REVOKED";
  await record.save();
}
