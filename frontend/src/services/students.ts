import { api } from "../lib/api";
import type { Paginated, Student } from "../types/student";

// El listado usa el metodo QUERY (filtros en el body). axios lo soporta nativo: api.query(url, body).
export async function getStudents(): Promise<Student[]> {
  const { data } = await api.query<Paginated<Student>>("/students", { sortBy: "lastName", sortOrder: "asc" });
  return data.data;
}
