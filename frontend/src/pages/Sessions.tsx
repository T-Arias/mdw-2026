// Ruta privada por perfil: solo ADMIN, hereda el guard de su rama (/admin/*).
export const Sessions = () => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Sesiones</h2>
      <p className="text-slate-600">Solo visible para usuarios con rol ADMIN.</p>
    </section>
  );
};
