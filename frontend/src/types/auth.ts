// Misma forma que devuelve el backend en /auth/login y /auth/me (sin password).
export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Sin `role`: el backend siempre crea USER (Zod descarta campos extra y el modelo tiene default "USER").
export interface RegisterData extends LoginCredentials {
  name: string;
}
