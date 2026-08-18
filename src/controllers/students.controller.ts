import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Student, { IStudent, IStudentDocument } from "../models/Student";

const ALLOWED_SORT_FIELDS = ["createdAt", "firstName", "lastName", "enrollmentDate"] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

interface ListStudentsFilters {
  career?: string;
  active?: boolean;
  search?: string;
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
function parseListStudentsBody(body: unknown): ListStudentsFilters | { error: string } {
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

  const filters: ListStudentsFilters = {
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

// QUERY /api/students
// Body example: { "career": "Systems", "active": true, "search": "ana", "page": 1, "limit": 20 }
export async function listStudents(req: Request, res: Response): Promise<void> {
  const parsed = parseListStudentsBody(req.body);

  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { career, active, search, page, limit, sortBy, sortOrder } = parsed;

  // Build the Mongoose filter from whitelisted fields only — never spread
  // req.body directly into a query (that would let a client inject operators
  // like { "$gt": "" } into any field).
  const filter: QueryFilter<IStudentDocument> = {};
  if (career) filter.career = career;
  if (active !== undefined) filter.active = active;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { firstName: { $regex: safeSearch, $options: "i" } },
      { lastName: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    res.status(200).json({
      data: students,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[students] error listing:", error);
    res.status(500).json({ error: "Could not fetch students" });
  }
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const student = await Student.findById(id);

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch the student" });
  }
}

export async function createStudent(
  req: Request<{}, {}, Partial<IStudent>>,
  res: Response
): Promise<void> {
  try {
    const newStudent = await Student.create(req.body);
    res.status(201).json(newStudent);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[students] error creating:", error);
    res.status(500).json({ error: "Could not create the student" });
  }
}

export async function updateStudent(
  req: Request<{ id: string }, {}, Partial<IStudent>>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedStudent = await Student.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[students] error updating:", error);
    res.status(500).json({ error: "Could not update the student" });
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[students] error deleting:", error);
    res.status(500).json({ error: "Could not delete the student" });
  }
}
