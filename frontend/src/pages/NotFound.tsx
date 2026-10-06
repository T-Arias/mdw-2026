import { Link } from "react-router";

export const NotFound = () => {
  return (
    <section className="text-center">
      <h2 className="text-2xl font-semibold text-slate-900">404 — Pagina no encontrada</h2>
      <Link to="/home" className="mt-2 inline-block text-slate-600 underline">
        Volver al inicio
      </Link>
    </section>
  );
};
