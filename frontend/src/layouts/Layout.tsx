// Layout generico: header con logout. Se monta una sola vez, al navegar solo cambia lo que renderiza <Outlet />.
import { Outlet, useNavigate } from "react-router";
import * as authService from "../services/auth";
import { useAppDispatch, useAppSelector } from "../store";
import { loggedOut, selectUser } from "../store/authSlice";

export const Layout = () => {
  const user = useAppSelector(selectUser);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Aunque falle el request, se cierra la sesion local (igual que el `finally` del AuthProvider).
  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      dispatch(loggedOut());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-brand-600 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Estudiantes</h1>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Salir ({user.name})
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
};
