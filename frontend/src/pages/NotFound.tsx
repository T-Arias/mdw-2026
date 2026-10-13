import { Link } from "react-router";

export const NotFound = () => {
  return (
    <section className="panel mx-auto max-w-lg px-8 py-12 text-center">
      <p className="font-serif text-7xl text-brand-700">404</p>
      <h2 className="mt-2 font-serif text-3xl text-ink">Página no encontrada</h2>
      <Link to="/home" className="mt-4 inline-block text-sm text-brand-700 underline">
        Volver al inicio
      </Link>
    </section>
  );
};
