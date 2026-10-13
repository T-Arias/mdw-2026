// Ruta privada. El estudiante ve su ficha. El admin no usa esta pantalla: vuelve a /admin.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import { getStudents } from "../services/students";
import type { Student } from "../types/student";

export const Profile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role === "ADMIN") return;

    const loadOwnStudent = async () => {
      try {
        const students = await getStudents();
        const own = students.find((item) => item.email.toLowerCase() === user.email.toLowerCase()) ?? null;
        setStudent(own);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadOwnStudent();
  }, [user]);

  if (!user) return null;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <section className="panel max-w-xl p-8">
      <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">Tu ficha</p>
      <div className="mt-5 flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 font-serif text-2xl text-brand-700">
          {student
            ? `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase()
            : initials}
        </span>
        <div>
          <h2 className="font-serif text-4xl text-ink">
            {student ? `${student.lastName}, ${student.firstName}` : user.name}
          </h2>
          <p className="text-ink/60">{user.email}</p>
        </div>
      </div>

      {loading && <p className="mt-6 text-ink/50">Buscando tu ficha...</p>}
      {error && <p className="mt-6 text-red-700">{error}</p>}

      {!loading && !error && student && (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
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
        </dl>
      )}

      {!loading && !error && student && (
        <Link
          to={`/students/${student._id}`}
          className="mt-6 inline-block text-sm font-medium text-brand-700 underline"
        >
          Ver el detalle completo
        </Link>
      )}

      {!loading && !error && !student && (
        <p className="mt-6 text-ink/60">
          Tu cuenta no tiene una ficha de estudiante con el email {user.email}.
        </p>
      )}
    </section>
  );
};
