// Ruta privada por perfil: solo ADMIN, hereda el guard de su rama (/admin/*).
export const Sessions = () => {
  return (
    <section className="panel max-w-xl p-8">
      <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">Rol ADMIN</p>
      <h2 className="mt-2 font-serif text-4xl text-ink">Sesiones</h2>
      <p className="mt-3 text-ink/60">Solo visible para usuarios con rol ADMIN.</p>
    </section>
  );
};
