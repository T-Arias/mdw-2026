// Aggregates every v1 resource router. New entities get mounted here, not in server.ts.
import { Router } from "express";
import studentsRouter from "./students.routes.js";
import subjectsRouter from "./subjects.routes.js";

const router = Router();

router.use("/students", studentsRouter);
router.use("/subjects", subjectsRouter);

export default router;
