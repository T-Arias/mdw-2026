// Presentacional: recibe un estudiante por props, no sabe nada de axios ni de estado.
// Toda la card es un <Link>: click en cualquier parte navega al detalle (/students/:id).
import { Link } from "react-router";
import type { Student } from "../types/student";

interface StudentCardProps {
  student: Student;
}

export const StudentCard = ({ student }: StudentCardProps) => {
  const initials = `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();

  return (
    <Link
      to={`/students/${student._id}`}
      className="panel block p-5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
    >
      <article>
        <div className="mb-4 flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 font-serif text-brand-700">
            {initials}
          </span>
          <span className={`text-xs font-medium ${student.active ? "text-emerald-700" : "text-ink/40"}`}>
            {student.active ? "Activo" : "Inactivo"}
          </span>
        </div>
        <h3 className="font-serif text-2xl leading-none text-ink">
          {student.lastName}, {student.firstName}
        </h3>
        <p className="mt-2 text-sm text-ink/60">{student.email}</p>
        <p className="mt-4 text-xs tracking-wide text-brand-700 uppercase">{student.career}</p>
      </article>
    </Link>
  );
};
