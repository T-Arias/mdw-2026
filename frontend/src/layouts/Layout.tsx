// Layout generico: header con logout. Se monta una sola vez, al navegar solo cambia lo que renderiza <Outlet />.
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm transition ${
    isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-white hover:text-ink"
  }`;

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <NavLink
            to={user?.role === "ADMIN" ? "/admin" : "/home"}
            className="font-serif text-2xl tracking-tight text-ink"
          >
            Estudiantes
          </NavLink>
          <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            {user?.role !== "ADMIN" && (
              <NavLink to="/home" className={linkClass}>
                Inicio
              </NavLink>
            )}
            {user?.role === "USER" && (
              <NavLink to="/perfil" className={linkClass}>
                Mi ficha
              </NavLink>
            )}
            {user?.role === "ADMIN" && (
              <NavLink to="/admin" className={linkClass} end={false}>
                Admin
              </NavLink>
            )}
          </nav>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink/80 transition hover:border-ink/30"
            >
              Salir · {user.name}
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
