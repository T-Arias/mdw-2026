# Clase 2 — Rama y commits sugeridos

Sigue a `clase 1/README.md`. Ahora el foco es Git: como armar una rama de feature y partir los
cambios de esta clase en commits chicos y logicos en vez de un commit gigante con todo junto.

---

## Nombre de rama

```bash
git checkout -b feat/students-crud-query-versioning
```

`checkout -b` crea la rama y te para en ella en un solo paso. El nombre sigue el patron
`<tipo>/<que-hace>`: es un feature (`feat/`) que cubre el CRUD de students, el endpoint con
`QUERY` y el versionado de la API.

---

## Commits

La idea es que cada commit se pueda leer solo y cuente una parte del cambio. `git add` con
archivos puntuales (no `git add .`) para no mezclar cosas sin querer.

### 1) Dependencia de Mongo

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add mongoose dependency"
```

Instala `mongoose` y agrega `MONGODB_URI` como variable de entorno esperada en `.env.example`.

### 2) Traducir la conexion a Mongo

```bash
git add "src/config/db.ts"
git commit -m "refactor: translate MongoDB connection helpers to English"
```

Renombra `conectarMongoDB`/`desconectarMongoDB`/`obtenerMongoUri` a ingles (`connectMongoDB`,
`disconnectMongoDB`, `getMongoUri`) y traduce los mensajes de log/error, sin cambiar el
comportamiento.

### 3) CRUD de students en ingles + endpoint QUERY

```bash
git add "src/models/Student.ts" "src/controllers/students.controller.ts" "src/routes/students.routes.ts"
git commit -m "feat: replace projects CRUD with English students CRUD using HTTP QUERY"
```

Reemplaza el scope de "proyectos" por "students", todo el codigo en ingles, y cambia el listado
(`GET` all) por el metodo `QUERY`, que recibe filtros (`career`, `active`, `search`), paginacion
(`page`, `limit`) y orden (`sortBy`, `sortOrder`) por body en vez de query string.

### 4) Conectar Mongo, parsear JSON y versionar la API

```bash
git add "src/server.ts" "src/routes/index.ts"
git commit -m "feat: wire Mongo connection, JSON body parsing and /api/v1 versioning"
```

`server.ts` ahora conecta a Mongo antes de levantar el server (`startServer`), agrega
`express.json()` para poder leer el body, y monta todas las rutas bajo `/api/v1` a traves de un
router agregador (`src/routes/index.ts`) para poder sumar `/api/v2` el dia que haga falta romper
compatibilidad.

---

## Ver el resultado

```bash
git log --oneline
git diff main..feat/students-crud-query-versioning --stat
```

`git log --oneline` muestra el historial compacto rama por rama. `git diff <base>..<rama> --stat`
lista que archivos cambiaron entre la rama base y la actual, sin el contenido linea por linea.
