import { api } from "../lib/api";
import type { LoginCredentials, RegisterData, User } from "../types/auth";

// Los endpoints de auth usan el envelope { success, data }.
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const { data } = await api.post<ApiResponse<User>>("/auth/login", credentials);
  return data.data;
};

// Solo crea el usuario: no setea cookies, la sesion se abre despues con login.
export const register = async (registerData: RegisterData): Promise<User> => {
  const { data } = await api.post<ApiResponse<User>>("/auth/register", registerData);
  return data.data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>("/auth/me");
  return data.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};
