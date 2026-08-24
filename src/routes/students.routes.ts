// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/students.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { listStudentsSchema, createStudentSchema, updateStudentSchema } from "../schemas/students.schema";

const router = Router();

router.use(authMiddleware);

// QUERY es un metodo no estandar y muchos clientes/intermediarios lo manejan mal;
// se deja GET tambien como via normal hacia el mismo listado (filtros en el body).
router.query!("/", validateBody(listStudentsSchema), listStudents);
router.get("/", validateBody(listStudentsSchema), listStudents);
router.get("/:id", getStudentById);
router.post("/", validateBody(createStudentSchema), createStudent);
router.put("/:id", validateBody(updateStudentSchema), updateStudent);
router.delete("/:id", deleteStudent);

export default router;
