import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import v1Router from "./routes";
import { connectMongoDB } from "./config/db";
import { mountMcpServer } from "./mcp/http";
import { mountOAuthServer } from "./routes/oauth.routes";

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
type Environment = "development" | "test" | "production";
const NODE_ENV: Environment = (process.env.NODE_ENV as Environment) ?? "development";

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // el form de login de /oauth/authorize postea x-www-form-urlencoded
app.use(cookieParser());

mountOAuthServer(app);
app.use("/api/v1", v1Router);
mountMcpServer(app);

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

// Fallback de ruteo (no de errores): cada controller maneja sus propios errores
// con try/catch + sendError(), asi que no hace falta un error handler global aca.
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: { message: "Not found" } });
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
