import { api } from "../lib/api";
import type { StudentFormValues } from "../schemas/student.schema";
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

export const createStudent = async (student: StudentFormValues): Promise<Student> => {
  const { data } = await api.post<Student>("/students", student);
  return data;
};

export const updateStudent = async (id: string, student: StudentFormValues): Promise<Student> => {
  const { data } = await api.put<Student>(`/students/${id}`, student);
  return data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await api.delete(`/students/${id}`);
};
