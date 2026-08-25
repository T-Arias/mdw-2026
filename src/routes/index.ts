import { Router } from "express";
import studentsRouter from "./students.routes";
import authRouter from "./auth.routes";
import materiasRouter from "./materias.routes";

const router = Router();

router.use("/students", studentsRouter);
router.use("/auth", authRouter);
router.use("/materias", materiasRouter);

export default router;
