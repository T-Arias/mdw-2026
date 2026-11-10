// PASO 3 (bis) — Tools de materias. Mismo patron que students.tools.ts: llaman al service.
import { tool } from "langchain";
import { z } from "zod";
import * as subjectsService from "../../services/subjects.service.js";
import { listSubjectsSchema } from "../../schemas/subject.schema.js";
import { ISubjectDocument } from "../../models/Subject.js";
import { withoutNulls } from "./without-nulls.js";

const MAX_RESULTS = 20;

function toPublic(s: ISubjectDocument) {
  return { id: s._id.toString(), name: s.name, code: s.code, career: s.career, credits: s.credits, year: s.year, description: s.description, active: s.active };
}

export const listSubjectsTool = tool(
  async (args) => {
    console.log(`[⑥ tool] list_subjects args (ya validados por Zod): ${JSON.stringify(args)}`);
    const filters = listSubjectsSchema.parse({ ...withoutNulls(args), limit: MAX_RESULTS });
    const { data, meta } = await subjectsService.listSubjects(filters);
    console.log(`[⑥ tool] list_subjects → ${data.length} de ${meta.total} materias`);
    return JSON.stringify({ total: meta.total, shown: data.length, subjects: data.map(toPublic) });
  },
  {
    name: "list_subjects",
    description:
      "Lista materias. Filtros opcionales: carrera, año de cursada (1 a 6) o texto a buscar en " +
      "nombre/codigo/descripcion. Devuelve el total y hasta 20 resultados.",
    // .nullish(): el modelo puede mandar null en los filtros que no usa (ver without-nulls.ts).
    schema: z.object({
      career: z.string().trim().max(80).nullish().describe("Carrera exacta, ej: 'Sistemas'"),
      year: z.number().int().min(1).max(6).nullish().describe("Año de la carrera"),
      search: z.string().trim().max(120).nullish().describe("Texto a buscar en nombre, codigo o descripcion"),
    }),
  }
);
