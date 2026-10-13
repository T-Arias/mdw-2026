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
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();
const onlyAdmin = [authMiddleware, requireRole("ADMIN")];

router.query!("/", validateBody(listStudentsSchema), listStudents);
router.get("/:id", getStudentById);
router.post("/", onlyAdmin, validateBody(createStudentSchema), createStudent);
router.put("/:id", onlyAdmin, validateBody(updateStudentSchema), updateStudent);
router.delete("/:id", onlyAdmin, deleteStudent);

export default router;
