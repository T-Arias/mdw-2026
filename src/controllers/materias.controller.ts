import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Materia, { IMateriasDocument } from "../models/Materias";
import {
  CreateMateriaInput,
  ListMateriasInput,
  UpdateMateriaInput,
} from "../schemas/materia.schema";

// Escapes regex metacharacters so a search term can't inject its own regex
// (ReDoS or unintended matches) into the $regex filter below.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// QUERY /api/v1/materias
// El body ya viene validado y con defaults aplicados por validateBody(listMateriasSchema).
// Body example: { "career": "Systems", "active": true, "search": "algebra", "page": 1, "limit": 20 }
export async function listMaterias(
  req: Request<{}, {}, ListMateriasInput>,
  res: Response
): Promise<void> {
  const { career, profesor, active, search, page, limit, sortBy, sortOrder } = req.body;

  // Build the Mongoose filter from whitelisted fields only — never spread
  // req.body directly into a query (that would let a client inject operators
  // like { "$gt": "" } into any field).
  const filter: QueryFilter<IMateriasDocument> = {};
  if (career) filter.career = career;
  if (profesor) filter.profesor = profesor;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { nombre: { $regex: safeSearch, $options: "i" } },
      { profesor: { $regex: safeSearch, $options: "i" } },
      { horario: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [materias, total] = await Promise.all([
      Materia.find(filter)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
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
    res.status(500).json({ error: "Could not fetch materias" });
  }
}

export async function getMateriaById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const materia = await Materia.findById(id);

    if (!materia) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }

    res.status(200).json(materia);
  } catch (error) {
    console.error("[materias] error fetching:", error);
    res.status(500).json({ error: "Could not fetch the materia" });
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

    console.error("[materias] error creating:", error);
    res.status(500).json({ error: "Could not create the materia" });
  }
}

export async function updateMateria(
  req: Request<{ id: string }, {}, UpdateMateriaInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedMateria = await Materia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMateria) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }

    res.status(200).json(updatedMateria);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[materias] error updating:", error);
    res.status(500).json({ error: "Could not update the materia" });
  }
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedMateria = await Materia.findByIdAndDelete(id);

    if (!deletedMateria) {
      res.status(404).json({ error: "Materia not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[materias] error deleting:", error);
    res.status(500).json({ error: "Could not delete the materia" });
  }
}
