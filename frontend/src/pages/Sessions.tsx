// Ruta privada por perfil: solo admin, hereda el guard de su rama (/admin/*).
// Todo sale del plugin admin de Better Auth: no hay codigo propio en el backend para esto.
// La demo de la clase: revocar la sesion de otro navegador y ver que queda deslogueado.
// Con el JWT de las clases 4 y 5 era imposible: el token seguia valiendo hasta vencer.
import { useEffect, useState } from "react";
import { authClient, useSession } from "../lib/auth-client";

type AdminUser = { id: string; name: string; email: string; role?: string | null };
type UserSession = { token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date };

export const Sessions = () => {
  const { data: current } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessions, setSessions] = useState<Record<string, UserSession[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient.admin.listUsers({ query: { limit: 50 } }).then(({ data, error }) => {
      if (error) setError(error.message ?? "No se pudieron cargar los usuarios");
      else setUsers(data.users);
    });
  }, []);

  const loadSessions = async (userId: string) => {
    const { data, error } = await authClient.admin.listUserSessions({ userId });
    if (error) return setError(error.message ?? "No se pudieron cargar las sesiones");
    setSessions((prev) => ({ ...prev, [userId]: data.sessions }));
  };

  // Borra la sesion de la base: el proximo request de ese navegador ya no esta autenticado.
  const revoke = async (userId: string, sessionToken: string) => {
    const { error } = await authClient.admin.revokeUserSession({ sessionToken });
    if (error) return setError(error.message ?? "No se pudo revocar la sesion");
    await loadSessions(userId);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Sesiones</h2>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {users.map((user) => (
          <li key={user.id} className="rounded border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-900">
                {user.name} <span className="text-sm text-slate-500">({user.email} · {user.role})</span>
              </span>
              <button
                type="button"
                onClick={() => loadSessions(user.id)}
                className="rounded px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Ver sesiones
              </button>
            </div>
            {sessions[user.id]?.length === 0 && <p className="mt-2 text-sm text-slate-500">Sin sesiones activas.</p>}
            <ul className="mt-2 flex flex-col gap-1">
              {sessions[user.id]?.map((s) => (
                <li key={s.token} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span className="truncate">
                    {new Date(s.createdAt).toLocaleString()} · {s.userAgent ?? "navegador desconocido"}
                    {s.token === current?.session.token && " (esta sesion)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => revoke(user.id, s.token)}
                    className="rounded px-2 py-0.5 text-red-600 hover:bg-red-50"
                  >
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
};
