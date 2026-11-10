// Lector de Server-Sent Events sobre fetch.
// No usamos EventSource (la API nativa de SSE) porque solo hace GET: no permite mandar el mensaje
// en el body. Con fetch hacemos POST y leemos el body como stream, pedazo a pedazo.
//
// Formato que llega del backend (cada evento termina en una linea en blanco):
//   event: token
//   data: {"type":"token","text":"Hola"}
//
export interface SSEEvent {
  event: string;
  data: unknown;
}

export async function readSSE(response: Response, onEvent: (e: SSEEvent) => void): Promise<void> {
  if (!response.body) throw new Error("La respuesta no tiene body");

  // TextDecoderStream: bytes → texto. stream: true internamente, asi un caracter UTF-8 partido
  // entre dos pedazos (ej: la "ñ") no se rompe.
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;

    // Un pedazo de la red NO es un evento: puede traer medio evento o tres juntos.
    // Se acumula y se procesa solo lo que ya tiene su "\n\n" de cierre.
    buffer += value;
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? ""; // lo ultimo puede estar incompleto: queda para la proxima vuelta

    for (const part of parts) {
      let event = "message";
      let data = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) onEvent({ event, data: JSON.parse(data) });
    }
  }
}
