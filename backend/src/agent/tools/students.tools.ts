// PASO 3 — Las tools (las "manos" del agente).
// Una tool = funcion + nombre + descripcion + schema Zod. El LLM NO ejecuta nada: lee la
// descripcion, decide llamarla y devuelve los argumentos; LangChain valida con Zod y ejecuta.
// La tool es un "controller cuyo cliente es el LLM": no tiene logica de negocio, llama al MISMO
// service que usa la API REST. Las de lectura las puede usar cualquier usuario logueado; las de
// escritura (crear, eliminar) chequean el rol ADENTRO de la tool, igual que requireRole en la API.
import { tool, type ToolRuntime } from "langchain";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import * as studentsService from "../../services/students.service.js";
import { createStudentSchema, listStudentsSchema } from "../../schemas/student.schema.js";
import { IStudentDocument } from "../../models/Student.js";
import { AgentContext, isAdmin } from "../context.js";
import { isDuplicateKeyError } from "../../lib/is-duplicate-key-error.js";
import { withoutNulls } from "./without-nulls.js";

// Lo que la tool le devuelve al LLM cuando el usuario no es admin. El modelo lo lee y se lo explica.
const FORBIDDEN = "Permiso denegado: solo un administrador puede crear o eliminar estudiantes.";

const MAX_RESULTS = 20;

// Solo los campos que el modelo necesita: menos tokens y nada interno (__v, timestamps).
function toPublic(s: IStudentDocument) {
  return { id: s._id.toString(), firstName: s.firstName, lastName: s.lastName, email: s.email, career: s.career, active: s.active };
}

export const listStudentsTool = tool(
  async (args) => {
    console.log(`[⑥ tool] list_students args (ya validados por Zod): ${JSON.stringify(args)}`);
    // listStudentsSchema (el mismo de la API) completa page/sort con sus defaults.
    const filters = listStudentsSchema.parse({ ...withoutNulls(args), limit: MAX_RESULTS });
    const { data, meta } = await studentsService.listStudents(filters);
    console.log(`[⑥ tool] list_students → ${data.length} de ${meta.total} estudiantes`);
    // Las tools devuelven texto: JSON es lo mas facil de leer para el modelo.
    return JSON.stringify({ total: meta.total, shown: data.length, students: data.map(toPublic) });
  },
  {
    name: "list_students",
    description:
      "Lista estudiantes de la facultad. Filtros opcionales: carrera, si esta activo, o texto a buscar " +
      "en nombre/apellido/email. Devuelve el total y hasta 20 resultados.",
    // .nullish(): el modelo puede mandar null en los filtros que no usa (ver without-nulls.ts).
    schema: z.object({
      career: z.string().trim().max(80).nullish().describe("Carrera exacta, ej: 'Sistemas'"),
      active: z.boolean().nullish().describe("true = solo activos, false = solo inactivos"),
      search: z.string().trim().max(120).nullish().describe("Texto a buscar en nombre, apellido o email"),
    }),
  }
);

export const getStudentByIdTool = tool(
  async ({ id }) => {
    console.log(`[⑥ tool] get_student_by_id id=${id}`);
    if (!isValidObjectId(id)) return "El id no es valido.";

    const student = await studentsService.findStudentById(id);
    console.log(`[⑥ tool] get_student_by_id → ${student ? "encontrado" : "no existe"}`);
    return student ? JSON.stringify(toPublic(student)) : "No existe un estudiante con ese id.";
  },
  {
    name: "get_student_by_id",
    description: "Trae un estudiante por su id de MongoDB (24 caracteres hexadecimales).",
    schema: z.object({ id: z.string().describe("El id del estudiante") }),
  }
);

// ── Escritura ────────────────────────────────────────────────────────────────────────────────
// runtime.context = { user } que armo el controller con req.user (ver agent/context.ts).
// Los errores se DEVUELVEN como texto (no se tiran): asi el LLM los lee y le explica al usuario
// que paso, en vez de cortar todo el agente con un error.

export const createStudentTool = tool(
  async (args, runtime: ToolRuntime<unknown, AgentContext>) => {
    console.log(`[⑥ tool] create_student args: ${JSON.stringify(args)} por ${runtime.context?.user.email}`);
    if (!isAdmin(runtime.context)) return FORBIDDEN;

    try {
      const student = await studentsService.createStudent(createStudentSchema.parse(withoutNulls(args)));
      console.log(`[⑥ tool] create_student → creado ${student._id}`);
      return `Estudiante creado: ${JSON.stringify(toPublic(student))}`;
    } catch (error) {
      if (isDuplicateKeyError(error)) return `Ya existe un estudiante con el email ${args.email}.`;
      if (error instanceof Error && error.name === "ValidationError") return `Datos invalidos: ${error.message}`;
      throw error; // error inesperado (Mongo caido, etc.): que lo maneje el controller
    }
  },
  {
    name: "create_student",
    description:
      "Crea un estudiante nuevo. Usala SOLO si el usuario pide explicitamente agregar/dar de alta un " +
      "estudiante y dio nombre, apellido, email y carrera. Si falta alguno, no la llames: pedile el dato.",
    // El MISMO schema que valida POST /students en la API, con los opcionales aceptando null
    // (el modelo los manda asi); antes de crear se limpian y se valida con el schema original.
    schema: createStudentSchema.extend({
      enrollmentDate: z.iso.datetime().nullish(),
      active: z.boolean().nullish(),
    }),
  }
);

export const deleteStudentTool = tool(
  async ({ id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    console.log(`[⑥ tool] delete_student id=${id} por ${runtime.context?.user.email}`);
    if (!isAdmin(runtime.context)) return FORBIDDEN;
    if (!isValidObjectId(id)) return "El id no es valido.";

    const deleted = await studentsService.deleteStudent(id);
    console.log(`[⑥ tool] delete_student → ${deleted ? "eliminado" : "no existe"}`);
    return deleted
      ? `Estudiante eliminado: ${deleted.firstName} ${deleted.lastName} (${deleted.email}).`
      : "No existe un estudiante con ese id.";
  },
  {
    name: "delete_student",
    description:
      "Elimina un estudiante por su id. Usala SOLO si el usuario pide explicitamente eliminar/borrar " +
      "un estudiante. Primero buscalo con list_students para obtener el id; si hay mas de uno que " +
      "coincide, NO elimines: mostra las opciones y pedi que aclare cual.",
    schema: z.object({ id: z.string().describe("El id del estudiante a eliminar (obtenido con list_students)") }),
  }
);
