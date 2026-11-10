// Aggregates every v1 resource router. New entities get mounted here, not in server.ts.
import { Router } from "express";
import studentsRouter from "./students.routes.js";
import subjectsRouter from "./subjects.routes.js";
import agentRouter from "./agent.routes.js";

const router = Router();

router.use("/students", studentsRouter);
router.use("/subjects", subjectsRouter);
router.use("/agent", agentRouter);

export default router;
