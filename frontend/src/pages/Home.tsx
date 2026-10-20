// Page: ruta publica "/home". Los datos salen de la cache de RTK Query: sin useEffect ni useState.
import { getErrorMessage } from "../lib/api";
import { useGetStudentsQuery } from "../store/api";
import { StudentCard } from "../components/StudentCard";

export const Home = () => {
  // Si Admin ya pidio el listado, sale de la cache al instante (mismo endpoint, mismos argumentos).
  const { data: students = [], isLoading, error } = useGetStudentsQuery();

  if (isLoading) {
    return <p className="text-slate-500">Cargando estudiantes...</p>;
  }

  if (error) {
    return <p className="text-red-600">No se pudieron cargar los estudiantes: {getErrorMessage(error)}</p>;
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
};
