// Page: ruta publica "/students/:id". El id sale de la URL con useParams.
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../lib/api";
import { useGetStudentByIdQuery } from "../store/api";

export const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  // Cada id es una entrada distinta en la cache. skipToken = no pedir nada si no hay id.
  const { data: student, isLoading, error } = useGetStudentByIdQuery(id ?? skipToken);

  if (isLoading) {
    return <p className="text-slate-500">Cargando estudiante...</p>;
  }

  if (error || !student) {
    return (
      <section>
        <p className="text-red-600">No se pudo cargar el estudiante: {getErrorMessage(error)}</p>
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
