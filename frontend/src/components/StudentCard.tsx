// Presentacional: recibe un estudiante por props, no sabe nada de axios ni de estado.
// Toda la card es un <Link>: click en cualquier parte navega al detalle (/students/:id).
import { Link } from "react-router";
import type { Student } from "../types/student";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => {
  return (
    <Link
      to={`/students/${student._id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
    >
      <article>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
            {student.career}
          </span>
          <span className={`text-xs ${student.active ? "text-green-600" : "text-slate-400"}`}>
            {student.active ? "Activo" : "Inactivo"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          {student.lastName}, {student.firstName}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{student.email}</p>
        <p className="mt-3 text-xs text-slate-400">Ver detalle →</p>
      </article>
    </Link>
  );
};
