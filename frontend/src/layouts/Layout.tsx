// Layout generico: header con logout. Se monta una sola vez, al navegar solo cambia lo que renderiza <Outlet />.
import { Link, Outlet } from "react-router";
import { signOut, useSession } from "../lib/auth-client";

export const Layout = () => {
  const { data: session } = useSession();
  const user = session?.user;
  // signOut borra la sesion EN LA BASE (no solo la cookie).
  // Recarga completa en vez de navigate(): useSession refresca async, y con navigate() el Login
  // todavia ve la sesion vieja en cache y rebota a /home. La recarga tambien limpia el cache de RTK Query.
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      alert(error.message ?? "No se pudo cerrar sesion");
      return;
    }
    window.location.replace("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-brand-600 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Estudiantes</h1>
          {user && (
            <nav className="flex items-center gap-2">
              <Link to="/chat" className="rounded px-3 py-1.5 text-sm hover:bg-white/10">
                Asistente
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Salir ({user.name})
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
};
