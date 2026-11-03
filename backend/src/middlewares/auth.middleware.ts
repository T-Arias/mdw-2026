// Protege rutas: Better Auth lee la cookie de sesion y la busca en Mongo.
// Antes: verificar el JWT + renovar con el refresh token. Ahora la sesion vive en la base, y se puede revocar.
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UserRole } from "../types/auth.types.js";

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session) {
      res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
      return;
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("[auth] error reading session:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo verificar la sesion" } });
  }
}

// requireRole: siempre se usa DESPUES de authMiddleware, asume que req.user ya esta seteado.
export function requireRole(...rolesPermitidos: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
      return;
    }

    if (!rolesPermitidos.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: { message: "No tenes permisos para realizar esta accion" } });
      return;
    }

    next();
  };
}
