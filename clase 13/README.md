# Clase 13 — Better Auth + deploy en Render

Sigue a `clase 11/README.md`. La autenticacion hecha a mano de las clases 4 y 5 (bcrypt + JWT en
cookies `httpOnly`) se reemplaza por **Better Auth**, con login por email/contraseña y por **GitHub**.
Despues se deploya backend y frontend en **Render**. La consigna del trabajo practico esta en `TP2.md`.

Versiones (noviembre 2026): better-auth 1.7 · @better-auth/mongo-adapter 1.7 · mongodb 7.5 ·
Node 22 (Render y local, verificar con `node -v`).

---

## 1. Backend: pasar a ESM

Better Auth **solo funciona con ES Modules** (no soporta CommonJS).

`backend/package.json`:

```json
"type": "module"
```

`backend/tsconfig.json`:

```json
"module": "nodenext",
"moduleResolution": "nodenext"
```

Con `nodenext` los imports relativos **llevan la extension `.js`** (la del archivo compilado, no la
del `.ts`):

```ts
import v1Router from "./routes/index.js";            // antes: "./routes"
import { validateBody } from "../middlewares/validate.js";
```

Si falta la extension, `tsc` lo marca: `Relative import paths need explicit file extensions`.

---

## 2. Backend: dependencias

```bash
cd backend
npm install better-auth @better-auth/mongo-adapter mongodb
npm uninstall jsonwebtoken cookie-parser cors @types/jsonwebtoken @types/cookie-parser @types/cors
```

| Paquete | Para que |
|---|---|
| `better-auth` | La libreria: registro, login, sesiones, OAuth, plugins |
| `@better-auth/mongo-adapter` | Guarda usuarios y sesiones en nuestro Mongo |
| `mongodb` | El driver nativo que usa el adapter (mongoose ya lo traia por dentro, misma version) |

Se van `jsonwebtoken` (ya no firmamos tokens), `cookie-parser` (Better Auth lee sus cookies solo) y
`cors` (front y back pasan a compartir origen, ver seccion 6). `bcrypt` queda solo por `src/demo.ts`.

Archivos que **se borran**: `controllers/auth.controller.ts`, `routes/auth.routes.ts`,
`schemas/auth.schema.ts`, `models/User.ts`.

---

## 3. Backend: configuracion

### `.env`

```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
BETTER_AUTH_SECRET=        # ver abajo como generarlo
BETTER_AUTH_URL=http://localhost:5173
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Generar el secret (firma las cookies de sesion, **uno distinto por entorno**):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`BETTER_AUTH_URL` es la URL **del front**, no la del back: el navegador nunca habla directo con el
backend, siempre pasa por `/api` del front (seccion 6).

### `src/lib/auth.ts`

```ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(client.db(), { client }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [admin()],
});
```

- **Mongo no necesita migraciones**: Better Auth crea las colecciones `user`, `session`, `account` y
  `verification` la primera vez que las usa.
- Pasar `client` habilita transacciones (Atlas es un replica set).
- `admin()` agrega el campo `user.role` (`"user"` por defecto) y los endpoints para listar usuarios y
  revocar sesiones.

### `src/server.ts`

```ts
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

app.all("/api/auth/*splat", toNodeHandler(auth)); // ANTES de express.json()
app.use(express.json());
app.use("/api/v1", v1Router);
```

- El orden importa: `express.json()` consume el body del request; si va antes, Better Auth recibe el
  body vacio.
- `*splat` es el comodin de **Express 5** (en Express 4 era `*`).
- Verificar: `GET http://localhost:3000/api/auth/ok` → `{ "ok": true }`.

### `src/middlewares/auth.middleware.ts`

```ts
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

export async function authMiddleware(req, res, next) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) return res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
  req.user = session.user;
  next();
}
```

`requireRole` queda igual, leyendo `req.user.role`. Los roles pasan a minuscula, la convencion del
plugin admin: `requireRole("admin")`.

### Endpoints que expone Better Auth

| Antes (a mano) | Ahora |
|---|---|
| `POST /api/v1/auth/register` | `POST /api/auth/sign-up/email` |
| `POST /api/v1/auth/login` | `POST /api/auth/sign-in/email` |
| `POST /api/v1/auth/logout` | `POST /api/auth/sign-out` |
| `GET /api/v1/auth/me` | `GET /api/auth/get-session` |
| — | `POST /api/auth/sign-in/social` → GitHub |
| — | `GET /api/auth/callback/github` |
| — | `/api/auth/admin/*` (plugin admin) |

---

## 4. GitHub OAuth App

En GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:

| Campo | Local | Produccion |
|---|---|---|
| Homepage URL | `http://localhost:5173` | `https://<front>.onrender.com` |
| Authorization callback URL | `http://localhost:5173/api/auth/callback/github` | `https://<front>.onrender.com/api/auth/callback/github` |

- Una OAuth App acepta **una sola** callback URL: hacen falta **dos apps**, una para local y otra para
  produccion, cada una con su Client ID / Secret.
- Despues de crearla: **Generate a new client secret** y copiar los dos valores al `.env`.
- La callback apunta al **front** (puerto 5173): el proxy la reenvia al back.

---

## 5. Frontend

```bash
cd frontend
npm install better-auth
```

Archivos que **se borran**: `store/authSlice.ts`, `services/auth.ts`, `.env` y `.env.example`
(`VITE_API_URL` ya no se usa).

### `vite.config.ts` — proxy

```ts
server: {
  proxy: { "/api": "http://localhost:3000" },
},
```

### `src/lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [adminClient()] });
export const { useSession, signIn, signUp, signOut } = authClient;
```

Sin `baseURL`: usa el mismo origen del front.

### `src/lib/api.ts`

```ts
export const api = axios.create({ baseURL: "/api/v1" }); // sin withCredentials
```

### Uso en los componentes

```tsx
const { data: session, isPending } = useSession();     // reemplaza selectUser / selectChecking

const { error } = await signIn.email({ email, password });
const { error } = await signUp.email({ name, email, password }); // deja la sesion abierta
await signIn.social({ provider: "github", callbackURL: "/home" });
await signOut();
```

- Los metodos de Better Auth **no tiran excepciones**: devuelven `{ data, error }`.
- `store/index.ts` queda solo con `studentsApi`. `main.tsx` ya no pide `/auth/me` ni tiene el
  interceptor de 401.
- La contraseña minima pasa a **8 caracteres** (default de Better Auth).

### `/admin/sesiones`

Todo sale del plugin admin, sin codigo propio en el backend:

```ts
authClient.admin.listUsers({ query: { limit: 50 } });
authClient.admin.listUserSessions({ userId });
authClient.admin.revokeUserSession({ sessionToken });
```

---

## 6. Correr en local

```bash
cd backend && npm run dev      # terminal 1, puerto 3000
cd frontend && npm run dev     # terminal 2, puerto 5173
```

Entrar siempre por `http://localhost:5173`. El front llama a `/api/...` y Vite lo reenvia a `:3000`:
para el navegador es **el mismo origen**, asi que la cookie de sesion viaja sola y no hace falta CORS.

### Primer admin

Todos los usuarios nuevos son `user`. Para el primer admin: registrarse y en **Atlas → Browse
Collections → `user`** editar el documento y poner `role: "admin"`. Cerrar sesion y volver a entrar.

---

## 7. Deploy en Render

Primero subir la rama a GitHub. Despues, en [dashboard.render.com](https://dashboard.render.com):

### 7.1 Atlas

**Network Access → Add IP Address → `0.0.0.0/0`**. Las IPs de Render cambian, no se pueden listar.

### 7.2 Backend — New → Web Service

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |

Environment:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `MONGODB_URI` | la de Atlas |
| `BETTER_AUTH_SECRET` | uno **nuevo**, distinto al de local |
| `BETTER_AUTH_URL` | `https://<front>.onrender.com` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | los de la OAuth App **de produccion** |

`PORT` no se configura: Render la inyecta sola.

`--include=dev`: con `NODE_ENV=production`, `npm install` **saltea las devDependencies**, y
`typescript` y los `@types/*` son devDependencies → sin el flag `tsc` no existe y el build falla.

Verificar: `https://<back>.onrender.com/api/auth/ok` → `{ "ok": true }`.

### 7.3 Frontend — New → Static Site

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment: `NODE_VERSION` = `22`.

**Redirects/Rewrites**, en este orden:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://<back>.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

- La primera regla es el equivalente al proxy de Vite: el front sigue llamando a `/api` y Render lo
  reenvia al back. La cookie queda en el dominio del front (first-party).
- La segunda es para React Router: sin ella, F5 en `/admin` da 404 porque no existe un archivo
  `admin` en `dist/`.

### 7.4 Ultimo paso

Con las dos URLs ya creadas: completar `BETTER_AUTH_URL` en el back, y la Homepage / callback URL en
la OAuth App de produccion.

**Plan free**: el backend se duerme despues de 15 minutos sin uso; el primer request tarda ~50 s.

---

## 8. Errores tipicos

| Sintoma | Causa |
|---|---|
| `Relative import paths need explicit file extensions` | Falta `.js` en un import (ESM) |
| `ERR_REQUIRE_ESM` / `Cannot use import statement` | Falta `"type": "module"` en `package.json` |
| Build de Render: `tsc: not found` | Build sin `--include=dev` |
| `Missing BETTER_AUTH_URL environment variable` | Falta la variable en `.env` o en Render |
| GitHub: `redirect_uri is not associated with this application` | La callback de la OAuth App no coincide exacto (`http`/`https`, puerto, `/` final) |
| GitHub vuelve a `localhost` en produccion | `BETTER_AUTH_URL` del back apunta a localhost |
| GitHub: `email_not_found` | El usuario tiene el email privado en GitHub |
| `Invalid origin` (403) | Se entro por la URL del back o por un puerto distinto al de `BETTER_AUTH_URL` |
| F5 en una ruta da 404 en Render | Falta el rewrite `/*` → `/index.html` |
| Login OK pero `useSession` sigue vacio | El navegador llama directo al back en vez de `/api` del front |
| `/admin` redirige a `/perfil` | El usuario no tiene `role: "admin"` en Atlas |
| El primer request tarda 50 s | El plan free se durmio |
