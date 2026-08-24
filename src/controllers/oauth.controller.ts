// Adaptador HTTP del flujo OAuth 2.1. Las respuestas de error siguen el formato
// que esperan los clientes OAuth (RFC6749: {error, error_description}), no el
// envelope {success, error} del resto de la API.
import { Request, Response } from "express";
import { getPublicBaseUrl } from "../core/base-url";
import { describeError } from "../core/errors";
import {
  registerClientSchema,
  authorizeQuerySchema,
  authorizeLoginSchema,
  tokenBodySchema,
} from "../schemas/oauth.schema";
import {
  registerClient,
  findClientOrThrow,
  assertRedirectUriRegistered,
  authorizeWithPassword,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
} from "../services/oauth.service";

export function getAuthorizationServerMetadata(req: Request, res: Response): void {
  const baseUrl = getPublicBaseUrl(req);
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256", "plain"],
    token_endpoint_auth_methods_supported: ["none"],
  });
}

export function getProtectedResourceMetadata(req: Request, res: Response): void {
  const baseUrl = getPublicBaseUrl(req);
  res.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
  });
}

export async function registerOAuthClient(req: Request, res: Response): Promise<void> {
  const parsed = registerClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_client_metadata",
      error_description: "redirect_uris es requerido",
    });
    return;
  }

  try {
    const client = await registerClient(parsed.data.client_name, parsed.data.redirect_uris);
    res.status(201).json(client);
  } catch (error) {
    console.error("[oauth] error registrando cliente:", error);
    res.status(500).json({ error: "server_error" });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

interface LoginPageParams {
  clientName: string;
  clientId: string;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope?: string;
  error?: string;
}

function renderLoginPage(params: LoginPageParams): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Iniciar sesion</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  form { background: #1e293b; padding: 2rem; border-radius: 12px; width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,.3); }
  h1 { font-size: 1.1rem; margin: 0 0 .25rem; }
  p { color: #94a3b8; font-size: .85rem; margin: 0 0 1.25rem; }
  label { display: block; font-size: .8rem; margin-bottom: .25rem; }
  input { width: 100%; padding: .5rem .6rem; margin-bottom: 1rem; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; box-sizing: border-box; }
  button { width: 100%; padding: .6rem; border: none; border-radius: 6px; background: #6366f1; color: white; font-weight: 600; cursor: pointer; }
  .error { background: #7f1d1d; color: #fecaca; padding: .5rem .75rem; border-radius: 6px; font-size: .8rem; margin-bottom: 1rem; }
</style>
</head>
<body>
<form method="POST" action="/oauth/authorize">
  <h1>Autorizar acceso</h1>
  <p><strong>${escapeHtml(params.clientName)}</strong> quiere conectarse a tu cuenta.</p>
  ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ""}
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required autofocus />
  <label for="password">Contrasena</label>
  <input type="password" id="password" name="password" required />
  <input type="hidden" name="client_id" value="${escapeHtml(params.clientId)}" />
  <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}" />
  <input type="hidden" name="state" value="${escapeHtml(params.state ?? "")}" />
  <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge)}" />
  <input type="hidden" name="code_challenge_method" value="${escapeHtml(params.codeChallengeMethod)}" />
  <input type="hidden" name="scope" value="${escapeHtml(params.scope ?? "")}" />
  <button type="submit">Continuar</button>
</form>
</body>
</html>`;
}

export async function showAuthorizePage(req: Request, res: Response): Promise<void> {
  const parsed = authorizeQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).send("Parametros de autorizacion invalidos");
    return;
  }

  try {
    const client = await findClientOrThrow(parsed.data.client_id);
    assertRedirectUriRegistered(client, parsed.data.redirect_uri);

    res.type("html").send(
      renderLoginPage({
        clientName: client.clientName,
        clientId: parsed.data.client_id,
        redirectUri: parsed.data.redirect_uri,
        state: parsed.data.state,
        codeChallenge: parsed.data.code_challenge,
        codeChallengeMethod: parsed.data.code_challenge_method,
        scope: parsed.data.scope,
      })
    );
  } catch (error) {
    res.status(400).send(describeError(error)?.message ?? "Solicitud de autorizacion invalida");
  }
}

export async function submitAuthorizePage(req: Request, res: Response): Promise<void> {
  const parsed = authorizeLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).send("Datos de login invalidos");
    return;
  }

  const { email, password, client_id, redirect_uri, state, code_challenge, code_challenge_method, scope } =
    parsed.data;

  try {
    const code = await authorizeWithPassword({
      email,
      password,
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    const message = describeError(error)?.message ?? "No se pudo iniciar sesion";

    let clientName = "Aplicacion externa";
    try {
      const client = await findClientOrThrow(client_id);
      clientName = client.clientName;
    } catch {
      // client_id ya no existe: se muestra igual el error generico, no hay a donde volver.
    }

    res.status(401).type("html").send(
      renderLoginPage({
        clientName,
        clientId: client_id,
        redirectUri: redirect_uri,
        state,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
        scope,
        error: message,
      })
    );
  }
}

export async function issueOAuthToken(req: Request, res: Response): Promise<void> {
  const parsed = tokenBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  try {
    const result =
      parsed.data.grant_type === "authorization_code"
        ? await exchangeAuthorizationCode({
            code: parsed.data.code,
            clientId: parsed.data.client_id,
            redirectUri: parsed.data.redirect_uri,
            codeVerifier: parsed.data.code_verifier,
          })
        : await exchangeRefreshToken({
            refreshToken: parsed.data.refresh_token,
            clientId: parsed.data.client_id,
          });

    res.status(200).json(result);
  } catch (error) {
    console.error("[oauth] error emitiendo token:", error);
    res.status(400).json({
      error: "invalid_grant",
      error_description: describeError(error)?.message ?? "No se pudo emitir el token",
    });
  }
}
