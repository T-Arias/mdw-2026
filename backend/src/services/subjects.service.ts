// Capa de servicio de materias. Mismo patron que students.service.ts:
// la consumen controllers/subjects.controller.ts (API) y agent/tools/subjects.tools.ts (agente).
import { QueryFilter } from "mongoose";
import Subject, { ISubjectDocument } from "../models/Subject.js";
import { escapeRegex } from "../lib/escape-regex.js";
import { CreateSubjectInput, ListSubjectsInput, UpdateSubjectInput } from "../schemas/subject.schema.js";
import { Paginated } from "../types/pagination.types.js";

function buildFilter({ career, year, active, search }: ListSubjectsInput): QueryFilter<ISubjectDocument> {
  const filter: QueryFilter<ISubjectDocument> = {};
  if (career) filter.career = { $regex: `^${escapeRegex(career)}$`, $options: "i" };
  if (year !== undefined) filter.year = year;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { code: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }
  return filter;
}

export async function listSubjects(input: ListSubjectsInput): Promise<Paginated<ISubjectDocument>> {
  const { page, limit, sortBy, sortOrder } = input;
  const filter = buildFilter(input);
  // Lo usan la API y el agente: este log aparece en los dos caminos.
  console.log(`[⑥ service] subjects.find filtro Mongo: ${JSON.stringify(filter)} page=${page} limit=${limit}`);

  const [data, total] = await Promise.all([
    Subject.find(filter)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Subject.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function findSubjectById(id: string): Promise<ISubjectDocument | null> {
  return Subject.findById(id);
}

export function createSubject(input: CreateSubjectInput): Promise<ISubjectDocument> {
  return Subject.create(input);
}

export function updateSubject(id: string, input: UpdateSubjectInput): Promise<ISubjectDocument | null> {
  return Subject.findByIdAndUpdate(id, input, { new: true, runValidators: true });
}

export function deleteSubject(id: string): Promise<ISubjectDocument | null> {
  return Subject.findByIdAndDelete(id);
}
