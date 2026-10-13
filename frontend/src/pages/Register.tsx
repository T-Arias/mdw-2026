// Ruta publica "/register". Crea el usuario (siempre USER) y abre la sesion con el mismo email/password.
import { useState, type SubmitEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import * as authService from "../services/auth";

export const Register = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.register({ name, email, password });
      await login({ email, password });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Fuera del Layout, igual que Login: arma su propio fondo de pantalla completa.
  return (
    <main className="flex min-h-screen items-center justify-center p-6 font-sans">
      <section className="panel w-full max-w-md p-8">
        <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">MDW</p>
        <h2 className="mt-2 font-serif text-4xl text-ink">Crear cuenta</h2>
        <p className="mt-2 mb-6 text-sm text-ink/60">El alta entra como usuario. El rol admin se asigna en la base.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
            Nombre
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field font-normal"
            />
          </label>
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
              minLength={8}
              autoComplete="new-password"
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
            {submitting ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/60">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-brand-700 underline decoration-brand-600/40">
            Ingresar
          </Link>
        </p>
      </section>
    </main>
  );
};
