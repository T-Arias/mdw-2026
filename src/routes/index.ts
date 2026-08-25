// Aggregates every v1 resource router. New entities get mounted here, not in server.ts.
import { Router } from "express";
import studentsRouter from "./students.routes";
import materiasRouter from "./materias.routes";
import authRouter from "./auth.routes";

const router = Router();

router.use("/students", studentsRouter);
router.use("/materias", materiasRouter);
router.use("/auth", authRouter);

export default router;
