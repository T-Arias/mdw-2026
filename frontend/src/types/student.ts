// Misma forma que IStudent en el backend (backend/src/models/Student.ts). El JSON no trae tipos: los declaramos a mano.
export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  career: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Envelope de los listados paginados del backend: { data, meta }.
export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
