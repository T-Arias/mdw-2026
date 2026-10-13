import { z } from "zod";
import type { Student } from "../types/student";

export const studentSchema = z.object({
  firstName: z.string().trim().min(1, { error: "El nombre es obligatorio" }).max(80),
  lastName: z.string().trim().min(1, { error: "El apellido es obligatorio" }).max(80),
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  career: z.string().trim().min(1, { error: "La carrera es obligatoria" }),
  active: z.boolean(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const emptyStudent: StudentFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  career: "",
  active: true,
};

export const toStudentFormValues = ({
  firstName,
  lastName,
  email,
  career,
  active,
}: Student): StudentFormValues => ({ firstName, lastName, email, career, active });
