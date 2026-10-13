import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";

export const Login = () => {
  const { user, login } = useAuth();
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

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (credentials: LoginFormValues) => {
    try {
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError("root.server", { message: getErrorMessage(err) });
    }
  };
  console.log("render")

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      <section className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Iniciar sesion</h2>
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
            {isSubmitting ? "Ingresando..." : "Ingresar"}
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
