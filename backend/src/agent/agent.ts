// PASO 4 — El agente: modelo + prompt + tools.
// createAgent arma el loop ReAct (Reason + Act) que antes habia que escribir a mano:
//   1. manda los mensajes al LLM
//   2. si el LLM pide una tool → la ejecuta y agrega el resultado como ToolMessage
//   3. vuelve a 1 hasta que el LLM responde texto sin pedir tools
import { createAgent, type BaseMessage } from "langchain";
import { llm } from "./llm.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { tools } from "./tools/index.js";
import { AgentContext, agentContextSchema } from "./context.js";

// Lo que el agente le cuenta al controller mientras trabaja. No sabe nada de SSE ni de HTTP:
// el controller decide como mandarlo (aca, como eventos SSE).
export type AgentEvent =
  | { type: "token"; text: string } // un pedazo de la respuesta final
  | { type: "tool"; name: string; args: Record<string, unknown> }; // el modelo pidio esta tool con estos args

// contextSchema: el agente acepta un contexto (el usuario logueado) que llega a cada tool en
// runtime.context. No va en los mensajes: el LLM no lo ve ni lo puede falsificar.
const agent = createAgent({ model: llm, tools, systemPrompt: SYSTEM_PROMPT, contextSchema: agentContextSchema });

// Para el log: los resultados de las tools pueden ser JSON largos.
const preview = (text: string, max = 200) => (text.length > max ? `${text.slice(0, max)}… (${text.length} chars)` : text);

// async generator: en vez de devolver la respuesta entera al final, va entregando eventos
// a medida que llegan (for await ... of del lado de quien llama).
export async function* streamAgent(
  message: string,
  context: AgentContext,
  signal: AbortSignal
): AsyncGenerator<AgentEvent> {
  console.log(`[④ agent] arranca el loop con: "${message}" (usuario ${context.user.email}, rol ${context.user.role})`);

  // Dos modos de streaming a la vez; cada item llega como [modo, payload]:
  //   "messages" → cada TOKEN apenas lo genera el modelo        → para mostrar el texto en vivo
  //   "updates"  → cada MENSAJE COMPLETO al terminar un paso    → para saber que tools pidio y con que args
  //               (con "messages" los args de una tool llegan en pedazos de JSON: no sirven a medias)
  // recursionLimit corta el loop si el modelo se queda llamando tools sin parar.
  // signal: si el usuario cierra la pestaña, se corta la llamada a Groq (no pagamos tokens de mas).
  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: ["messages", "updates"], recursionLimit: 10, signal, context }
  );

  let step = 0;

  for await (const [mode, payload] of stream) {
    if (mode === "messages") {
      const [chunk] = payload as [BaseMessage, unknown];
      // Solo el texto del modelo va al usuario. Los ToolMessage (resultado crudo) los lee el modelo.
      if (chunk.type === "ai" && chunk.text) yield { type: "token", text: chunk.text };
      continue;
    }

    // "updates": { nombreDelNodo: { messages: [...] } } cada vez que termina un nodo del loop.
    for (const [node, update] of Object.entries(payload as Record<string, { messages?: BaseMessage[] }>)) {
      step++;
      console.log(`[④ agent] vuelta ${step}: termino el nodo "${node}"`);

      for (const msg of update?.messages ?? []) {
        if (msg.type === "ai") {
          const calls = "tool_calls" in msg && Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
          if (!calls.length) console.log("[④ agent] el LLM respondio texto, sin pedir tools");
          for (const call of calls) {
            console.log(`[④ agent] el LLM pide la tool "${call.name}" con args ${JSON.stringify(call.args)}`);
            yield { type: "tool", name: call.name, args: call.args };
          }
        }
        if (msg.type === "tool") {
          console.log(`[④ agent] resultado de "${msg.name}" → vuelve al LLM: ${preview(msg.text)}`);
        }
      }
    }
  }

  console.log(`[④ agent] fin del loop en ${step} vueltas`);
}
