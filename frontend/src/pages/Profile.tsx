// Ruta privada: cualquier usuario logueado. ProtectedRoute garantiza que user no es null.
import { useState } from "react";
import { authClient, useSession } from "../lib/auth-client";

export const Profile = () => {
  const { data: session } = useSession();
  const [linkError, setLinkError] = useState<string | null>(null);
  if (!session) return null;
  const { user } = session;

  // Link EXPLICITO: el usuario ya probo que es dueño de la cuenta local (esta logueado),
  // asi que Better Auth no exige emailVerified. Redirige a GitHub y vuelve aca con las cuentas unidas.
  const handleLinkGithub = async () => {
    const { error } = await authClient.linkSocial({ provider: "github", callbackURL: "/perfil" });
    if (error) setLinkError(error.message ?? "No se pudo conectar GitHub");
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
      <p className="text-slate-600">{user.email}</p>
      {user.image && <img src={user.image} alt="" className="mt-2 h-12 w-12 rounded-full" />}
      <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{user.role}</span>
      <button
        type="button"
        onClick={handleLinkGithub}
        className="mt-4 block rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
      >
        Conectar GitHub
      </button>
      {linkError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {linkError}
        </p>
      )}
    </section>
  );
};
