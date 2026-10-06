import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { api } from "../lib/api";
import * as authService from "../services/auth";
import type { LoginCredentials, User } from "../types/auth";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionUser = await authService.getMe();
        setUser(sessionUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    const handleResponseError = async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
      }
      throw error;
    };

    const interceptorId = api.interceptors.response.use(undefined, handleResponseError);

    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setUser(await authService.login(credentials));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return <AuthContext value={{ user, loading, login, logout }}>{children}</AuthContext>;
};
