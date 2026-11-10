// Ruta privada: chat con el agente (clase 14). La respuesta llega por SSE: el texto aparece a medida
// que el modelo lo genera, y mientras corre una tool se muestra que esta consultando.
// No usa RTK Query: RTK Query espera UNA respuesta por request, y aca llegan muchos eventos.
import { useRef, useState, type FormEvent } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readSSE } from "../lib/sse";

// El modelo responde en Markdown (**negrita**, listas). react-markdown lo convierte a elementos React
// y NO interpreta HTML crudo: si el modelo devolviera <script>, se muestra como texto (sin XSS).
// Tailwind resetea listas y margenes (preflight), por eso se reponen aca con variantes [&_tag].
const MARKDOWN_STYLES =
  "[&_p:not(:last-child)]:mb-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_strong]:font-semibold [&_code]:rounded [&_code]:bg-slate-200 [&_code]:px-1 [&_a]:underline " +
  // Tablas (necesitan remark-gfm): bordes, padding y encabezado marcado.
  "[&_table]:my-2 [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-slate-300 " +
  "[&_th]:bg-slate-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top";

// tools: que tools pidio el agente para armar ESTA respuesta (llegan por el evento SSE "tool").
type ToolCall = { name: string; args: Record<string, unknown> };
type ChatMessage = { role: "user" | "assistant"; text: string; tools: ToolCall[] };

// Nombre tecnico de la tool → lo que ve el usuario.
const TOOL_LABELS: Record<string, string> = {
  list_students: "Buscando estudiantes…",
  get_student_by_id: "Buscando el estudiante…",
  create_student: "Creando el estudiante…",
  delete_student: "Eliminando el estudiante…",
  list_subjects: "Buscando materias…",
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loading = status !== null;

  // Actualiza el ultimo mensaje (el del asistente) sin mutar el array.
  const updateAssistant = (update: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? update(m) : m)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setError(null);
    setStatus("Pensando…");
    // El mensaje del asistente arranca vacio y se va llenando con cada evento "token".
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message, tools: [] },
      { role: "assistant", text: "", tools: [] },
    ]);

    const abort = new AbortController();
    abortRef.current = abort;
    const startedAt = performance.now();
    let reply = "";
    console.log(`[chat] input del usuario: "${message}"`);

    try {
      console.log("[chat] POST /api/v1/agent/chat (el proxy /api lo manda al backend)");
      const response = await fetch("/api/v1/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: abort.signal,
      });
      console.log(`[chat] respuesta: ${response.status} ${response.headers.get("content-type")}`);

      // Auth (401) y validacion (400) fallan ANTES de abrir el stream: llegan como JSON normal.
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${response.status}`);
      }

      await readSSE(response, ({ event, data }) => {
        // Un log por evento SSE: se ven los tokens llegar de a uno.
        console.log(`[chat] SSE ${event}`, data);
        const payload = data as { text?: string; name?: string; args?: ToolCall["args"]; message?: string };
        if (event === "tool" && payload.name) {
          const call: ToolCall = { name: payload.name, args: payload.args ?? {} };
          setStatus(TOOL_LABELS[call.name] ?? "Consultando…");
          updateAssistant((m) => ({ ...m, tools: [...m.tools, call] }));
        }
        if (event === "token" && payload.text) {
          const text = payload.text;
          reply += text;
          setStatus(null);
          updateAssistant((m) => ({ ...m, text: m.text + text }));
        }
        if (event === "error") setError(payload.message ?? "El asistente no pudo responder");
      });
      console.log(`[chat] output final (${Math.round(performance.now() - startedAt)} ms):\n${reply}`);
    } catch (err) {
      if (abort.signal.aborted) console.log("[chat] cancelado por el usuario");
      else {
        console.error("[chat] error:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    } finally {
      setStatus(null);
      abortRef.current = null;
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Asistente</h2>
      <p className="text-sm text-slate-500">
        Pregunta sobre estudiantes y materias. Cada pregunta es independiente: no recuerda las anteriores.
      </p>

      <ul className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <li key={i} className="self-end rounded-lg bg-brand-600 px-3 py-2 text-white">
              {m.text}
            </li>
          ) : (
            <li key={i} className="flex max-w-full flex-col gap-1 self-start">
              {/* Las tools aparecen ANTES del texto: el agente primero consulta y despues responde. */}
              {m.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  <span>Tools usadas:</span>
                  {m.tools.map((t, j) => (
                    <code
                      key={j}
                      title={`El agente llamo a ${t.name} con estos argumentos`}
                      className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-700"
                    >
                      {t.name}({Object.keys(t.args).length ? JSON.stringify(t.args) : ""})
                    </code>
                  ))}
                </div>
              )}
              {/* overflow-x-auto: una tabla ancha scrollea adentro de la burbuja en el celular */}
              <div className={`max-w-full overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-slate-900 ${MARKDOWN_STYLES}`}>
                {m.text ? (
                  // Se re-renderiza con cada token: el Markdown a medio llegar (ej: "**Nomb") se ve
                  // como texto plano un instante y se corrige cuando llega el cierre.
                  // remarkGfm: suma lo de GitHub que no es Markdown basico (tablas, ~~tachado~~, checklists).
                  <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                ) : (
                  loading && i === messages.length - 1 && "…"
                )}
              </div>
            </li>
          )
        )}
      </ul>

      {status && <p className="text-sm italic text-slate-500">{status}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Mensaje
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="¿Cuantos estudiantes activos hay?"
          className="flex-1 rounded border border-slate-300 px-3 py-2 focus:border-brand-600 focus:outline-none"
        />
        {loading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Enviar
          </button>
        )}
      </form>
    </section>
  );
};
