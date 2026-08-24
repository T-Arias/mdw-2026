// Traduce un error de dominio a respuesta HTTP. Se llama explicitamente desde el
// catch de cada controller — no hay middleware de errores escondiendo esto.
import { Response } from "express";
import { ErrorCode, describeError } from "./errors";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};

export function sendError(res: Response, err: unknown): void {
  const described = describeError(err);

  if (described) {
    // Sin code (p.ej. ValidationError de mongoose): es un problema del request, 400.
    const status = described.code ? STATUS_BY_CODE[described.code] : 400;
    res.status(status).json({ success: false, error: { message: described.message } });
    return;
  }

  console.error("[http] unhandled error:", err);
  res.status(500).json({ success: false, error: { message: "Internal server error" } });
}
