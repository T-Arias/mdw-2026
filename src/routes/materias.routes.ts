import { Router } from "express";
import { materiasCors } from "../middlewares/cors.middleware";
import {
  listMaterias,
  getMateriaById,
  createMateria,
  updateMateria,
  deleteMateria,
} from "../controllers/materias.controller";

const router = Router();

router.use(materiasCors);

router.get("/", listMaterias);
router.get("/:id", getMateriaById);
router.post("/", createMateria);
router.put("/:id", updateMateria);
router.delete("/:id", deleteMateria);

export default router;