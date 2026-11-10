// Mongo tira el codigo 11000 cuando se viola un indice unique (ej: email o codigo repetido).
// Lo usan subjects.controller.ts y las tools del agente.
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}
