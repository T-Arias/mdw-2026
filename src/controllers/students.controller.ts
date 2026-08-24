import { Request, Response } from "express";
import {
  listStudents as listStudentsService,
  getStudentById as getStudentByIdService,
  createStudent as createStudentService,
  updateStudent as updateStudentService,
  deleteStudent as deleteStudentService,
} from "../services/students.service";
import { ListStudentsInput, CreateStudentInput, UpdateStudentInput } from "../schemas/students.schema";
import { sendError } from "../core/http-error";

// QUERY/GET /api/v1/students
// Body example: { "career": "Systems", "active": true, "search": "ana", "page": 1, "limit": 20 }
export async function listStudents(
  req: Request<{}, {}, ListStudentsInput>,
  res: Response
): Promise<void> {
  try {
    const page = await listStudentsService(req.body);
    res.status(200).json(page);
  } catch (error) {
    sendError(res, error);
  }
}

export async function getStudentById(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const student = await getStudentByIdService(req.params.id);
    res.status(200).json(student);
  } catch (error) {
    sendError(res, error);
  }
}

export async function createStudent(
  req: Request<{}, {}, CreateStudentInput>,
  res: Response
): Promise<void> {
  try {
    const student = await createStudentService(req.body);
    res.status(201).json(student);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateStudent(
  req: Request<{ id: string }, {}, UpdateStudentInput>,
  res: Response
): Promise<void> {
  try {
    const student = await updateStudentService(req.params.id, req.body);
    res.status(200).json(student);
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteStudent(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    await deleteStudentService(req.params.id);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}
