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
    return <p className="text-slate-500">Cargando estudiante...</p>;
  }

  if (error || !student) {
    return (
      <section>
        <p className="text-red-600">No se pudo cargar el estudiante: {error}</p>
        <Link to="/home" className="mt-2 inline-block text-slate-600 underline">
          Volver al listado
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <Link to="/home" className="text-sm text-slate-500 underline">
        Volver al listado
      </Link>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
        {student.lastName}, {student.firstName}
      </h2>
      <p className="text-slate-600">{student.email}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">Carrera</dt>
        <dd className="text-slate-900">{student.career}</dd>
        <dt className="text-slate-500">Estado</dt>
        <dd className={student.active ? "text-green-600" : "text-slate-400"}>
          {student.active ? "Activo" : "Inactivo"}
        </dd>
        <dt className="text-slate-500">Alta</dt>
        <dd className="text-slate-900">
          {new Date(student.createdAt).toLocaleDateString("es-AR")}
        </dd>
      </dl>
    </section>
  );
};
