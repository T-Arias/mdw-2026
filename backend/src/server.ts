import express, { Request, Response } from "express";
// dotenv primero: lib/auth.ts lee las variables de entorno apenas se importa.
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import v1Router from "./routes/index.js";
import { connectMongoDB } from "./config/db.js";

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
type Environment = "development" | "test" | "production";
const NODE_ENV: Environment = (process.env.NODE_ENV as Environment) ?? "development";

// Sin cors ni cookie-parser: el front llama a /api en su mismo origen (proxy de Vite en local,
// rewrite del Static Site en Render), asi que no hay requests cross-origin ni cookies de terceros.

// Better Auth ANTES de express.json(): el handler lee el body crudo del request.
// "*splat" es la sintaxis de comodin de Express 5 (en Express 4 era "*").
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.use("/api/v1", v1Router);

if (NODE_ENV === 'development') {
    app.get("/", (_req: Request, res: Response) => {
        res.send("hola");
    });
}

app.get("/health", (_req: Request, res: Response) => {
    res.json({
        status: "ok",
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

async function startServer(): Promise<void> {
    await connectMongoDB();

    app.listen(PORT, () => {
        console.log(`listening on port ${PORT}`);
    });
}

startServer().catch((error: unknown) => {
    console.error("[server] failed to start:", error);
    process.exit(1);
});