// Errores de dominio: transporte-agnosticos. Cada adaptador (HTTP, MCP) los traduce a su protocolo.
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT";

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sesion requerida") {
    super("UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tenes permisos para realizar esta accion") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super("NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

export interface KnownError {
  message: string;
  // Presente solo para nuestro AppError. Ausente para el ValidationError de mongoose
  // (no tiene un ErrorCode propio) — el caller decide el status/fallback en ese caso.
  code?: ErrorCode;
}

// Unico lugar que hace instanceof sobre errores de dominio. Los callers (sendError en
// HTTP, invokeTool en MCP) solo leen campos del resultado, no vuelven a discriminar tipos.
// undefined => error no reconocido; el caller decide el fallback generico y el logging.
export function describeError(err: unknown): KnownError | undefined {
  if (err instanceof AppError) return { message: err.message, code: err.code };
  // Mongoose valida a nivel de schema y tira su propio ValidationError (no es AppError).
  if (err instanceof Error && err.name === "ValidationError") return { message: err.message };
  return undefined;
}
