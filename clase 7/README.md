# Clase 7 — React fundamentos: setup del frontend

Sigue a `clase 3/README.md`. Hoy arranca el frontend de la materia: un proyecto Vite + React +
TypeScript en `frontend/`, con Tailwind CSS v4 y axios. La teoria de axios y Tailwind esta en
`teoria.md` (esta misma carpeta); el codigo de la clase esta en `frontend/src/`.

Versiones (septiembre 2026): Vite 8.3 · React 19.3 · axios 1.20 · Tailwind CSS 4.3 · Node 20.19+ o
22.12+ (lo exige Vite 8; verificar con `node -v`).

---

## 1. Comandos (en orden)

Desde la raiz del repo (`daw/`):

```bash
npx create-vite@latest frontend --template react-ts --no-immediate
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite
npm install axios
npm install --save-dev prettier prettier-plugin-tailwindcss
```

- `--template react-ts`: React + TypeScript, con `tsconfig` ya resuelto para el bundler.
- `--no-immediate`: no instala ni levanta el server solo; lo hacemos paso a paso.
- `npx create-vite` en vez de `npm create vite@latest frontend -- ...`: PowerShell a veces se come
  el `--` y el template se ignora.
- Tailwind v4 se engancha como plugin de Vite: **no hay `tailwind.config.js` ni PostCSS**.

Limpieza del template:

```bash
rm src/App.css
rm -r src/assets
```

Extension recomendada de VS Code: **Tailwind CSS IntelliSense**.

---

## 2. Archivos de setup

### `frontend/vite.config.ts` — sumar el plugin de Tailwind

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### `frontend/src/index.css` — reemplazar todo el contenido

```css
@import "tailwindcss";

/* Tokens propios: generan utilidades como bg-brand-600, text-brand-50, font-sans */
@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --color-brand-50: oklch(97% 0.02 250);
  --color-brand-600: oklch(55% 0.2 250);
  --color-brand-700: oklch(48% 0.2 250);
}
```

`@theme` reemplaza al `tailwind.config.js` de v3 (ver `teoria.md` seccion 12).

### `frontend/.prettierrc`

```json
{
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/index.css"
}
```

`tailwindStylesheet` es obligatorio con Tailwind v4 para que el plugin reconozca las clases de `@theme`.

### `frontend/.env` (y una copia como `.env.example`)

```
VITE_API_URL=http://localhost:3000/api/v1
```

Vite solo expone al navegador las variables con prefijo `VITE_`. Crear el archivo desde el editor:
`echo ... > .env` en PowerShell 5.1 lo guarda en UTF-16 y Vite no lo lee.

---

## 3. Estructura de `frontend/src/`

```
src/
├── main.tsx              -> punto de entrada: createRoot().render(<App />)
├── App.tsx               -> layout general, monta la page
├── index.css             -> Tailwind + @theme
├── pages/                -> vistas completas: piden datos y componen components
│   └── Home.tsx
├── components/           -> piezas reutilizables: reciben todo por props, no llaman a la API
│   └── SubjectCard.tsx
├── services/subjects.ts  -> funciones que llaman a la API
├── lib/api.ts            -> instancia de axios (baseURL + cookies)
└── types/subject.ts      -> espejo de ISubject del backend
```

**pages vs components:** una *page* es una pantalla entera (en la Clase 9, con React Router, cada
page va a ser una ruta); es la que usa `useEffect`, llama a `services/` y maneja loading/error. Un
*component* es una pieza de UI que no sabe de donde vienen los datos: los recibe por props y se puede
reutilizar en cualquier page.

---

## 4. Correr el proyecto (dos terminales)

```bash
# Terminal 1 — backend (puerto 3000)
cd backend
npm run dev

# Terminal 2 — frontend (puerto 5173)
cd frontend
npm run dev
```

Abrir `http://localhost:5173`. Otros comandos del frontend:

```bash
npm run build      # tsc + build de produccion en dist/
npm run preview    # sirve dist/ localmente
npm run lint       # oxlint
npx prettier --write src
```

---

## 5. CORS: el error que va a aparecer

El listado de materias usa el metodo `QUERY`. El backend ya tiene `credentials: true`, pero el
paquete `cors` solo permite por defecto `GET, HEAD, PUT, PATCH, POST, DELETE`: el navegador rechaza
el preflight y la consola muestra un error de CORS (Postman nunca hace preflight, por eso no lo
vimos antes). Arreglo en `backend/src/server.ts`: sumar `methods` al `cors()`:

```ts
methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "QUERY"],
```

Checklist si sigue fallando:

1. `http://localhost:3000/health` responde.
2. `CORS_ORIGIN=http://localhost:5173` en `backend/.env` (sin barra final).
3. `credentials: true` en `cors()` **y** `withCredentials: true` en `frontend/src/lib/api.ts`.
4. Si se toco `.env`, reiniciar el backend.
