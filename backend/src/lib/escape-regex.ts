// Escapa metacaracteres de regex para que un texto de busqueda no pueda inyectar su propia regex
// (ReDoS o matches no deseados) en un filtro $regex. La usan los controllers y las tools del agente.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
