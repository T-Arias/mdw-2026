// Lecturas y escrituras de students, agrupadas en un solo archivo. El actor sale del
// ActorContext (AsyncLocalStorage), nunca de un parametro — el mismo service sirve
// al controller HTTP y a las tools MCP.
import { QueryFilter, isValidObjectId } from "mongoose";
import Student, { IStudentDocument } from "../models/Student";
import {
  ListStudentsInput,
  CreateStudentInput,
  UpdateStudentInput,
} from "../schemas/students.schema";
import { assertCan } from "../auth/policy";
import { NotFoundError, ValidationError } from "../core/errors";

// Escapa metacaracteres de regex para que un termino de busqueda no pueda inyectar
// su propia regex (ReDoS o matches no intencionados) en el filtro $regex de abajo.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export interface StudentsPage {
  data: unknown[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function listStudents(input: ListStudentsInput): Promise<StudentsPage> {
  assertCan("students:read");

  const { page, limit, sortBy, sortOrder, career, active, search } = input;

  // Filtro armado solo con campos whitelisted — nunca se spreadea el input crudo
  // en la query (eso dejaria inyectar operadores como { "$gt": "" } en cualquier campo).
  const filter: QueryFilter<IStudentDocument> = {};
  if (career) filter.career = career;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: safeSearch, $options: "i" } },
      { lastName: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getStudentById(id: string): Promise<unknown> {
  assertCan("students:read");

  if (!isValidObjectId(id)) {
    throw new ValidationError("The provided id is not valid");
  }

  const student = await Student.findById(id).lean();

  if (!student) {
    throw new NotFoundError("Student not found");
  }

  return student;
}

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

export async function createStudent(input: CreateStudentInput): Promise<unknown> {
  assertCan("students:create");

  return Student.create(input);
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<unknown> {
  assertCan("students:update");

  if (!isValidObjectId(id)) {
    throw new ValidationError("The provided id is not valid");
  }

  const updated = await Student.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new NotFoundError("Student not found");
  }

  return updated;
}

export async function deleteStudent(id: string): Promise<void> {
  assertCan("students:delete");

  if (!isValidObjectId(id)) {
    throw new ValidationError("The provided id is not valid");
  }

  const deleted = await Student.findByIdAndDelete(id);

  if (!deleted) {
    throw new NotFoundError("Student not found");
  }
}
