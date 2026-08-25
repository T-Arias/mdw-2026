import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Materia, { IMateria, IMateriaDocument, Cuatrimestre } from "../models/Materia";
import { ALLOWED_SORT_FIELDS } from "../schemas/materia.schema";

type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

interface ListMateriasFilters {
  carrera?: string;
  cuatrimestre?: Cuatrimestre;
  anio?: number;
  activa?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 1 | -1;
}

// Escapa los metacaracteres de regex para que un término de búsqueda no pueda
// inyectar su propia expresión regular en el filtro $regex de más abajo.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// QUERY manda los filtros en el body en vez de la URL, así que leemos req.body.
// El middleware validateBody ya lo pasó por Zod, con defaults aplicados.
function parseListMateriasBody(body: unknown): ListMateriasFilters {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const filters: ListMateriasFilters = {
    page: Number.isInteger(input.page) ? (input.page as number) : 1,
    limit: Number.isInteger(input.limit) ? (input.limit as number) : 20,
    sortBy: ALLOWED_SORT_FIELDS.includes(input.sortBy as SortField)
      ? (input.sortBy as SortField)
      : "createdAt",
    sortOrder: input.sortOrder === "asc" ? 1 : -1,
  };

  if (typeof input.carrera === "string" && input.carrera.trim()) {
    filters.carrera = input.carrera.trim();
  }

  if (typeof input.cuatrimestre === "string") {
    filters.cuatrimestre = input.cuatrimestre as Cuatrimestre;
  }

  if (Number.isInteger(input.anio)) {
    filters.anio = input.anio as number;
  }

  if (typeof input.activa === "boolean") {
    filters.activa = input.activa;
  }

  if (typeof input.search === "string" && input.search.trim()) {
    filters.search = input.search.trim().slice(0, 120);
  }

  return filters;
}

// QUERY /api/v1/materias
// Body de ejemplo: { "carrera": "Ingeniería en Sistemas", "activa": true, "page": 1 }
export async function listMaterias(req: Request, res: Response): Promise<void> {
  const { carrera, cuatrimestre, anio, activa, search, page, limit, sortBy, sortOrder } =
    parseListMateriasBody(req.body);

  // Armamos el filtro sólo con campos de la whitelist — nunca hacer spread de
  // req.body dentro de la query (dejaría inyectar operadores como { "$gt": "" }).
  const filter: QueryFilter<IMateriaDocument> = {};
  if (carrera) filter.carrera = carrera;
  if (cuatrimestre) filter.cuatrimestre = cuatrimestre;
  if (anio !== undefined) filter.anio = anio;
  if (activa !== undefined) filter.activa = activa;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { nombre: { $regex: safeSearch, $options: "i" } },
      { codigo: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [materias, total] = await Promise.all([
      Materia.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Materia.countDocuments(filter),
    ]);

    res.status(200).json({
      data: materias,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[materias] error al listar:", error);
    res.status(500).json({ error: "No se pudieron obtener las materias" });
  }
}

export async function getMateriaById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id enviado no es válido" });
    return;
  }

  try {
    const materia = await Materia.findById(id);

    if (!materia) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(200).json(materia);
  } catch (error) {
    console.error("[materias] error al buscar:", error);
    res.status(500).json({ error: "No se pudo obtener la materia" });
  }
}

export async function createMateria(
  req: Request<{}, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  try {
    const nuevaMateria = await Materia.create(req.body);
    res.status(201).json(nuevaMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    // 11000 = índice único duplicado (código de materia repetido)
    if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
      res.status(409).json({ error: "Ya existe una materia con ese código" });
      return;
    }

    console.error("[materias] error al crear:", error);
    res.status(500).json({ error: "No se pudo crear la materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id enviado no es válido" });
    return;
  }

  try {
    const materiaActualizada = await Materia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!materiaActualizada) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(200).json(materiaActualizada);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
      res.status(409).json({ error: "Ya existe una materia con ese código" });
      return;
    }

    console.error("[materias] error al actualizar:", error);
    res.status(500).json({ error: "No se pudo actualizar la materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id enviado no es válido" });
    return;
  }

  try {
    const materiaEliminada = await Materia.findByIdAndDelete(id);

    if (!materiaEliminada) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[materias] error al eliminar:", error);
    res.status(500).json({ error: "No se pudo eliminar la materia" });
  }
}
