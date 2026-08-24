// Mapping between (HTTP method + path) and controller. No business logic here.
import { Router } from "express";
import { createToken, getTokens, deleteToken } from "../controllers/tokens.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { issueTokenSchema } from "../schemas/token.schema";

const router = Router();

// Los tokens se emiten con sesion de navegador (cookie), no con otro token.
router.use(authMiddleware);

router.post("/", validateBody(issueTokenSchema), createToken);
router.get("/", getTokens);
router.delete("/:id", deleteToken);

export default router;
