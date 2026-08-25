// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjects.controller";
import { validateBody } from "../middlewares/validate";
import {
  createSubjectSchema,
  listSubjectsSchema,
  updateSubjectSchema,
} from "../schemas/subject.schema";

const router = Router();

router.query!("/", validateBody(listSubjectsSchema), listSubjects);
router.get("/:id", getSubjectById);
router.post("/", validateBody(createSubjectSchema), createSubject);
router.put("/:id", validateBody(updateSubjectSchema), updateSubject);
router.delete("/:id", deleteSubject);

export default router;
