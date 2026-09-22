// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/students.controller";
import { validateBody } from "../middlewares/validate";
import { createStudentSchema, listStudentsSchema, updateStudentSchema } from "../schemas/student.schema";
import { requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.query!("/", validateBody(listStudentsSchema), listStudents);
router.get("/:id", getStudentById);
router.post("/", validateBody(createStudentSchema), createStudent);
router.put("/:id", validateBody(updateStudentSchema), updateStudent);
router.delete("/:id", requireRole("USER"), deleteStudent);

export default router;
