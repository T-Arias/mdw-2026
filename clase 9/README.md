# Clase 9 — React Router: rutas publicas, privadas y por perfil

Sigue a `clase 7/README.md`. El frontend pasa de una unica vista a rutas reales con tres niveles de
acceso. Explicacion detallada en `teoria.md`; codigo en `frontend/src/`.

---

## 1. Comandos

```bash
cd frontend
npm install react-router
```

- `react-dom` **no se toca**: dibuja React en el navegador. El router se suma aparte.
- `react-router` y no `react-router-dom`: desde la v7 son el mismo paquete (`-dom` quedo como alias).
- Trae sus propios tipos, no hace falta `@types/...`.

Correr (dos terminales): `cd backend && npm run dev` · `cd frontend && npm run dev`.

---

## 2. Que hace React Router

Cambia de pantalla **sin recargar la pagina**: intercepta los `<Link>`, cambia la URL con la History
API y decide que componente renderizar segun esa URL.

| Pieza | Para que |
|---|---|
| `createBrowserRouter([...])` + `<RouterProvider>` | Define el arbol de rutas en un solo archivo |
| `children` + `<Outlet />` | Rutas anidadas: el padre (Layout) dibuja a la hija donde esta el Outlet |
| `index: true` | Hija que se muestra en la URL exacta del padre |
| `path: "*"` | 404 |
| `<Link to>` | Navegar sin recargar (nunca `<a href>` para rutas internas) |
| `useNavigate()` | Navegar desde codigo (despues de un login, logout) |
| `<Navigate to replace />` | Redirigir dentro del render (guards) |
| `loader: () => redirect()` | Redirigir antes de renderizar (redirecciones fijas) |
| `useParams()` | Leer `:id` de la URL → `/students/:id` |

### Rutas actuales

| Ruta | Acceso | Layout |
|---|---|---|
| `/login`, `/register` | Publica | No (pantalla completa) |
| `/` | Redirige a `/login` | — |
| `/home`, `/students/:id` | Publica | Si |
| `/perfil` | Privada (cualquier usuario logueado) | Si |
| `/admin`, `/admin/sesiones` | Privada por perfil (solo `ADMIN`) | Si |
| `*` | 404 | Si |

---

## 3. Como se usa el contexto (sesion)

El JWT esta en una cookie `httpOnly`: JS no puede leerla. El front pregunta al backend con
`GET /auth/me` y guarda el resultado en un **Context** para que cualquier componente lo lea.

```
AuthProvider (main.tsx, envuelve al router)
 ├─ al montar: GET /auth/me → user | null, loading = false
 ├─ interceptor axios: cualquier 401 → user = null (refreshToken vencido)
 └─ expone { user, loading, login, logout }

useAuth()  ← lo usan Layout, ProtectedRoute, Login, Register, Profile
```

`ProtectedRoute` lee `useAuth()` y decide:

```
loading           → "Verificando sesion..."
sin user          → <Navigate to="/login" state={{ from }} />   (vuelve despues del login)
rol no permitido  → "No tenes permisos"
ok                → <Outlet />
```

Uso en el router: `<ProtectedRoute />` (solo sesion) o `<ProtectedRoute roles={["ADMIN"]} />`.

**El front esconde, el back protege**: el guard es UX; la seguridad real es `authMiddleware` +
`requireRole` en cada endpoint.

`/register` crea siempre `USER`: el schema de Zod descarta cualquier `role` que mande el cliente y el
modelo tiene `default: "USER"`. Para tener un ADMIN se cambia a mano en la base:
`db.users.updateOne({ email: "..." }, { $set: { role: "ADMIN" } })` y se vuelve a loguear.

---

## 4. Estructura de carpetas

```
frontend/src/
├── main.tsx                 -> <AuthProvider> + <RouterProvider>
├── index.css                -> Tailwind + @theme
├── router/
│   ├── index.tsx            -> createBrowserRouter: todas las rutas
│   └── ProtectedRoute.tsx   -> guard de sesion y rol
├── auth/
│   ├── AuthContext.ts       -> createContext + tipo
│   ├── AuthProvider.tsx     -> carga /me, interceptor 401, login/logout
│   └── useAuth.ts           -> hook para leer la sesion
├── layouts/
│   └── Layout.tsx           -> header con logout + <Outlet />
├── pages/
│   ├── Login.tsx            -> /login
│   ├── Register.tsx         -> /register
│   ├── Home.tsx             -> /home (listado)
│   ├── StudentDetail.tsx    -> /students/:id (useParams)
│   ├── Profile.tsx          -> /perfil
│   ├── Admin.tsx            -> /admin
│   ├── Sessions.tsx         -> /admin/sesiones
│   └── NotFound.tsx         -> *
├── components/StudentCard.tsx
├── services/                -> auth.ts, students.ts (llamadas a la API)
├── lib/api.ts               -> axios con withCredentials
└── types/                   -> auth.ts, student.ts
```

Backend: se agrego `GET /auth/me` (`authMiddleware` + controller `me`).
