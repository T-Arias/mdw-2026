// Capa de servicio: la logica de negocio y el acceso a datos de estudiantes, en UN solo lugar.
// No sabe nada de HTTP (req/res) ni de LLMs. La consumen:
//   - controllers/students.controller.ts  (API REST)
//   - agent/tools/students.tools.ts       (agente)
// Los ids llegan ya validados (isValidObjectId) por quien llama: eso es validar input, no negocio.
import { QueryFilter } from "mongoose";
import Student, { IStudentDocument } from "../models/Student.js";
import { escapeRegex } from "../lib/escape-regex.js";
import { CreateStudentInput, ListStudentsInput, UpdateStudentInput } from "../schemas/student.schema.js";
import { Paginated } from "../types/pagination.types.js";

// El filtro se arma campo por campo desde input ya validado por Zod: nunca se pasa el input crudo
// a Mongo (eso permitiria inyectar operadores como { "$gt": "" }).
function buildFilter({ career, active, search }: ListStudentsInput): QueryFilter<IStudentDocument> {
  const filter: QueryFilter<IStudentDocument> = {};
  // Coincidencia exacta sin importar mayusculas: "sistemas" encuentra "Sistemas".
  if (career) filter.career = { $regex: `^${escapeRegex(career)}$`, $options: "i" };
  if (active !== undefined) filter.active = active;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: safe, $options: "i" } },
      { lastName: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }
  return filter;
}

export async function listStudents(input: ListStudentsInput): Promise<Paginated<IStudentDocument>> {
  const { page, limit, sortBy, sortOrder } = input;
  const filter = buildFilter(input);
  // Lo usan la API y el agente: este log aparece en los dos caminos.
  console.log(`[⑥ service] students.find filtro Mongo: ${JSON.stringify(filter)} page=${page} limit=${limit}`);

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function findStudentById(id: string): Promise<IStudentDocument | null> {
  return Student.findById(id);
}

export function createStudent(input: CreateStudentInput): Promise<IStudentDocument> {
  return Student.create(input);
}

export function updateStudent(id: string, input: UpdateStudentInput): Promise<IStudentDocument | null> {
  return Student.findByIdAndUpdate(id, input, { new: true, runValidators: true });
}

export function deleteStudent(id: string): Promise<IStudentDocument | null> {
  return Student.findByIdAndDelete(id);
}
