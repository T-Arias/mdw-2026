// Base URL publica del server, usada para armar URLs absolutas en metadata OAuth
// (RFC8414/RFC9728) y en el header WWW-Authenticate de /mcp. PUBLIC_BASE_URL pisa
// el host detectado por request para deploys detras de un proxy/tunnel.
import { Request } from "express";

export function getPublicBaseUrl(req: Request): string {
  return process.env.PUBLIC_BASE_URL ?? `${req.protocol}://${req.get("host")}`;
}
