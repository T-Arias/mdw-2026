import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../lib/auth-client";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ roles, redirectTo = "/home" }: ProtectedRouteProps) => {
  // isPending reemplaza al viejo `checking`: true hasta que responde /api/auth/get-session.
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return <p className="text-slate-500">Verificando sesion...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(session.user.role as UserRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
