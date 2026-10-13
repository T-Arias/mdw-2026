// Page: ruta publica "/home". Pide los datos y compone components.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import { getStudents } from "../services/students";
import type { Student } from "../types/student";
import { StudentCard } from "../components/StudentCard";

export const Home = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // El callback de useEffect no puede ser async (devolveria una Promise en vez del cleanup):
  // se define una arrow async adentro y se la invoca.
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await getStudents();
        setStudents(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  if (loading) {
    return <p className="text-ink/50">Cargando estudiantes...</p>;
  }

  if (error) {
    return <p className="panel px-5 py-4 text-red-700">No se pudieron cargar los estudiantes: {error}</p>;
  }

  if (students.length === 0) {
    return (
      <section>
        <h2 className="font-serif text-4xl text-ink">Listado</h2>
        <p className="panel mt-6 px-5 py-8 text-ink/60">Todavía no hay estudiantes cargados.</p>
      </section>
    );
  }

  const ownStudent =
    user?.role === "USER"
      ? students.find((student) => student.email.toLowerCase() === user.email.toLowerCase())
      : undefined;

  return (
    <section>
      {ownStudent && (
        <Link to="/perfil" className="panel mb-8 block bg-brand-50 p-6">
          <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">Tu ficha</p>
          <h2 className="mt-1 font-serif text-3xl text-ink">
            {ownStudent.lastName}, {ownStudent.firstName}
          </h2>
          <p className="mt-1 text-sm text-ink/70">
            {ownStudent.career} · {ownStudent.active ? "Activo" : "Inactivo"}
          </p>
        </Link>
      )}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand-700 uppercase">Público</p>
          <h2 className="font-serif text-4xl text-ink">Listado</h2>
        </div>
        <p className="text-sm text-ink/50">{students.length} estudiantes</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <StudentCard key={student._id} student={student} />
        ))}
      </div>
    </section>
  );
};
