// Page: ruta publica "/students/:id". El id sale de la URL con useParams.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../lib/api";
import { getStudentById } from "../services/students";
import type { Student } from "../types/student";

export const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentById(id);
        setStudent(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  if (loading) {
    return <p className="text-ink/50">Cargando estudiante...</p>;
  }

  if (error || !student) {
    return (
      <section className="panel p-6">
        <p className="text-red-700">No se pudo cargar el estudiante: {error}</p>
        <Link to="/home" className="mt-3 inline-block text-sm text-brand-700 underline">
          Volver al listado
        </Link>
      </section>
    );
  }

  const initials = `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();

  return (
    <section className="panel p-8">
      <Link to="/home" className="text-sm text-brand-700 underline decoration-brand-600/40">
        Volver al listado
      </Link>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 font-serif text-2xl text-brand-700">
          {initials}
        </span>
        <div>
          <h2 className="font-serif text-4xl text-ink">
            {student.lastName}, {student.firstName}
          </h2>
          <p className="text-ink/60">{student.email}</p>
        </div>
      </div>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs tracking-wide text-ink/45 uppercase">Carrera</dt>
          <dd className="mt-1 text-ink">{student.career}</dd>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs tracking-wide text-ink/45 uppercase">Estado</dt>
          <dd className={`mt-1 ${student.active ? "text-emerald-700" : "text-ink/45"}`}>
            {student.active ? "Activo" : "Inactivo"}
          </dd>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3">
          <dt className="text-xs tracking-wide text-ink/45 uppercase">Alta</dt>
          <dd className="mt-1 text-ink">{new Date(student.createdAt).toLocaleDateString("es-AR")}</dd>
        </div>
      </dl>
    </section>
  );
};
