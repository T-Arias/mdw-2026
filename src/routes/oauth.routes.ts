// Servidor de autorizacion OAuth 2.1, montado en la raiz de la app (no bajo
// /api/v1: los well-known paths y /oauth/* son parte del contrato OAuth, no de
// nuestra API de recursos). CORS abierto sin credentials, igual que /mcp: estos
// endpoints los golpean clientes MCP externos (Claude Desktop, ChatGPT), no el
// frontend propio con cookies.
import { Express } from "express";
import cors from "cors";
import {
  getAuthorizationServerMetadata,
  getProtectedResourceMetadata,
  registerOAuthClient,
  showAuthorizePage,
  submitAuthorizePage,
  issueOAuthToken,
} from "../controllers/oauth.controller";

export function mountOAuthServer(app: Express): void {
  app.use(["/oauth", "/.well-known"], cors({ origin: true, credentials: false }));

  app.get("/.well-known/oauth-authorization-server", getAuthorizationServerMetadata);
  app.get("/.well-known/oauth-protected-resource", getProtectedResourceMetadata);

  app.post("/oauth/register", registerOAuthClient);
  app.get("/oauth/authorize", showAuthorizePage);
  app.post("/oauth/authorize", submitAuthorizePage);
  app.post("/oauth/token", issueOAuthToken);
}
