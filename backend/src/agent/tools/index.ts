// Junta todas las tools. Para darle una capacidad nueva al agente: crear la tool y sumarla aca.
// Lo que NO esta en esta lista, el modelo no lo puede hacer (ej: editar estudiantes o materias).
import { listStudentsTool, getStudentByIdTool, createStudentTool, deleteStudentTool } from "./students.tools.js";
import { listSubjectsTool } from "./subjects.tools.js";

export const tools = [listStudentsTool, getStudentByIdTool, createStudentTool, deleteStudentTool, listSubjectsTool];
