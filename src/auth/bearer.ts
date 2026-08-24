// Extrae el token opaco del header Authorization. Usado tanto por authMiddleware
// (rutas HTTP normales) como por el endpoint /mcp — ambos necesitan lo mismo.
import { Request } from "express";

export function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}
