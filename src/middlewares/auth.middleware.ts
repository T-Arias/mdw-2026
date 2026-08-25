// Protege rutas: exige un accessToken valido en cookies; si expiro, intenta renovarlo con el refreshToken.
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtAccessPayload, JwtRefreshPayload } from "../types/auth.types";

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

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    renewFromRefreshToken(req, res, next);
    return;
  }

  try {
    const decoded = jwt.verify(accessToken, getAccessSecret()) as JwtAccessPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
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

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { message: "Sesion invalida o expirada" } });
  }
}
