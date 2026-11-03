import type { auth } from "../lib/auth.js";

// Tipos inferidos de la config de Better Auth: incluyen el `role` que agrega el plugin admin.
type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
export type UserRole = "admin" | "user";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}
