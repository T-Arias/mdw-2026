// PASO 1 — El modelo (el "cerebro").
// ChatGroq habla con la API de Groq. Lee GROQ_API_KEY del entorno (si falta, tira error y el server
// no arranca). temperature 0: respuestas deterministas, lo que queremos para elegir tools.
// streaming: true → Groq manda la respuesta token por token en vez de toda junta al final.
import { ChatGroq } from "@langchain/groq";

// El mas barato de Groq con tool calling (nov 2026: $0.075 / $0.30 por millon de tokens) y disponible
// en el plan gratuito. Se puede cambiar con GROQ_MODEL sin tocar codigo.
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

export const llm = new ChatGroq({ model: MODEL, temperature: 0, streaming: true });

console.log(`[⑤ llm] Groq listo: model=${MODEL} streaming=true`);
