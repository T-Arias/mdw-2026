# Clase 3 — Comandos usados en clase

Sigue a `clase 1/README.md` y `clase 2/README.md`. El foco de esta clase es autenticacion:
middlewares, validacion con Zod y un service de login/register. Estos son los comandos de
terminal (npm) que se corrieron para armar las dependencias, en el orden en que se fueron
necesitando.

---

## Dependencias de autenticacion

### JWT, cookies y validacion

```bash
npm install jsonwebtoken cookie-parser zod
npm install --save-dev @types/jsonwebtoken @types/cookie-parser
```

`jsonwebtoken` firma y verifica los tokens de acceso/refresh. `cookie-parser` permite leer
`req.cookies` (las rutas de auth guardan `accessToken`/`refreshToken` en cookies httpOnly). `zod`
se usa para los schemas de `register`/`login` que corren en el middleware `validateBody`.

### Hash de contraseñas

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

`bcrypt` es un binding nativo en C++ (via `node-gyp`) para hashear y comparar contraseñas. Es mas
rapido que una implementacion pura en JS, pero requiere toolchain de compilacion nativa instalado
en la maquina; como el entorno de esta clase ya lo tenia disponible, se opto directamente por la
version nativa.

---

## Resultado en `package.json`

```diff
   "dependencies": {
+    "bcrypt": "^6.0.0",
+    "cookie-parser": "^1.4.7",
     "cors": "^2.8.6",
     "dotenv": "^17.4.2",
     "express": "^5.2.1",
+    "jsonwebtoken": "^9.0.3",
+    "mongoose": "^9.9.3",
+    "zod": "^4.4.3"
   },
   "devDependencies": {
+    "@types/bcrypt": "^6.0.0",
+    "@types/cookie-parser": "^1.4.10",
     "@types/cors": "^2.8.19",
     "@types/express": "^5.0.6",
+    "@types/jsonwebtoken": "^9.0.10",
     "@types/node": "^26.2.0",
     "tsx": "^4.23.12",
     "typescript": "^7.0.2"
```

---

## Ver que falta commitear

```bash
git status
git diff HEAD -- package.json
```

`git status` muestra que `package.json`, `package-lock.json` y los archivos nuevos de
`src/middlewares`, `src/schemas`, `src/types`, `src/controllers/auth.controller.ts` y
`src/routes/auth.routes.ts` todavia no estan commiteados. `git diff HEAD -- package.json` compara
el `package.json` actual contra el ultimo commit para ver exactamente que dependencias se sumaron.
