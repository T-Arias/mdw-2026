// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listMaterias,
  getMateriaById,
  createMateria,
  updateMateria,
  deleteMateria,
} from "../controllers/materias.controller";
import { validateBody } from "../middlewares/validate";
import {
  createMateriaSchema,
  listMateriasSchema,
  updateMateriaSchema,
} from "../schemas/materia.schema";

const router = Router();

router.query!("/", validateBody(listMateriasSchema), listMaterias);
router.get("/:id", getMateriaById);
router.post("/", validateBody(createMateriaSchema), createMateria);
router.put("/:id", validateBody(updateMateriaSchema), updateMateria);
router.delete("/:id", deleteMateria);

export default router;
