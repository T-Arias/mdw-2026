import { api } from "../lib/api";
import type { Paginated, Student } from "../types/student";

// El listado usa el metodo QUERY (filtros en el body). axios lo soporta nativo: api.query(url, body).
export const getStudents = async (): Promise<Student[]> => {
  const { data } = await api.query<Paginated<Student>>("/students", {
    sortBy: "lastName",
    sortOrder: "asc",
  });
  return data.data;
};

// GET /students/:id devuelve el estudiante sin envelope (400 si el id es invalido, 404 si no existe).
export const getStudentById = async (id: string): Promise<Student> => {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
};
