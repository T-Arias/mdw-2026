// Cliente de Better Auth: reemplaza a services/auth.ts + authSlice.
// Sin baseURL: el front y la API comparten origen (proxy de Vite en local, rewrite de Render en produccion).
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

// useSession es estado del SERVIDOR (como RTK Query): pide /api/auth/get-session y lo cachea.
export const { useSession, signIn, signUp, signOut } = authClient;
