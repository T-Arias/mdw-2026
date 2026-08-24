// Array declarativo de tools MCP para students. Cada entrada declara la Action de
// policy que le corresponde: es lo que permite filtrar tools/list por rol sin
// duplicar la matriz de permisos que ya vive en src/auth/policy.ts.
import { z } from "zod";
import { ToolAnnotations } from "@modelcontextprotocol/server";
import {
  listStudentsSchema,
  createStudentSchema,
  updateStudentSchema,
  ListStudentsInput,
  CreateStudentInput,
  UpdateStudentInput,
} from "../../schemas/students.schema";
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../../services/students.service";
import { Action } from "../../auth/policy";

export interface McpToolDef {
  name: string;
  description: string;
  action: Action;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  // Hints de comportamiento (readOnly/destructive/idempotent/openWorld) — es lo que
  // usan los clientes MCP (Claude incluido) para agrupar tools de lectura vs
  // escritura/destructivas en la UI, en vez de inventar un namespace propio.
  annotations: ToolAnnotations;
  // El SDK de MCP ya valida, coerciona y aplica los defaults de Zod contra
  // inputSchema (reconstruye el mismo ZodObject y lo parsea) antes de invocar esto
  // — ver McpServer.validateToolInput en el SDK. args llega limpio, no hace falta
  // volver a parsearlo aca: seria una segunda validacion identica a la primera.
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

interface WithId {
  id: string;
}

// Punto unico donde se reinterpreta args (ya validado por el SDK contra el mismo
// inputSchema declarado abajo) como el tipo concreto que cada handler necesita.
function asShape<T>(args: Record<string, unknown>): T {
  return args as unknown as T;
}

const idSchema = z.object({ id: z.string().min(1, "id es obligatorio") });
const updateStudentInputSchema = z.object({
  id: z.string().min(1, "id es obligatorio"),
  ...updateStudentSchema.shape,
});

export const studentTools: McpToolDef[] = [
  {
    name: "list_students",
    description: "Lista estudiantes con filtros (career, active, search), paginacion y orden.",
    action: "students:read",
    inputSchema: listStudentsSchema,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => listStudents(asShape<ListStudentsInput>(args)),
  },
  {
    name: "get_student",
    description: "Obtiene un estudiante por id.",
    action: "students:read",
    inputSchema: idSchema,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => getStudentById(asShape<WithId>(args).id),
  },
  {
    name: "create_student",
    description: "Crea un estudiante nuevo.",
    action: "students:create",
    inputSchema: createStudentSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    handler: (args) => createStudent(asShape<CreateStudentInput>(args)),
  },
  {
    name: "update_student",
    description: "Actualiza campos de un estudiante existente, identificado por id.",
    action: "students:update",
    inputSchema: updateStudentInputSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const { id, ...rest } = asShape<WithId & UpdateStudentInput>(args);
      return updateStudent(id, rest);
    },
  },
  {
    name: "delete_student",
    description: "Elimina un estudiante por id.",
    action: "students:delete",
    inputSchema: idSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    handler: async (args) => {
      await deleteStudent(asShape<WithId>(args).id);
      return { deleted: true };
    },
  },
];
