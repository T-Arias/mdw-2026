import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Materia, { IMaterias, IMateriasDocument } from "../models/materias";

const ALLOWED_SORT_FIELDS = ["createdAt", "Name", "Hours"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

interface ListMateriasFilters {
  search?: string;
  minHours?: number;
  maxHours?: number;
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 1 | -1;
}

// Escapes regex metacharacters so a search term can't inject its own regex
// (ReDoS or unintended matches) into the $regex filter below.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// QUERY carries the filters in the body instead of the URL, so we parse and
// validate req.body by hand here (no query-string parsing involved).
function parseListMateriasBody(body: unknown): ListMateriasFilters | { error: string } {
  const input = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const page = Number.isInteger(input.page) ? (input.page as number) : 1;
  const limit = Number.isInteger(input.limit) ? (input.limit as number) : 20;

  if (page < 1) {
    return { error: "page must be >= 1" };
  }

  if (limit < 1 || limit > 100) {
    return { error: "limit must be between 1 and 100" };
  }

  const sortBy = typeof input.sortBy === "string" ? input.sortBy : "createdAt";

  if (!ALLOWED_SORT_FIELDS.includes(sortBy as SortField)) {
    return { error: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}` };
  }

  const filters: ListMateriasFilters = {
    page,
    limit,
    sortBy: sortBy as SortField,
    sortOrder: input.sortOrder === "asc" ? 1 : -1,
  };

  if (input.minHours !== undefined) {
    if (typeof input.minHours !== "number" || !Number.isFinite(input.minHours)) {
      return { error: "minHours must be a number" };
    }
    filters.minHours = input.minHours;
  }

  if (input.maxHours !== undefined) {
    if (typeof input.maxHours !== "number" || !Number.isFinite(input.maxHours)) {
      return { error: "maxHours must be a number" };
    }
    filters.maxHours = input.maxHours;
  }

  if (
    filters.minHours !== undefined &&
    filters.maxHours !== undefined &&
    filters.minHours > filters.maxHours
  ) {
    return { error: "minHours cannot be greater than maxHours" };
  }

  if (typeof input.search === "string" && input.search.trim()) {
    filters.search = input.search.trim().slice(0, 120);
  }

  return filters;
}

// QUERY /api/materias
// Body example: { "search": "algebra", "minHours": 2, "page": 1, "limit": 20 }
export async function listMaterias(req: Request, res: Response): Promise<void> {
  const parsed = parseListMateriasBody(req.body);

  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { search, minHours, maxHours, page, limit, sortBy, sortOrder } = parsed;

  // Build the Mongoose filter from whitelisted fields only — never spread
  // req.body directly into a query (that would let a client inject operators
  // like { "$gt": "" } into any field).
  const filter: QueryFilter<IMateriasDocument> = {};
  if (minHours !== undefined || maxHours !== undefined) {
    filter.Hours = {};
    if (minHours !== undefined) filter.Hours.$gte = minHours;
    if (maxHours !== undefined) filter.Hours.$lte = maxHours;
  }
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { Name: { $regex: safeSearch, $options: "i" } },
      { Description: { $regex: safeSearch, $options: "i" } },
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
  req: Request<{}, {}, Partial<IMaterias>>,
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
  req: Request<{ id: string }, {}, Partial<IMaterias>>,
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
