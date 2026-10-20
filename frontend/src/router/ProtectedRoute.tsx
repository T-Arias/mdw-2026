import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store";
import { selectChecking, selectUser } from "../store/authSlice";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ roles, redirectTo = "/home" }: ProtectedRouteProps) => {
  const user = useAppSelector(selectUser);
  const checking = useAppSelector(selectChecking);
  const location = useLocation();

  if (checking) {
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
