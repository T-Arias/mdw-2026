import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getErrorMessage } from "../../lib/api";
import {
  emptyStudent,
  studentSchema,
  toStudentFormValues,
  type StudentFormValues,
} from "../../schemas/student.schema";
import type { Student } from "../../types/student";

interface StudentFormProps {
  student: Student | null;
  onSave: (values: StudentFormValues) => Promise<void>;
  onCancel: () => void;
}

const textFields = [
  { name: "firstName", label: "Nombre", type: "text" },
  { name: "lastName", label: "Apellido", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "career", label: "Carrera", type: "text" },
] as const;

export const StudentForm = ({ student, onSave, onCancel }: StudentFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentSchema),
    values: student ? toStudentFormValues(student) : emptyStudent,
  });

  const onSubmit = async (values: StudentFormValues) => {
    try {
      await onSave(values);
      reset(emptyStudent);
    } catch (err) {
      setError("root.server", { message: getErrorMessage(err) });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        {student ? `Editando a ${student.firstName} ${student.lastName}` : "Nuevo estudiante"}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {textFields.map(({ name, label, type }) => (
          <label key={name} className="flex flex-col gap-1 text-sm text-slate-700">
            {label}
            <input
              type={type}
              aria-invalid={!!errors[name]}
              {...register(name)}
              className="rounded border border-slate-300 px-3 py-2 aria-invalid:border-red-500"
            />
            {errors[name] && <span className="text-xs text-red-600">{errors[name].message}</span>}
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("active")} />
        Activo
      </label>
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : student ? "Guardar cambios" : "Crear"}
        </button>
        {student && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          >
            Cancelar edicion
          </button>
        )}
      </div>
    </form>
  );
};
