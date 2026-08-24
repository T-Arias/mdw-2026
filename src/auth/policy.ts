// Punto unico de verdad de permisos. El middleware autentica (¿quien sos?);
// esto autoriza (¿podes hacer esto?). Se llama desde los services, nunca desde las rutas,
// asi la misma regla aplica sin importar si el caller es el controller HTTP o una tool MCP.
import { UserRole } from "../types/auth.types";
import { requireActor } from "../core/context";
import { ForbiddenError } from "../core/errors";

export type Action =
  | "students:read"
  | "students:create"
  | "students:update"
  | "students:delete"
  | "tokens:manage";

const ROLE_PERMISSIONS: Record<UserRole, Action[]> = {
  ADMIN: ["students:read", "students:create", "students:update", "students:delete", "tokens:manage"],
  USER: ["students:read"],
};

export function can(role: UserRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}

// Lee el actor del ActorContext (AsyncLocalStorage). Sin actor -> UnauthorizedError
// (via requireActor); con actor pero sin permiso -> ForbiddenError.
export function assertCan(action: Action): void {
  const actor = requireActor();
  if (!can(actor.role, action)) {
    throw new ForbiddenError();
  }
}
