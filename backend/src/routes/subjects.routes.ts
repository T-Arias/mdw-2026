// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjects.controller.js";
import { validateBody } from "../middlewares/validate.js";
import {
  createSubjectSchema,
  listSubjectsSchema,
  updateSubjectSchema,
} from "../schemas/subject.schema.js";

const router = Router();

router.query!("/", validateBody(listSubjectsSchema), listSubjects);
router.get("/:id", getSubjectById);
router.post("/", validateBody(createSubjectSchema), createSubject);
router.put("/:id", validateBody(updateSubjectSchema), updateSubject);
router.delete("/:id", deleteSubject);

export default router;
