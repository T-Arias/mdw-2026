import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Materia, { IMateria, IMateriaDocument } from "../models/materias";

const ALLOWED_SORT_FIELDS = ["createdAt", "nombre", "codigo", "cuatrimestre"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

interface ListMateriasFilters {
  cuatrimestre?: number;
  activa?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 1 | -1;
}

// Escapa metacaracteres de regex para que un termino de busqueda no pueda
// inyectar su propio regex (ReDoS o matches no deseados) en el filtro $regex.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// El body lleva los filtros en vez de la URL, por eso parseamos y
// validamos req.body a mano (no hay parseo de query string).
function parseListMateriasBody(body: unknown): ListMateriasFilters | { error: string } {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const page = Number.isInteger(input.page) ? (input.page as number) : 1;
  const limit = Number.isInteger(input.limit) ? (input.limit as number) : 20;

  if (page < 1) {
    return { error: "page debe ser >= 1" };
  }

  if (limit < 1 || limit > 100) {
    return { error: "limit debe estar entre 1 y 100" };
  }

  const sortBy = typeof input.sortBy === "string" ? input.sortBy : "createdAt";

  if (!ALLOWED_SORT_FIELDS.includes(sortBy as SortField)) {
    return { error: `sortBy debe ser uno de: ${ALLOWED_SORT_FIELDS.join(", ")}` };
  }

  const filters: ListMateriasFilters = {
    page,
    limit,
    sortBy: sortBy as SortField,
    sortOrder: input.sortOrder === "asc" ? 1 : -1,
  };

  if (typeof input.cuatrimestre === "number") {
    filters.cuatrimestre = input.cuatrimestre;
  }

  if (typeof input.activa === "boolean") {
    filters.activa = input.activa;
  }

  if (typeof input.search === "string" && input.search.trim()) {
    filters.search = input.search.trim().slice(0, 120);
  }

  return filters;
}

// QUERY /api/materias
// Body ejemplo: { "cuatrimestre": 2, "activa": true, "search": "base", "page": 1, "limit": 20 }
export async function listMaterias(req: Request, res: Response): Promise<void> {
  const parsed = parseListMateriasBody(req.body);

  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { cuatrimestre, activa, search, page, limit, sortBy, sortOrder } = parsed;

  // Construimos el filtro de Mongoose solo con campos permitidos, nunca
  // hacemos spread directo de req.body en la query (eso dejaria inyectar
  // operadores como { "$gt": "" } en cualquier campo).
  const filter: QueryFilter<IMateriaDocument> = {};
  if (cuatrimestre !== undefined) filter.cuatrimestre = cuatrimestre;
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
    console.error("[materias] error listing:", error);
    res.status(500).json({ error: "No se pudieron obtener las materias" });
  }
}

export async function getMateriaById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es valido" });
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
    res.status(500).json({ error: "No se pudo obtener la materia" });
  }
}

export async function createMateria(
  req: Request<{}, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  try {
    const newMateria = await Materia.create(req.body);
    res.status(201).json(newMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[materias] error creating:", error);
    res.status(500).json({ error: "No se pudo crear la materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, Partial<IMateria>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es valido" });
    return;
  }

  try {
    const updatedMateria = await Materia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMateria) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(200).json(updatedMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[materias] error updating:", error);
    res.status(500).json({ error: "No se pudo actualizar la materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es valido" });
    return;
  }

  try {
    const deletedMateria = await Materia.findByIdAndDelete(id);

    if (!deletedMateria) {
      res.status(404).json({ error: "Materia no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[materias] error deleting:", error);
    res.status(500).json({ error: "No se pudo eliminar la materia" });
  }
}