import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Materia, { IMateriaDocument } from "../models/Materia";
import {
  CreateMateriaInput,
  UpdateMateriaInput,
  listMateriasSchema,
} from "../schemas/materia.schema";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

// GET /api/v1/materias?carrera=Sistemas&anio=2&activa=true&search=web&page=1&limit=20
export async function listMaterias(req: Request, res: Response): Promise<void> {
  const parseResult = listMateriasSchema.safeParse(req.query);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        message: "Los parámetros de búsqueda no son válidos",
        details: parseResult.error.flatten().fieldErrors,
      },
    });
    return;
  }

  const { carrera, anio, activa, search, page, limit, sortBy, sortOrder } = parseResult.data;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const filter: QueryFilter<IMateriaDocument> = {};
  if (carrera) filter.carrera = carrera;
  if (anio !== undefined) filter.anio = anio;
  if (activa !== undefined) filter.activa = activa;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { nombre: { $regex: safeSearch, $options: "i" } },
      { codigo: { $regex: safeSearch, $options: "i" } },
      { descripcion: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [materias, total] = await Promise.all([
      Materia.find(filter).sort({ [sortBy]: sortDirection }).skip(skip).limit(limit),
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
    res.status(400).json({ error: "El id proporcionado no es válido" });
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
    console.error("[materias] error fetching by id:", error);
    res.status(500).json({ error: "No se pudo obtener la materia" });
  }
}

export async function createMateria(
  req: Request<{}, {}, CreateMateriaInput>,
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

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "Ya existe una materia con ese código" });
      return;
    }

    console.error("[materias] error creating:", error);
    res.status(500).json({ error: "No se pudo crear la materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, UpdateMateriaInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es válido" });
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

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "Ya existe una materia con ese código" });
      return;
    }

    console.error("[materias] error updating:", error);
    res.status(500).json({ error: "No se pudo actualizar la materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id proporcionado no es válido" });
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