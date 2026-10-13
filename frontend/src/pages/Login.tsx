// Formulario controlado con useState (React Hook Form + Zod llega en la Clase 10).
import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";

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
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Fuera del Layout: la pagina arma su propio fondo de pantalla completa.
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      <section className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Iniciar sesion</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-slate-900 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          ¿No tenes cuenta?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
};
