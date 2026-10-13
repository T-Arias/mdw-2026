import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/api";
import type { StudentFormValues } from "../schemas/student.schema";
import { createStudent, deleteStudent, getStudents, updateStudent } from "../services/students";
import type { Student } from "../types/student";
import { StudentForm } from "../components/admin/StudentForm";

export const Admin = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setStudents(await getStudents());
      } catch (err) {
        setError(getErrorMessage(err));
      }
    };

    loadStudents();
  }, []);

  const handleSave = async (values: StudentFormValues) => {
    if (editing) {
      const updated = await updateStudent(editing._id, values);
      setStudents((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      setEditing(null);
    } else {
      const created = await createStudent(values);
      setStudents((prev) => [...prev, created]);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`¿Eliminar a ${student.firstName} ${student.lastName}?`)) return;
    setError(null);
    try {
      await deleteStudent(student._id);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      if (editing?._id === student._id) setEditing(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-slate-900">Panel de administracion</h2>

      <StudentForm student={editing} onSave={handleSave} onCancel={() => setEditing(null)} />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
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
