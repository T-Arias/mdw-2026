// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import { registerUser, login, logout, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/register", validateBody(registerSchema), registerUser);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

export default router;
