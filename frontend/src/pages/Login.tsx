// Formulario controlado con useState (React Hook Form + Zod llega en la Clase 10).
import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import type { UserRole } from "../types/auth";

function homeFor(role: UserRole, from: string): string {
  if (from !== "/home" && from !== "/login" && from !== "/register") return from;
  return role === "ADMIN" ? "/admin" : "/perfil";
}

export const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ProtectedRoute deja en state la ruta que se queria visitar.
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/home";

  if (user) {
    return <Navigate to={homeFor(user.role, from)} replace />;
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const sessionUser = await login({ email, password });
      navigate(homeFor(sessionUser.role, from), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Fuera del Layout: la pagina arma su propio fondo de pantalla completa.
  return (
    <main className="flex min-h-screen items-center justify-center p-6 font-sans">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">MDW</p>
        <h2 className="mt-2 font-serif text-4xl text-ink">Iniciar sesión</h2>
        <p className="mt-2 mb-6 text-sm text-ink/60">Entrá con el email y la contraseña de tu cuenta.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field font-normal"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field font-normal"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className="btn mt-1">
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/60">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-brand-700 underline decoration-brand-600/40">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
};
