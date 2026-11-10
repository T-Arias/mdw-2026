// PASO 6 — Ruta: POST /api/v1/agent/chat.
// authMiddleware obligatorio: cada mensaje gasta cuota de Groq, no puede quedar abierto a cualquiera.
import { Router } from "express";
import { chat } from "../controllers/agent.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { chatSchema } from "../schemas/agent.schema.js";

const router = Router();

router.post(
  "/chat",
  (req, _res, next) => {
    // Primer log del trazado: llego el request, todavia sin auth ni validacion.
    console.log(`\n[① route] POST /api/v1/agent/chat body=${JSON.stringify(req.body)}`);
    next();
  },
  authMiddleware, // ② sin sesion → 401 y no sigue
  validateBody(chatSchema), // ② mensaje invalido → 400 y no sigue
  chat
);

export default router;
