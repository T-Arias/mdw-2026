// Protege rutas y publica el actor autenticado en el ActorContext (AsyncLocalStorage).
// Dos credenciales posibles, resueltas al mismo ActorContext:
//   1. Authorization: Bearer <token opaco> -> resolveActorFromToken() (API tokens, MCP)
//   2. Cookie accessToken/refreshToken -> JWT de sesion de navegador (flujo existente)
// Responde directo con res.status(...) en cada catch (no next(err)): no hay error
// handler global esperando eso, cada punto de falla se resuelve donde ocurre.
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtAccessPayload, JwtRefreshPayload } from "../types/auth.types";
import { runWithActor } from "../core/context";
import { resolveActorFromToken } from "../auth/token.service";
import { getBearerToken } from "../auth/bearer";
import { describeError } from "../core/errors";

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET environment variable");
  return secret;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const bearerToken = getBearerToken(req);

  if (bearerToken) {
    try {
      const actor = await resolveActorFromToken(bearerToken);
      runWithActor(actor, next);
    } catch (error) {
      const message = describeError(error)?.message ?? "No autorizado";
      res.status(401).json({ success: false, error: { message } });
    }
    return;
  }

  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    renewFromRefreshToken(req, res, next);
    return;
  }

  try {
    const decoded = jwt.verify(accessToken, getAccessSecret()) as JwtAccessPayload;
    runWithActor({ userId: decoded.userId, role: decoded.role }, next);
  } catch (error) {
    renewFromRefreshToken(req, res, next);
  }
}

function renewFromRefreshToken(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret()) as JwtRefreshPayload;

    const newAccessToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, getAccessSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    } as jwt.SignOptions);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    runWithActor({ userId: decoded.userId, role: decoded.role }, next);
  } catch (error) {
    res.status(401).json({ success: false, error: { message: "Sesion invalida o expirada" } });
  }
}
