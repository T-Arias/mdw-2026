// Layout generico: header con logout. Se monta una sola vez, al navegar solo cambia lo que renderiza <Outlet />.
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
