// RTK Query: estado del SERVIDOR (estudiantes). Reemplaza a services/students.ts + los useEffect/useState
// de cada pagina (ver clase 11/sin-redux). Cada endpoint genera un hook con cache incluida.
import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import { api as http, getErrorMessage } from "../lib/api";
import type { StudentFormValues } from "../schemas/student.schema";
import type { Paginated, Student } from "../types/student";

// Usa la misma instancia de axios: mantiene withCredentials y el interceptor 401 de main.tsx.
// El error se guarda ya como string, listo para mostrar.
const axiosBaseQuery: BaseQueryFn<AxiosRequestConfig, unknown, string> = async (config) => {
  try {
    const { data } = await http.request(config);
    return { data };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
};

export const studentsApi = createApi({
  reducerPath: "studentsApi",
  baseQuery: axiosBaseQuery,
  // Las queries "proveen" el tag y las mutations lo "invalidan" -> RTK Query vuelve a pedir solo.
  tagTypes: ["Students"],
  endpoints: (build) => ({
    // El listado usa el metodo QUERY (filtros en el body).
    getStudents: build.query<Student[], void>({
      query: () => ({ url: "/students", method: "QUERY", data: { sortBy: "lastName", sortOrder: "asc" } }),
      transformResponse: (response: Paginated<Student>) => response.data,
      providesTags: ["Students"],
    }),
    // GET /students/:id devuelve el estudiante sin envelope (400 si el id es invalido, 404 si no existe).
    getStudentById: build.query<Student, string>({
      query: (id) => ({ url: `/students/${id}` }),
      providesTags: ["Students"],
    }),
    createStudent: build.mutation<Student, StudentFormValues>({
      query: (data) => ({ url: "/students", method: "POST", data }),
      invalidatesTags: ["Students"],
    }),
    updateStudent: build.mutation<Student, { id: string; values: StudentFormValues }>({
      query: ({ id, values }) => ({ url: `/students/${id}`, method: "PUT", data: values }),
      invalidatesTags: ["Students"],
    }),
    deleteStudent: build.mutation<void, string>({
      query: (id) => ({ url: `/students/${id}`, method: "DELETE" }),
      invalidatesTags: ["Students"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
