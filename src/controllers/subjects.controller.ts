import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Subject, { ISubject, ISubjectDocument } from "../models/Subject";

const ALLOWED_SORT_FIELDS = ["createdAt", "name", "career"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

interface ListSubjectsFilters {
  career?: string;
  active?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: 1 | -1;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseListSubjectsBody(body: unknown): ListSubjectsFilters | { error: string } {
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

  const filters: ListSubjectsFilters = {
    page,
    limit,
    sortBy: sortBy as SortField,
    sortOrder: input.sortOrder === "asc" ? 1 : -1,
  };

  if (typeof input.career === "string" && input.career.trim()) {
    filters.career = input.career.trim();
  }

  if (typeof input.active === "boolean") {
    filters.active = input.active;
  }

  if (typeof input.search === "string" && input.search.trim()) {
    filters.search = input.search.trim().slice(0, 120);
  }

  return filters;
}

export async function listSubjects(req: Request, res: Response): Promise<void> {
  const parsed = parseListSubjectsBody(req.body);

  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { career, active, search, page, limit, sortBy, sortOrder } = parsed;

  const filter: QueryFilter<ISubjectDocument> = {};
  if (career) filter.career = career;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { career: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Subject.countDocuments(filter),
    ]);

    res.status(200).json({
      data: subjects,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[subjects] error listing:", error);
    res.status(500).json({ error: "Could not fetch subjects" });
  }
}

export async function getSubjectById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const subject = await Subject.findById(id);

    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch the subject" });
  }
}

export async function createSubject(
  req: Request<{}, {}, Partial<ISubject>>,
  res: Response
): Promise<void> {
  try {
    const newSubject = await Subject.create(req.body);
    res.status(201).json(newSubject);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[subjects] error creating:", error);
    res.status(500).json({ error: "Could not create the subject" });
  }
}

export async function updateSubject(
  req: Request<{ id: string }, {}, Partial<ISubject>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedSubject = await Subject.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedSubject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    res.status(200).json(updatedSubject);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[subjects] error updating:", error);
    res.status(500).json({ error: "Could not update the subject" });
  }
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedSubject = await Subject.findByIdAndDelete(id);

    if (!deletedSubject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[subjects] error deleting:", error);
    res.status(500).json({ error: "Could not delete the subject" });
  }
}
