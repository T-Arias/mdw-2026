// Controller = capa HTTP: lee req, llama al service, traduce el resultado a status + JSON.
// La logica de negocio vive en services/students.service.ts (compartida con el agente).
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import * as studentsService from "../services/students.service.js";
import { CreateStudentInput, ListStudentsInput, UpdateStudentInput } from "../schemas/student.schema.js";

// QUERY /api/v1/students — el body ya viene validado y con defaults por validateBody(listStudentsSchema).
// Body example: { "career": "Systems", "active": true, "search": "ana", "page": 1, "limit": 20 }
export async function listStudents(req: Request<{}, {}, ListStudentsInput>, res: Response): Promise<void> {
  try {
    res.status(200).json(await studentsService.listStudents(req.body));
  } catch (error) {
    console.error("[students] error listing:", error);
    res.status(500).json({ error: "Could not fetch students" });
  }
}

export async function getStudentById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const student = await studentsService.findStudentById(id);

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("[students] error fetching by id:", error);
    res.status(500).json({ error: "Could not fetch the student" });
  }
}

export async function createStudent(req: Request<{}, {}, CreateStudentInput>, res: Response): Promise<void> {
  try {
    res.status(201).json(await studentsService.createStudent(req.body));
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
  req: Request<{ id: string }, {}, UpdateStudentInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedStudent = await studentsService.updateStudent(id, req.body);

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

export async function deleteStudent(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedStudent = await studentsService.deleteStudent(id);

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
