# Clase 14 — LLMs y LangChain I: un agente con tools

Sigue a `clase 13/README.md`. Se agrega al **mismo backend** un agente que responde preguntas en
lenguaje natural ("¿cuantos estudiantes activos hay en Sistemas?") consultando la base con **tools**.
El LLM corre en **Groq** y el loop del agente lo resuelve **LangChain**. La respuesta llega al front
por **Server-Sent Events (SSE)**: el texto aparece a medida que el modelo lo genera. La teoria esta en
`teoria.md`.

Versiones (noviembre 2026): langchain 1.6 · @langchain/core 1.3 · @langchain/groq 1.3 · zod 4.

---

## Roadmap: por donde pasa un mensaje

```
Frontend                          Backend (Express)
────────                          ─────────────────
pages/Chat.tsx
POST /api/v1/agent/chat ─proxy─▶  routes/index.ts            monta /agent
{ "message": "..." }              routes/agent.routes.ts     ① authMiddleware → ② validateBody(chatSchema)
                                  controllers/agent.controller.ts   ③ abre SSE (text/event-stream)
                                  agent/agent.ts             ④ streamAgent: createAgent + agent.stream()
                                     │
                                     ▼   loop ReAct (lo maneja LangChain)
                                  ┌──────────────────────────────────────────────┐
                                  │ ⑤ agent/llm.ts → Groq: "¿respondo o uso tool?" │
                                  │        │ pide tool_call                        │
                                  │        ▼                                       │
                                  │ ⑥ agent/tools/*.tools.ts → Zod valida args     │
                                  │        → services/*.service.ts → MongoDB       │
                                  │        │ resultado (JSON) como ToolMessage     │
                                  │        └──────────── vuelve a ⑤ ──────────────┘
                                  │ ⑦ el LLM responde texto sin tool_calls → fin   │
                                  └──────────────────────────────────────────────┘
lib/sse.ts lee el stream   ◀────  ⑧ por cada evento, res.write() (la respuesta sigue abierta):
  "Buscando estudiantes…"           event: tool   data: {"name":"list_students","args":{"active":true}}
  "Hay " "42 " "estudiantes"        event: token  data: {"text":"Hay "}   (uno por pedazo)
  fin                               event: done   data: {}               → res.end()
```

| Paso | Archivo | Responsabilidad |
|---|---|---|
| ① ② | `routes/agent.routes.ts` | Solo usuarios logueados; mensaje valido (1–1000 chars) |
| — | `schemas/agent.schema.ts` | Schema Zod del body |
| ③ ⑧ | `controllers/agent.controller.ts` | Abre el stream SSE y escribe un evento por cada cosa que pasa |
| ④ | `agent/agent.ts` | Arma el agente y traduce lo que emite LangChain a eventos `token` / `tool` |
| — | `frontend/src/lib/sse.ts` | Lee el body como stream y lo corta en eventos |
| — | `frontend/src/pages/Chat.tsx` | La pantalla: muestra el texto a medida que llega |
| ⑤ | `agent/llm.ts` | El modelo de Groq (`ChatGroq`) |
| — | `agent/prompts.ts` | System prompt: rol, reglas, limites |
| ⑥ | `agent/tools/` | Lo que el agente **puede hacer**: una tool por accion; las de escritura chequean rol |
| — | `agent/context.ts` | El usuario logueado que reciben las tools (`runtime.context`) |
| ⑥ | `services/` | La logica de negocio: filtros, paginacion, acceso a Mongo |

### La capa service: una sola fuente de verdad

La API REST y el agente son **dos puertas de entrada** a la misma logica:

```
HTTP → route → controller ──┐
                            ├──▶ services/students.service.ts ──▶ Model ──▶ Mongo
LLM  → agent → tool ────────┘
```

| Capa | Sabe de | No sabe de |
|---|---|---|
| `controllers/` | `req`, `res`, status HTTP | Mongo, LLMs |
| `agent/tools/` | Formato para el LLM (texto/JSON, campos minimos) | HTTP, Mongo |
| `services/` | Reglas de negocio, filtros, Mongoose | HTTP, LLMs |

Si mañana se agrega un filtro en `buildFilter`, aparece **a la vez** en la API y en el agente. La
tool **no** llama al endpoint por HTTP: seria un salto de red contra uno mismo, habria que reenviar
la cookie de sesion y se duplicaria la autenticacion.

La validacion de input sigue en el borde de cada puerta: `validateBody` en la ruta, el schema Zod
en la tool, `isValidObjectId` en ambos. El service recibe datos ya validados. La tool reutiliza el
schema de la API (`listStudentsSchema.parse(...)`) para completar `page`, `sortBy`, etc.

Estructura nueva:

```
backend/
├── scripts/agent-check.ts        prueba el loop sin Groq (modelo falso)
└── src/
    ├── agent/                    todo lo que es IA vive aca
    │   ├── llm.ts                PASO 1: el modelo
    │   ├── prompts.ts            PASO 2: las instrucciones
    │   ├── tools/                PASO 3: las capacidades
    │   │   ├── students.tools.ts listar, traer por id, crear, eliminar
    │   │   ├── subjects.tools.ts
    │   │   └── index.ts
    │   ├── context.ts            el usuario logueado para las tools + isAdmin
    │   └── agent.ts              PASO 4: modelo + prompt + tools
    ├── services/                 logica compartida por controllers y tools
    │   ├── students.service.ts
    │   └── subjects.service.ts
    ├── controllers/agent.controller.ts   PASO 5
    │   (students/subjects.controller.ts ahora solo hacen HTTP y llaman al service)
    ├── routes/agent.routes.ts            PASO 6
    ├── schemas/agent.schema.ts
    ├── types/pagination.types.ts `Paginated<T>`: lo que devuelven los list del service
    ├── lib/escape-regex.ts       lo usan los services
    └── lib/is-duplicate-key-error.ts   error 11000 de Mongo (subjects.controller + tools)

frontend/src/
├── lib/sse.ts                    lee un stream SSE sobre fetch (POST)
├── pages/Chat.tsx                pantalla del asistente
├── router/index.tsx              + ruta privada /chat
└── layouts/Layout.tsx            + link "Asistente" en el header
```

`agent/` no importa nada de Express y los controllers no importan nada de LangChain: si mañana se
cambia Groq por otro proveedor, solo se toca `agent/llm.ts`.

---

## 1. Groq: la API key

1. Entrar a <https://console.groq.com/keys> (login con GitHub) → **Create API Key**.
2. Copiarla en `backend/.env`:

```bash
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b   # opcional, es el default
```

Groq tiene plan gratuito con rate limit (requests y tokens por minuto). Alcanza para la clase. El
modelo tiene que soportar **tool calling**: ver la lista en <https://console.groq.com/docs/tool-use>.

La key **solo** va en el backend. Si estuviera en el front, cualquiera la copia del bundle.

---

## 2. Dependencias

```bash
cd backend
npm install langchain @langchain/core @langchain/groq
```

| Paquete | Para que |
|---|---|
| `langchain` | `createAgent` (el loop) y `tool` (definir tools) |
| `@langchain/core` | Tipos base: mensajes, runnables. Lo usan los otros dos |
| `@langchain/groq` | `ChatGroq`: el adaptador para hablar con Groq |

Cada proveedor tiene su paquete (`@langchain/openai`, `@langchain/anthropic`, ...) con la misma
interfaz. Cambiar de proveedor = cambiar el import de `llm.ts`.

---

## 3. PASO 1 — El modelo: `src/agent/llm.ts`

```ts
import { ChatGroq } from "@langchain/groq";

const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

export const llm = new ChatGroq({ model: MODEL, temperature: 0, streaming: true });
```

- `temperature: 0` → respuestas deterministas. Para elegir tools y argumentos no queremos creatividad.
- `streaming: true` → Groq manda la respuesta token por token, no toda junta al final.
- Se crea **al arrancar el server**. Si falta `GROQ_API_KEY`, `ChatGroq` tira error y el server no
  levanta: mejor enterarse al arrancar que en el primer mensaje de un usuario.

---

## 4. PASO 2 — El prompt: `src/agent/prompts.ts`

El **system prompt** es el primer mensaje de cada llamada al LLM. Esta dividido en secciones con
etiquetas tipo XML:

| Etiqueta | Que define |
|---|---|
| `<rol>` | Quien es, para quien trabaja, idioma y formato general |
| `<datos>` | De donde salen los datos (solo de las tools), usar `total`, sin memoria |
| `<acciones>` | Politica de **escritura**: agregar y eliminar solo si se pide explicitamente |
| `<formato>` | Campos en español, sin nombres tecnicos ni ids |
| `<alcance>` | Que responder ante "¿que podes hacer?" y ante preguntas fuera de tema |

Criterios (guias de prompting de [OpenAI](https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide)
y [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)):

- **Secciones con delimitadores** (XML o titulos Markdown): el modelo distingue tipos de instruccion,
  y quien lo edita sabe donde tocar cada comportamiento.
- **Las tools no se describen en el prompt**: LangChain ya manda nombre, descripcion y schema de cada
  una en el campo `tools` del request. Por eso `<acciones>` no lista "buscar estudiantes": solo la
  politica de agregar y eliminar, que la tool sola no puede expresar.
- **Reglas con su porque** ("usa `total`: las herramientas devuelven como maximo 20"): el modelo
  generaliza mejor que con una orden suelta.
- **Corto y sin contradicciones**: va en cada vuelta del loop (se paga en tokens), y si dos reglas
  chocan el modelo suele seguir la de mas abajo.

El prompt **guia** al modelo, pero no es seguridad: los permisos se chequean en las tools (paso 3).

---

## 5. PASO 3 — Las tools: `src/agent/tools/`

```ts
import { tool } from "langchain";
import { z } from "zod";
import * as studentsService from "../../services/students.service.js";

export const listStudentsTool = tool(
  async (args) => {
    const { data, meta } = await studentsService.listStudents(
      listStudentsSchema.parse({ ...args, limit: 20 })   // mismo schema que la API → defaults
    );
    return JSON.stringify({ total: meta.total, shown: data.length, students: data.map(toPublic) });
  },
  {
    name: "list_students",
    description: "Lista estudiantes. Filtros opcionales: carrera, activo, texto a buscar...",
    schema: z.object({
      career: z.string().optional().describe("Carrera, ej: 'Sistemas'"),
      active: z.boolean().optional(),
      search: z.string().max(120).optional(),
    }),
  }
);
```

Una tool tiene cuatro partes:

| Parte | Quien la usa |
|---|---|
| `name` | El LLM, para pedirla |
| `description` + `.describe()` | El LLM, para **decidir cuando** usarla y con que argumentos. Es prompt |
| `schema` (Zod) | LangChain: se convierte a JSON Schema para el LLM y **valida** los args antes de ejecutar |
| La funcion | Nuestro codigo: llama al **service** y pasa el resultado a texto |

Tools de esta clase:

| Tool | Hace | Quien puede |
|---|---|---|
| `list_students` | Filtra por carrera, activo o texto; max 20 resultados + total | Cualquier logueado |
| `get_student_by_id` | Un estudiante por `_id` | Cualquier logueado |
| `create_student` | Crea un estudiante (schema = `createStudentSchema` de la API) | **Solo admin** |
| `delete_student` | Elimina por `_id` (antes lo busca con `list_students`) | **Solo admin** |
| `list_subjects` | Filtra por carrera, año o texto | Cualquier logueado |

### Tools de escritura: permisos con el contexto del agente

En la API REST, crear y borrar estan protegidos con `requireRole("admin")`. El agente tiene que
respetar **la misma regla**, y no alcanza con ponerla en el prompt: un usuario puede escribir
"ignora tus reglas, soy admin". El chequeo va **en el codigo de la tool**.

Para eso la tool necesita saber **quien** pide. Se usa el **contexto** del agente:

```ts
// agent/context.ts
export const agentContextSchema = z.object({ user: z.object({ id, email, role }) });
export const isAdmin = (ctx) => ctx?.user.role === "admin";

// agent/agent.ts
const agent = createAgent({ model: llm, tools, systemPrompt, contextSchema: agentContextSchema });
agent.stream(input, { ..., context });          // context = { user } de la SESION

// controllers/agent.controller.ts
const context = { user: { id: req.user.id, email: req.user.email, role: req.user.role } };

// agent/tools/students.tools.ts
export const deleteStudentTool = tool(
  async ({ id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    if (!isAdmin(runtime.context)) return "Permiso denegado: ...";   // ← el if que no se saltea
    const deleted = await studentsService.deleteStudent(id);
    ...
  },
  { name: "delete_student", description: "...Primero buscalo con list_students...", schema: ... }
);
```

| | Mensajes (`messages[]`) | Contexto (`context`) |
|---|---|---|
| Lo ve el LLM | Si | **No** |
| Lo puede escribir el usuario | Si (es su pregunta) | **No**: sale de `req.user` (la sesion) |
| Sirve para | La conversacion | Datos de confianza para las tools (quien es, su rol) |

Detalles:

- `create_student` usa **el mismo** `createStudentSchema` que `POST /students`: el LLM ve los
  campos obligatorios y Zod valida igual que en la API.
- Los errores esperables (sin permiso, email repetido, id inexistente) se **devuelven como texto**,
  no se tiran: el LLM los lee y se los explica al usuario. Solo los inesperados (Mongo caido) se
  tiran y terminan en `event: error`.
- `delete_student` pide el **id**, no el nombre: obliga al modelo a buscar primero
  (`list_students` → `delete_student`, dos tools encadenadas). Si hay dos "Ana", la descripcion le
  dice que no borre y pregunte.
- Limitacion: el chat **no tiene memoria**, asi que si el asistente pregunta "¿cual de las dos
  Ana?", la respuesta tiene que volver a decir todo ("borra a Ana Perez, ana@mail.com").

Las reglas de clases anteriores (filtro **campo por campo**, `escapeRegex`) viven en el service, asi
que la tool las hereda sin repetirlas. Lo unico propio de la tool es `toPublic`: devolverle al modelo
solo los campos necesarios (menos tokens, nada interno).

Para agregar una tool: crearla en `tools/` y sumarla al array de `tools/index.ts`.

---

## 6. PASO 4 — El agente: `src/agent/agent.ts`

```ts
import { createAgent } from "langchain";

const agent = createAgent({ model: llm, tools, systemPrompt: SYSTEM_PROMPT });

export async function* streamAgent(message: string, signal: AbortSignal): AsyncGenerator<AgentEvent> {
  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: ["messages", "updates"], recursionLimit: 10, signal }
  );

  for await (const [mode, payload] of stream) {
    if (mode === "messages") {                              // un TOKEN del modelo
      const [chunk] = payload;
      if (chunk.type === "ai" && chunk.text) yield { type: "token", text: chunk.text };
      continue;
    }
    for (const update of Object.values(payload))            // un MENSAJE COMPLETO de un paso
      for (const msg of update.messages ?? [])
        for (const call of msg.tool_calls ?? [])            // el modelo pidio una tool
          yield { type: "tool", name: call.name, args: call.args };
  }
}
```

- `createAgent` arma el loop **ReAct**: LLM → tool → LLM → ... hasta que responde sin pedir tools.
- `agent.stream` en vez de `agent.invoke`: mismo loop, pero entrega cada pedazo **apenas existe**.
  Con `invoke` habria que esperar el loop entero y recibir la respuesta toda junta.
- **Dos modos de streaming a la vez**, cada item llega como `[modo, payload]`:

  | Modo | Que emite | Lo usamos para |
  |---|---|---|
  | `"messages"` | Cada **token** apenas el modelo lo genera | Mostrar el texto en vivo |
  | `"updates"` | Cada **mensaje completo** cuando termina un paso del loop | Saber que tool pidio y **con que args** |

  Con `"messages"` solo, los args de una tool llegan en pedazos de JSON (`{"act`, `ive":tr`...): no
  sirven hasta que termina. `"updates"` los trae completos y ya parseados.
- `async function*` (async generator): devuelve los eventos de a uno con `yield`; quien llama los
  consume con `for await`. El agente **no sabe nada de SSE**: solo emite `AgentEvent`s.
- `recursionLimit` corta el loop si el modelo entra en bucle (cada vuelta cuesta tokens).
- `signal`: si el usuario cancela o cierra la pestaña, se corta tambien la llamada a Groq.

---

## 7. PASO 5 y 6 — Controller, schema y ruta

`src/schemas/agent.schema.ts`:

```ts
export const chatSchema = z.object({ message: z.string().trim().min(1).max(1000) });
```

`src/routes/agent.routes.ts`:

```ts
router.post("/chat", authMiddleware, validateBody(chatSchema), chat);
```

`src/routes/index.ts`:

```ts
router.use("/agent", agentRouter);
```

`authMiddleware` **obligatorio**: cada mensaje consume cuota de Groq. Un endpoint de LLM abierto es una
invitacion a que te vacien el plan.

### El controller: respuesta SSE

```ts
export async function chat(req, res) {
  const abort = new AbortController();
  res.on("close", () => abort.abort());          // el usuario se fue → cortar el agente

  res.writeHead(200, {
    "Content-Type": "text/event-stream",          // esto es lo que hace que sea SSE
    "Cache-Control": "no-cache, no-transform",    // ningun proxy guarda ni comprime
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",                    // proxies tipo nginx: no acumular
  });
  res.flushHeaders();                             // mandar los headers YA, sin esperar el body

  try {
    for await (const event of streamAgent(req.body.message, abort.signal)) {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    }
    res.write(`event: done\ndata: {}\n\n`);
  } catch (error) {
    if (!abort.signal.aborted) res.write(`event: error\ndata: {"message":"El asistente no pudo responder"}\n\n`);
  } finally {
    res.end();
  }
}
```

Eventos que manda:

| Evento | `data` | Cuando |
|---|---|---|
| `tool` | `{ "name": "list_students", "args": { "active": true } }` | El modelo pidio una tool (el front muestra "Buscando estudiantes…" y la agrega a "Tools usadas") |
| `token` | `{ "text": "Hay 42" }` | Un pedazo de la respuesta final |
| `done` | `{}` | Termino bien |
| `error` | `{ "message": "..." }` | Algo fallo **despues** de abrir el stream |

**Ojo con los errores**: una vez que se mandaron los headers, el status ya es `200` y no se puede
cambiar. Por eso los errores del agente viajan como evento `error`. Los que pasan **antes** (sesion
`401`, mensaje invalido `400`) siguen siendo JSON normal, porque los cortan los middlewares de la
ruta antes de llegar al controller: el front tiene que chequear `response.ok` antes de leer el stream.

---

## 8. Frontend: leer el stream

### `src/lib/sse.ts`

No se usa `EventSource` (la API nativa de SSE del navegador) porque **solo hace GET**: no hay forma
de mandar el mensaje en el body. En su lugar: `fetch` con `POST` y se lee `response.body`, que es un
`ReadableStream`.

```ts
export async function readSSE(response: Response, onEvent: (e: SSEEvent) => void) {
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;

    buffer += value;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";        // lo ultimo puede estar incompleto

    for (const part of parts) {
      // parsear "event: ..." y "data: ..." → onEvent({ event, data: JSON.parse(data) })
    }
  }
}
```

Lo importante: **un pedazo de red no es un evento**. TCP puede entregar medio evento, o tres juntos,
o cortar una "ñ" a la mitad. Por eso se acumula en `buffer` y solo se procesa lo que ya tiene su
`\n\n` de cierre. `TextDecoderStream` se encarga de no romper caracteres UTF-8 partidos.

### `src/pages/Chat.tsx`

Ruta privada `/chat` (link "Asistente" en el header).

```ts
type ChatMessage = { role: "user" | "assistant"; text: string; tools: ToolCall[] };

setMessages((prev) => [...prev, { role: "user", text, tools: [] }, { role: "assistant", text: "", tools: [] }]);

const response = await fetch("/api/v1/agent/chat", { method: "POST", body, signal: abort.signal, ... });
if (!response.ok) throw new Error(...);      // 401 / 400: JSON normal, no hay stream

await readSSE(response, ({ event, data }) => {
  if (event === "tool") {
    setStatus(TOOL_LABELS[data.name]);                                  // "Buscando estudiantes…"
    updateAssistant((m) => ({ ...m, tools: [...m.tools, data] }));      // "Tools usadas"
  }
  if (event === "token") updateAssistant((m) => ({ ...m, text: m.text + data.text }));  // el texto crece
  if (event === "error") setError(data.message);
});
```

- El mensaje del asistente arranca vacio y cada `token` le **concatena** texto (sin mutar el array:
  `prev.map(...)` con spread).
- **Tools usadas**: arriba de cada respuesta se listan las tools que pidio el agente con sus args,
  ej: `list_students({"active":true})`. Sirve para ver **de donde salio** la respuesta: si dice
  "hay 42" pero no aparece ninguna tool, el modelo invento el dato.
- Boton **Cancelar**: `abort.abort()` corta el `fetch` → el backend recibe `close` → corta el agente.
- **No usa RTK Query**: RTK Query modela "un request → una respuesta". Aca un request trae muchos
  eventos, y no hay nada que cachear.
- Cada pregunta es **independiente**: el backend no guarda historial (eso viene con memoria en la
  clase 15).
- **Markdown**: los LLMs responden en Markdown (`**negrita**`, listas). Se renderiza con
  `react-markdown` (`npm install react-markdown`), que convierte a elementos React y **no**
  interpreta HTML crudo: si el modelo devuelve `<script>`, se muestra como texto. Nunca usar
  `dangerouslySetInnerHTML` con la salida de un LLM: es texto que, indirectamente, escribio el
  usuario. Como Tailwind resetea listas y margenes, los estilos se reponen con variantes
  `[&_ul]:list-disc`, `[&_strong]:font-semibold`, etc.
- **Tablas**: no son Markdown basico sino una extension de GitHub (GFM). Sin el plugin, la tabla se
  muestra como un parrafo con todos los `|` en una linea. Se activa con `remark-gfm`
  (`npm install remark-gfm`) → `<Markdown remarkPlugins={[remarkGfm]}>`. Tambien suma `~~tachado~~`
  y checklists. La burbuja tiene `overflow-x-auto` para que una tabla ancha scrollee en el celular.

---

## 9. Trazado con logs: seguir un mensaje de punta a punta

Cada capa loguea con el numero del roadmap. Abrir la consola del navegador **y** la terminal del
backend lado a lado, mandar "¿Cuantos estudiantes activos hay?" y leer de arriba a abajo:

**Navegador** (DevTools → Console):

```
[chat] input del usuario: "¿Cuantos estudiantes activos hay?"
[chat] POST /api/v1/agent/chat (el proxy /api lo manda al backend)
[chat] respuesta: 200 text/event-stream
[chat] SSE tool  {name: 'list_students', args: {active: true}}
[chat] SSE token {type: 'token', text: 'Hay'}
[chat] SSE token {type: 'token', text: ' 42'}
...
[chat] SSE done  {}
[chat] output final (2350 ms): Hay 42 estudiantes activos.
```

**Backend** (terminal de `npm run dev`):

```
[⑤ llm] Groq listo: model=openai/gpt-oss-20b streaming=true        ← al arrancar

[① route] POST /api/v1/agent/chat body={"message":"¿Cuantos estudiantes activos hay?"}
[③ controller] mensaje de ana@mail.com: "¿Cuantos estudiantes activos hay?"
[③ controller] stream SSE abierto (200 text/event-stream)
[④ agent] arranca el loop con: "¿Cuantos estudiantes activos hay?"
[④ agent] vuelta 1: termino el nodo "model_request"                 ← el LLM decidio
[④ agent] el LLM pide la tool "list_students" con args {"active":true}
[③ controller] → SSE event: tool {"type":"tool","name":"list_students","args":{"active":true}}
[⑥ tool] list_students args (ya validados por Zod): {"active":true}
[⑥ service] students.find filtro Mongo: {"active":true} page=1 limit=20
[⑥ tool] list_students → 20 de 42 estudiantes
[④ agent] vuelta 2: termino el nodo "tools"
[④ agent] resultado de "list_students" → vuelve al LLM: {"total":42,"shown":20,...
[④ agent] vuelta 3: termino el nodo "model_request"                 ← el LLM respondio
[④ agent] el LLM respondio texto, sin pedir tools
[④ agent] fin del loop en 3 vueltas
[③ controller] → SSE event: done (12 tokens en 2310 ms)
[③ controller] respuesta final:
Hay 42 estudiantes activos.
```

(El orden exacto puede variar un poco: los tokens viajan mientras el loop sigue.) Lo que se ve:

- ② no loguea: si falta sesion o el mensaje es invalido, el trazado **se corta** despues de ① con
  un 401/400, y nunca llega a ③.
- La vuelta 1 y la 3 son el **mismo** nodo `model_request`: es el loop ReAct volviendo al LLM con
  el resultado de la tool.
- `[⑥ service]` tambien aparece cuando se usa la API REST (`QUERY /students`): es la misma funcion.

Los `console.log` son para la clase: en produccion se reemplazan por un logger con niveles
(`pino`, `winston`) y no se loguean mensajes de usuarios ni emails.

---

## 10. Probar

### Sin Groq (verifica tools + Mongo)

```bash
npm run agent:check
# [agent-check] OK: list_students devolvio N estudiantes activos
```

Usa `FakeToolCallingModel` de LangChain: un modelo falso que "decide" llamar a `list_students`.
Sirve para separar "¿anda mi tool?" de "¿el LLM la eligio bien?".

### Con Groq

Loguearse en el front y entrar a **Asistente** (`/chat`).

Para ver los eventos crudos: DevTools → Network → el request `chat` → pestaña **EventStream**
(Chrome la muestra cuando el `Content-Type` es `text/event-stream`).

Con curl (copiar la cookie de sesion de DevTools → Application → Cookies). `-N` desactiva el buffer
de curl para ver los eventos a medida que llegan:

```bash
curl -N -X POST http://localhost:3000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=..." \
  -d '{"message":"¿Cuantos estudiantes activos hay?"}'
```

Preguntas para probar:

| Pregunta | Que deberia pasar |
|---|---|
| "¿Cuantos estudiantes activos hay?" | `list_students({ active: true })` |
| "Buscame a Ana" | `list_students({ search: "Ana" })` |
| "¿Que materias de 2do año hay en Sistemas?" | `list_subjects({ career: "Sistemas", year: 2 })` |
| "Agrega a Juan Gomez, juan@mail.com, Sistemas" (como **admin**) | `create_student({...})` → "Estudiante creado" |
| Lo mismo como **usuario comun** | `create_student` → "Permiso denegado" → el asistente lo explica |
| "Elimina a Juan Gomez" (como admin) | `list_students({ search: "Juan Gomez" })` → `delete_student({ id })` |
| "Elimina a Ana" con dos Ana en la base | `list_students` → **no** elimina: muestra las opciones |
| "Agrega a Pedro" (faltan datos) | No llama a la tool: pide email y carrera |
| "Cambia la carrera de Ana" | No hay tool de editar: responde que no puede |
| "Ayudame, ¿que puedo hacer?" | Sin tools: lista sus capacidades con un ejemplo cada una (regla del system prompt) |
| "¿Quien gano el mundial?" | Fuera de tema: lo rechaza (system prompt) |

### En Render

Agregar `GROQ_API_KEY` en **Environment** del Web Service del backend. El front ya llama a `/api/*`
por el rewrite. Verificar en produccion que el texto llegue **de a pedazos**: si aparece todo junto
al final, algun proxy en el medio esta acumulando la respuesta (para eso estan `no-transform` y
`X-Accel-Buffering: no`). Igual funciona: solo se pierde el efecto de "escritura".

---

## Errores comunes

| Error | Causa |
|---|---|
| `Groq API key not found` y el server no arranca | Falta `GROQ_API_KEY` en `backend/.env` (o en Render) |
| El texto aparece todo junto al final | Un proxy acumula la respuesta, o falta `res.flushHeaders()` |
| `Unexpected token` al parsear en el front | Se hizo `JSON.parse` de un pedazo incompleto: hay que acumular hasta `\n\n` |
| Se usa `EventSource` y no manda el mensaje | `EventSource` solo hace GET: usar `fetch` + `getReader()` |
| `401` en `/agent/chat` | No hay sesion: loguearse primero |
| `429` de Groq en el log | Rate limit del plan gratuito: esperar un minuto |
| `model ... does not support tools` / `decommissioned` | Cambiar `GROQ_MODEL` por uno con tool calling |
| `Recursion limit of 10 reached` | El modelo entro en bucle: revisar descripciones de las tools |
| `Tool call validation failed: ... expected boolean, but got null` | El modelo manda `null` en los filtros que no usa y Groq valida contra el schema **en su servidor**. Los opcionales de las tools van con `.nullish()` y se limpian con `withoutNulls` antes del service |
| El modelo inventa datos | Reforzar en el prompt "usa SIEMPRE las tools" y revisar las descripciones |
