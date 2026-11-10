// Los modelos suelen mandar null (o "") en los parametros opcionales que no quieren usar:
// { career: null, active: null, search: "" }.
// Groq valida el pedido contra el JSON Schema en SU servidor: si el schema dice .optional() (puede
// faltar pero no ser null) o .min(1), rechaza la llamada antes de que llegue a nuestro codigo.
// Por eso los filtros opcionales de las tools son .nullish() sin min(1), y aca se descartan los
// vacios antes de pasarlos a los schemas de la API (que usan .optional() y .min(1)).
type Cleaned<T> = { [K in keyof T]?: Exclude<T[K], null> };

export function withoutNulls<T extends Record<string, unknown>>(args: T): Cleaned<T> {
  const isEmpty = (value: unknown) => value === null || value === undefined || value === "";
  return Object.fromEntries(Object.entries(args).filter(([, value]) => !isEmpty(value))) as Cleaned<T>;
}
