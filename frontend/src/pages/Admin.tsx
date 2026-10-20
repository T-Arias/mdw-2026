import { useState } from "react";
import { getErrorMessage } from "../lib/api";
import type { StudentFormValues } from "../schemas/student.schema";
import {
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentsQuery,
  useUpdateStudentMutation,
} from "../store/api";
import type { Student } from "../types/student";
import { StudentForm } from "../components/admin/StudentForm";

export const Admin = () => {
  const { data: students = [], error: loadError } = useGetStudentsQuery();
  const [createStudent] = useCreateStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();
  const [deleteStudent, { error: deleteError }] = useDeleteStudentMutation();
  // Estado de UI de esta pantalla: no es global, se queda en useState.
  const [editing, setEditing] = useState<Student | null>(null);

  // Ya no se actualiza el listado a mano (map / spread / filter): cada mutation invalida el tag
  // "Students" y RTK Query vuelve a pedir el listado. unwrap() lanza el error para que lo muestre el form.
  const handleSave = async (values: StudentFormValues) => {
    if (editing) {
      await updateStudent({ id: editing._id, values }).unwrap();
      setEditing(null);
    } else {
      await createStudent(values).unwrap();
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`¿Eliminar a ${student.firstName} ${student.lastName}?`)) return;
    // Sin unwrap: si falla, el error queda en `deleteError` y se muestra abajo.
    const result = await deleteStudent(student._id);
    if (!result.error && editing?._id === student._id) setEditing(null);
  };

  const error = loadError ?? deleteError;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-900">Panel de administracion</h2>

      <StudentForm student={editing} onSave={handleSave} onCancel={() => setEditing(null)} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(error)}
        </p>
      )}

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {students.map((student) => (
          <li key={student._id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">
                {student.lastName}, {student.firstName}
              </p>
              <p className="text-sm text-slate-500">
                {student.email} · {student.career} · {student.active ? "Activo" : "Inactivo"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(student)}
                className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(student)}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
        {students.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">Todavia no hay estudiantes cargados.</li>
        )}
      </ul>
    </section>
  );
};
