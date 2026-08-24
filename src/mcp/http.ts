// Endpoint Streamable HTTP para MCP, montado sobre la misma app Express.
// Modo stateless: un McpServer + transport nuevos por request, con las tools ya
// filtradas para el actor de ESE request (sessionIdGenerator: undefined => sin
// sesion persistida, cada request se autentica y arma su propio set de tools).
//
// Publico a proposito: sin restriccion de Host/Origin (el server puede correr
// detras de ngrok, un dominio propio, etc., con Host header variable) y con CORS
// abierto sin credentials. La garantia de acceso es el Bearer token, no de donde
// viene la conexion — a diferencia de /api/v1, este endpoint no usa cookies, asi
// que no hay CSRF que un origin allowlist este evitando.
import { Express, Request, Response } from "express";
import cors from "cors";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { resolveActorFromToken } from "../auth/token.service";
import { createMcpServer } from "./server";
import { getBearerToken } from "../auth/bearer";
import { UnauthorizedError } from "../core/errors";
import { getPublicBaseUrl } from "../core/base-url";

function wwwAuthenticateHeader(req: Request): string {
  return `Bearer resource_metadata="${getPublicBaseUrl(req)}/.well-known/oauth-protected-resource"`;
}

export function mountMcpServer(app: Express): void {
  app.use("/mcp", cors({ origin: true, credentials: false }));

  app.all("/mcp", async (req: Request, res: Response) => {
    const bearerToken = getBearerToken(req);

    if (!bearerToken) {
      res.setHeader("WWW-Authenticate", wwwAuthenticateHeader(req));
      res.status(401).json({ success: false, error: { message: "Falta el token MCP" } });
      return;
    }

    try {
      const actor = await resolveActorFromToken(bearerToken);
      const server = createMcpServer(actor);

      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableDnsRebindingProtection: false,
      });

      res.on("close", () => {
        void transport.close();
        void server.close();
      });

      await server.connect(transport);
      // req.body ya viene parseado por express.json(); se lo pasamos para no releer el stream.
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.setHeader("WWW-Authenticate", wwwAuthenticateHeader(req));
        res.status(401).json({ success: false, error: { message: error.message } });
        return;
      }

      console.error("[mcp] error manejando request:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
      }
    }
  });
}
