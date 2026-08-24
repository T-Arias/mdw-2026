// Aggregates every v1 resource router. New entities get mounted here, not in server.ts.
import { Router } from "express";
import studentsRouter from "./students.routes";
import authRouter from "./auth.routes";
import tokensRouter from "./tokens.routes";

const router = Router();

router.use("/students", studentsRouter);
router.use("/auth", authRouter);
router.use("/tokens", tokensRouter);

export default router;
