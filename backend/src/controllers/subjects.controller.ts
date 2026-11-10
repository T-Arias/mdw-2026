// Controller = capa HTTP: lee req, llama al service, traduce el resultado a status + JSON.
// La logica de negocio vive en services/subjects.service.ts (compartida con el agente).
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import * as subjectsService from "../services/subjects.service.js";
import { CreateSubjectInput, ListSubjectsInput, UpdateSubjectInput } from "../schemas/subject.schema.js";
import { isDuplicateKeyError } from "../lib/is-duplicate-key-error.js";

// QUERY /api/v1/subjects
// Body example: { "career": "Systems", "year": 2, "active": true, "search": "web", "page": 1, "limit": 20 }
export async function listSubjects(req: Request<{}, {}, ListSubjectsInput>, res: Response): Promise<void> {
  try {
    res.status(200).json(await subjectsService.listSubjects(req.body));
  } catch (error) {
    console.error("[subjects] error listing:", error);
    res.status(500).json({ error: "Could not fetch subjects" });
  }
}

export async function getSubjectById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const subject = await subjectsService.findSubjectById(id);

    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    res.status(200).json(subject);
  } catch (error) {
    console.error("[subjects] error fetching by id:", error);
    res.status(500).json({ error: "Could not fetch the subject" });
  }
}

export async function createSubject(req: Request<{}, {}, CreateSubjectInput>, res: Response): Promise<void> {
  try {
    res.status(201).json(await subjectsService.createSubject(req.body));
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      res.status(400).json({ error: error.message });
      return;
    }

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "A subject with this code already exists" });
      return;
    }

    console.error("[subjects] error creating:", error);
    res.status(500).json({ error: "Could not create the subject" });
  }
}

export async function updateSubject(
  req: Request<{ id: string }, {}, UpdateSubjectInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const updatedSubject = await subjectsService.updateSubject(id, req.body);

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

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "A subject with this code already exists" });
      return;
    }

    console.error("[subjects] error updating:", error);
    res.status(500).json({ error: "Could not update the subject" });
  }
}

export async function deleteSubject(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "The provided id is not valid" });
    return;
  }

  try {
    const deletedSubject = await subjectsService.deleteSubject(id);

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
