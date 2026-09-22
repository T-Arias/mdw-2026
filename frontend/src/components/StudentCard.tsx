// Presentacional: recibe un estudiante por props, no sabe nada de axios ni de estado.
import type { Student } from "../types/student";

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{student.career}</span>
        <span className={`text-xs ${student.active ? "text-green-600" : "text-slate-400"}`}>
          {student.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        {student.lastName}, {student.firstName}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{student.email}</p>
    </article>
  );
}
