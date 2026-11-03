// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/students.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { createStudentSchema, listStudentsSchema, updateStudentSchema } from "../schemas/student.schema.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
const onlyAdmin = [authMiddleware, requireRole("admin")];

router.query!("/", validateBody(listStudentsSchema), listStudents);
router.get("/:id", getStudentById);
router.post("/", onlyAdmin, validateBody(createStudentSchema), createStudent);
router.put("/:id", onlyAdmin, validateBody(updateStudentSchema), updateStudent);
router.delete("/:id", onlyAdmin, deleteStudent);

export default router;
