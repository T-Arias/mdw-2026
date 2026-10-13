import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ roles, redirectTo = "/home" }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="text-slate-500">Verificando sesion...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
