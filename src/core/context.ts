// Propaga el actor autenticado (userId + role) a traves de la pila async sin
// ensuciar las firmas de los services. Cada adaptador (middleware HTTP, handler MCP)
// llama a runWithActor() una vez por request; los services leen getActor()/requireActor().
import { AsyncLocalStorage } from "node:async_hooks";
import { UserRole } from "../types/auth.types";
import { UnauthorizedError } from "./errors";

export interface ActorContext {
  userId: string;
  role: UserRole;
}

const actorStorage = new AsyncLocalStorage<ActorContext>();

// El resto de la cadena (next(), el handler de la tool) debe ejecutarse DENTRO del
// callback, o el contexto no se propaga.
export function runWithActor<T>(actor: ActorContext, fn: () => T): T {
  return actorStorage.run(actor, fn);
}

export function getActor(): ActorContext | undefined {
  return actorStorage.getStore();
}

export function requireActor(): ActorContext {
  const actor = getActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}
