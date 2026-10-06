// Ruta privada: cualquier usuario logueado. ProtectedRoute garantiza que user no es null.
import { useAuth } from "../auth/useAuth";

export const Profile = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
      <p className="text-slate-600">{user.email}</p>
      <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{user.role}</span>
    </section>
  );
};
