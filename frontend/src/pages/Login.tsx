import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { authClient, signIn, useSession } from "../lib/auth-client";

export const Login = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/home";
  const oauthError = new URLSearchParams(location.search).get("error");
  const mustLinkGithub = oauthError === "account_not_linked";

  // !isSubmitting: mientras onSubmit sigue (ej. vinculando GitHub) no rebotar a /home por la sesion nueva.
  if (session && !isSubmitting) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (credentials: LoginFormValues) => {
    // Better Auth no tira excepcion: devuelve { data, error }. Si sale bien setea la cookie y useSession se entera.
    const { error } = await signIn.email(credentials);
    if (error) {
      setError("root.server", { message: error.message ?? "No se pudo iniciar sesion" });
      return;
    }
    if (mustLinkGithub) {
      // La contraseña prueba que la cuenta es suya: recien ahora es seguro vincular GitHub.
      // Redirige a GitHub y vuelve ya vinculado; desde ahi "Entrar con GitHub" funciona directo.
      const { error: linkError } = await authClient.linkSocial({ provider: "github", callbackURL: from });
      if (linkError) setError("root.server", { message: linkError.message ?? "No se pudo vincular GitHub" });
      return;
    }
    navigate(from, { replace: true });
  };

  // OAuth: redirige a GitHub; al volver, Better Auth crea la sesion y manda al callbackURL.
  // Si falla, vuelve a /login?error=<codigo> en vez de la pagina de error generica de Better Auth.
  const handleGithub = () =>
    signIn.social({ provider: "github", callbackURL: from, errorCallbackURL: "/login" });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      <section className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Iniciar sesion</h2>
        {oauthError && (
          <p role="alert" className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
            {mustLinkGithub
              ? "Ya tenes una cuenta con ese email. Ingresa tu contraseña para vincular GitHub."
              : "No se pudo iniciar sesion con GitHub."}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
              className="rounded border border-slate-300 px-3 py-2 aria-invalid:border-red-500"
            />
            {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
              className="rounded border border-slate-300 px-3 py-2 aria-invalid:border-red-500"
            />
            {errors.password && (
              <span className="text-xs text-red-600">{errors.password.message}</span>
            )}
          </label>
          {errors.root?.server && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.server.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-slate-900 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? "Ingresando..." : mustLinkGithub ? "Ingresar y vincular GitHub" : "Ingresar"}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
        </div>
        <button
          type="button"
          onClick={handleGithub}
          className="w-full rounded border border-slate-300 py-2 font-medium text-slate-900 transition hover:bg-slate-100"
        >
          Entrar con GitHub
        </button>
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
