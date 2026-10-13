// Ruta privada por perfil: solo ADMIN. El ABM real llega en la Clase 10.
import { Link } from "react-router";

export const Admin = () => {
  return (
    <section className="panel max-w-xl p-8">
      <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">Rol ADMIN</p>
      <h2 className="mt-2 font-serif text-4xl text-ink">Panel de administración</h2>
      <p className="mt-3 text-ink/60">Solo visible para usuarios con rol ADMIN.</p>
      <Link to="/admin/sesiones" className="mt-6 inline-block text-sm font-medium text-brand-700 underline">
        Ver sesiones
      </Link>
    </section>
  );
};
