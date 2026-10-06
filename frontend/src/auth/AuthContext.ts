// Separado del Provider: un .tsx que exporta componentes y no-componentes rompe el Fast Refresh de Vite.
import { createContext } from "react";
import type { LoginCredentials, User } from "../types/auth";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
