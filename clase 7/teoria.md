# Clase 7 — Teoria complementaria: axios y Tailwind CSS

**Programacion Web Full Stack — UAI 2026**

Complementa la teoria principal de la Clase 7 (secciones 1 a 10: SPA, Virtual DOM, Vite, componentes,
props, `useState`, `useEffect`, `useMemo`, `fetch`, CORS). Estas dos secciones cubren las dos librerias
que suma el frontend de la materia: **axios** como cliente HTTP y **Tailwind CSS v4** para estilos.

Versiones de referencia (septiembre 2026): Vite 8, React 19, axios 1.20, Tailwind CSS 4.3.

---

## Indice

11. axios: que agrega sobre `fetch`, instancias, errores, interceptores
12. Tailwind CSS v4: utility-first, instalacion como plugin de Vite, `@theme`, responsive y estados

---

## 11. axios: que agrega sobre `fetch`

### Que es

axios es una libreria de cliente HTTP que funciona igual en el navegador y en Node. Por debajo usa lo
que ofrece la plataforma (en el navegador, `XMLHttpRequest` por default, o `fetch` si se configura
`adapter: "fetch"`): no hace nada que `fetch` no pueda hacer, pero resuelve de fabrica varias cosas
que con `fetch` hay que escribir a mano en cada proyecto.

La seccion 9 de la teoria principal armo un `apiFetch<T>` sobre `fetch`: axios es, basicamente, esa
misma idea resuelta y mantenida por otros.

### Las diferencias que importan

| | `fetch` | axios |
|---|---|---|
| Status 4xx / 5xx | **No** rechaza la Promise: hay que chequear `response.ok` | Rechaza la Promise (lanza `AxiosError`) |
| Body JSON de la respuesta | `await response.json()` a mano | Ya parseado en `response.data` |
| Body JSON del request | `JSON.stringify(...)` + header `Content-Type` a mano | Se pasa el objeto, axios serializa y setea el header |
| URL base | Concatenar strings en cada llamada | `baseURL` en la instancia |
| Cookies cross-origin | `credentials: "include"` | `withCredentials: true` |
| Timeout | `AbortSignal.timeout(ms)` | `timeout: ms` |
| Logica comun a todos los requests | Envolver `fetch` en una funcion propia | Interceptores |

El punto mas importante es el primero: con `fetch`, un `404` o un `500` **entran por el `try`**, no por
el `catch`. Con axios, cualquier status fuera de 2xx entra por el `catch`, que es lo que uno espera
intuitivamente.

### Instancia: configurar una vez, usar en toda la app

En vez de usar el objeto `axios` global, se crea una **instancia** con la configuracion comun. Es el
mismo principio de "una unica fuente de verdad" que el backend aplico con `routes/index.ts` o con los
schemas de Zod:

```ts
// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:3000/api/v1
  withCredentials: true,
});
```

A partir de ahi, cada llamada usa rutas relativas y hereda la configuracion:

```ts
const { data } = await api.get<Subject>(`/subjects/${id}`);
await api.post("/subjects", { name: "Programacion Web", code: "PW1", ... });
await api.delete(`/subjects/${id}`);
```

La config pasada en cada request **pisa** la de la instancia (por ejemplo, un `timeout` distinto para
una sola llamada lenta).

### El metodo `QUERY`

El backend de la materia lista estudiantes y materias con el metodo HTTP `QUERY` (filtros en el body,
Clase 2). axios lo soporta de forma nativa, con la misma forma que `post`:

```ts
const { data } = await api.query<Paginated<Subject>>("/subjects", { year: 2, page: 1 });
```

`fetch` tambien lo permite (`method: "QUERY"`), pero al no ser un metodo "simple", el navegador
siempre hace un **preflight** `OPTIONS` antes: por eso el backend tiene que declararlo en
`cors({ methods: [...] })` (ver README, seccion 4).

### Genericos: tipar lo que devuelve la API

`api.get<T>()` tipa `response.data` como `T`. Igual que con `fetch`, **esto no valida nada en tiempo
de ejecucion**: TypeScript confia en lo que le decimos. Si el backend cambia la forma del JSON, el
error aparece recien al usarlo. (Validar la respuesta con Zod tambien en el frontend es posible, y se
retoma en la Clase 10.)

### Errores: `AxiosError`

Cuando un request falla, axios lanza un `AxiosError`. Hay tres casos distintos:

```ts
try {
  await api.get("/subjects/123");
} catch (err) {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      // 1. El servidor respondio con 4xx/5xx: el body esta en err.response.data
      console.log(err.response.status, err.response.data);
    } else if (err.request) {
      // 2. El request salio pero no hubo respuesta: backend caido, CORS bloqueado, timeout
    }
  } else {
    // 3. Error que no vino de axios (un bug nuestro)
  }
}
```

El caso 2 es el que aparece con CORS: el navegador bloquea la respuesta, asi que para JavaScript es
como si nunca hubiera llegado (`err.response` es `undefined` y `err.message` es `"Network Error"`). El
detalle real del problema solo se ve en la consola y en la pestaña Network.

`axios.isAxiosError(err)` es un *type guard*: dentro del `if`, TypeScript sabe que `err` es
`AxiosError` y habilita el autocompletado de `err.response`.

### Interceptores

Un interceptor es una funcion que corre **antes de cada request** o **despues de cada respuesta** de
una instancia. Es el equivalente frontend de un middleware de Express (Clase 3):

```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // sesion vencida: aca se podria llamar a /auth/refresh y reintentar
    }
    return Promise.reject(error);
  },
);
```

Hoy no se usan. Aparecen cuando la app tenga login (Clase 10) y haya que manejar el `401` del access
token vencido en un solo lugar, en vez de en cada componente.

### Cancelar requests

axios acepta el `AbortController` estandar del navegador:

```ts
useEffect(() => {
  const controller = new AbortController();
  api.get("/subjects", { signal: controller.signal });
  return () => controller.abort();
}, []);
```

Hoy `Home` no lo usa (el `useEffect` queda simple, con loading y error). Si el componente se desmonta
antes de que llegue la respuesta, el cleanup corta el request. Se retoma con routing (Clase 9), que es
cuando un componente se desmonta a mitad de un request de verdad.

### ¿Entonces `fetch` esta mal?

No. `fetch` es nativo, no suma dependencias y alcanza para muchos proyectos (varios frameworks modernos
lo usan directamente). axios se elige en la materia porque ahorra el boilerplate de errores y JSON, y
porque los interceptores simplifican el refresh de tokens mas adelante. Tambien conviene saber que en
la Clase 11 buena parte de estos requests pasan a **RTK Query**, que maneja cache, loading y error por
nosotros: axios queda como la capa que efectivamente hace el HTTP.

---

## 12. Tailwind CSS v4

### Que es "utility-first"

La forma tradicional de escribir CSS es inventar un nombre de clase por componente y definir sus
estilos en otro archivo:

```html
<article class="subject-card">...</article>
```
```css
.subject-card { padding: 1.25rem; border-radius: 0.75rem; background: white; }
```

Tailwind propone lo contrario: un catalogo de **clases utilitarias**, cada una con una sola
responsabilidad, que se combinan directamente en el markup:

```tsx
<article className="rounded-xl bg-white p-5">...</article>
```

| Clase | CSS que genera |
|---|---|
| `p-5` | `padding: 1.25rem` (escala de a `0.25rem`: `p-4` = `1rem`) |
| `rounded-xl` | `border-radius: 0.75rem` |
| `bg-white` | `background-color: #fff` |
| `text-slate-600` | color de texto de la paleta `slate`, tono 600 |
| `flex items-center justify-between` | flexbox con los items centrados y separados |
| `grid gap-4` | grid con `1rem` de separacion |

### Por que tiene sentido en React

- **No hay que inventar nombres**: la mitad del trabajo con CSS tradicional es decidir si algo se llama
  `card__header` o `card-title`.
- **El estilo vive con el componente**: `SubjectCard.tsx` contiene todo lo que define como se ve. En
  React el componente ya es la unidad de reutilizacion, asi que no hace falta una clase CSS reutilizable
  ademas.
- **No crece el CSS**: Tailwind genera solo las clases que efectivamente aparecen en el codigo. Un
  proyecto grande termina con unos pocos KB de CSS.
- **Sistema de diseño incluido**: espaciados, colores y tamaños salen de una escala fija, lo que evita
  tener `13px`, `14px` y `15px` repartidos por el proyecto.

La critica habitual es que el markup queda "sucio" con muchas clases. Es cierto; la respuesta de
Tailwind es que la solucion es extraer **componentes** (`<SubjectCard />`), no clases CSS.

### Que cambio en v4

Tailwind v4 (2025) reescribio el motor. Tres cambios importan para no confundirse con tutoriales viejos:

1. **No hay `tailwind.config.js`**. La configuracion se escribe en CSS, con `@theme`.
2. **No hace falta PostCSS ni `npx tailwindcss init`**. En un proyecto Vite se instala como plugin.
3. **No hay que declarar `content`**. Tailwind detecta solo que archivos escanear para encontrar
   clases (ignora lo que esta en `.gitignore`, como `node_modules`).

Si un tutorial muestra `@tailwind base; @tailwind components; @tailwind utilities;` o un
`tailwind.config.js` con `content: [...]`, es de la v3.

### Instalacion en Vite

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css */
@import "tailwindcss";
```

Tres pasos y listo. El plugin se integra con el dev server de Vite: al agregar una clase nueva en un
componente, el CSS se regenera y HMR (seccion 3) actualiza la pagina sin recargar.

### `@theme`: personalizar el sistema de diseño

Las variables que se declaran dentro de `@theme` hacen dos cosas: quedan disponibles como variables
CSS normales (`var(--color-brand-600)`) y **generan clases utilitarias** automaticamente:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, sans-serif;
  --color-brand-50: oklch(97% 0.02 250);
  --color-brand-600: oklch(55% 0.2 250);
}
```

Con eso ya existen `bg-brand-600`, `text-brand-50`, `border-brand-600`, etc. El prefijo del nombre
define la familia de utilidades: `--color-*` genera colores, `--font-*` fuentes, `--spacing-*`
espaciados, `--breakpoint-*` breakpoints.

`oklch()` es el formato de color que usa la paleta de Tailwind v4: a diferencia de hex o RGB, los
tonos con el mismo valor de luminosidad (`L`) se perciben igual de claros, lo que hace mas facil armar
escalas de un mismo color.

### Responsive: mobile-first

Tailwind es **mobile-first**: una clase sin prefijo aplica a todos los tamaños, y los prefijos aplican
**desde** ese ancho en adelante:

```tsx
<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

| Prefijo | Desde | Resultado en el ejemplo |
|---|---|---|
| (ninguno) | 0px | 1 columna (celular) |
| `sm:` | 640px | 2 columnas |
| `lg:` | 1024px | 3 columnas |

Es el equivalente a escribir `@media (min-width: 640px) { ... }` a mano.

### Estados: hover, focus, dark

Los estados se escriben con el mismo sistema de prefijos:

```tsx
<article className="shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
<button className="bg-brand-600 hover:bg-brand-700 focus-visible:outline-2 disabled:opacity-50">
<p className="text-slate-900 dark:text-slate-100">
```

`dark:` sigue por default la preferencia del sistema operativo (`prefers-color-scheme`). Se puede
cambiar a un toggle manual con `@custom-variant`, pero no hace falta hoy.

### Tooling

- **Tailwind CSS IntelliSense** (extension de VS Code): autocompleta clases, muestra el CSS que genera
  cada una al pasar el mouse y marca clases que no existen. Casi indispensable.
- **prettier-plugin-tailwindcss**: ordena las clases de forma consistente al formatear. En v4 necesita
  saber donde esta el CSS principal (`"tailwindStylesheet": "./src/index.css"` en `.prettierrc`) para
  reconocer las clases propias definidas con `@theme`.

### Cuando no escribir clases utilitarias

Tailwind no prohibe el CSS normal. Si un estilo se repite de forma identica en muchos lugares y no tiene
sentido como componente, se puede definir una utilidad propia en `index.css`:

```css
@utility card {
  @apply rounded-xl border border-slate-200 bg-white p-5 shadow-sm;
}
```

Usarlo con moderacion: si todo termina en `@utility`, se volvio a CSS tradicional con pasos extra.
