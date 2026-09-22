// Page: una vista completa (en la Clase 9 va a ser una ruta). Pide los datos y compone components.
import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/api";
import { getStudents } from "../services/students";
import type { Student } from "../types/student";
import { StudentCard } from "../components/StudentCard";

export function Home() {
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
    return <p className="text-slate-500">Cargando estudiantes...</p>;
  }

  if (error) {
    return <p className="text-red-600">No se pudieron cargar los estudiantes: {error}</p>;
  }

  if (students.length === 0) {
    return <p className="text-slate-500">Todavia no hay estudiantes cargados.</p>;
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((student) => (
        <StudentCard key={student._id} student={student} />
      ))}
    </section>
  );
}
