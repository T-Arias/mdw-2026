import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Subject, { ISubject, ISubjectDocument } from "../models/Subject";
import { ListSubjectsInput } from "../schemas/subject.schema";

// Escapes regex metacharacters so a search term can't inject its own regex
// (ReDoS or unintended matches) into the $regex filter below.
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Mongo raises code 11000 when a unique index is violated (here: subject code).
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

// QUERY /api/v1/subjects
// Body example: { "year": 2, "active": true, "search": "prog", "page": 1, "limit": 20 }
// The body already went through validateBody(listSubjectsSchema), so it arrives
// parsed, with defaults applied and types coerced — no manual parsing needed.
export async function listSubjects(
  req: Request<{}, {}, ListSubjectsInput>,
  res: Response
): Promise<void> {
  const { year, credits, active, search, page, limit, sortBy, sortOrder } = req.body;

  // Build the Mongoose filter from whitelisted fields only — never spread
  // req.body directly into a query (that would let a client inject operators
  // like { "$gt": "" } into any field).
  const filter: QueryFilter<ISubjectDocument> = {};
  if (year !== undefined) filter.year = year;
  if (credits !== undefined) filter.credits = credits;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { code: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
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
    console.error("[subjects] error fetching:", error);
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
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "A subject with that code already exists" });
      return;
    }

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
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "A subject with that code already exists" });
      return;
    }

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
