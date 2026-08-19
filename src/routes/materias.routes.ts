// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import {
  listMaterias,
  getMateriaById,
  createMateria,
  updateMateria,
  deleteMateria,
} from "../controllers/materias.controller";

const router = Router();

router.query!("/", listMaterias);
router.get("/:id", getMateriaById);
router.post("/", createMateria);
router.put("/:id", updateMateria);
router.delete("/:id", deleteMateria);

export default router;
