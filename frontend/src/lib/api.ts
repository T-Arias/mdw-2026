import axios from "axios";

// withCredentials: true es la mitad frontend del contrato de cookies httpOnly.
// La otra mitad es cors({ credentials: true }) en el backend: hacen falta las dos.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Los errores del backend vienen como { error: "..." } o { error: { message } }.
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const error = err.response?.data?.error;
    return typeof error === "string" ? error : (error?.message ?? err.message);
  }
  return "Error desconocido";
};
