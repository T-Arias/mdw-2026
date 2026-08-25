import { Router } from "express";
import studentsRouter from "./students.routes";
import materiasRouter from "./materias.routes";
import subjectsRouter from "./subjects.routes";
import authRouter from "./auth.routes";

const router = Router();

router.use("/students", studentsRouter);
router.use("/materias", materiasRouter);
router.use("/subjects", subjectsRouter);
router.use("/auth", authRouter);

export default router;