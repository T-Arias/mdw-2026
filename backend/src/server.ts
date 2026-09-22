import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import v1Router from "./routes";
import { connectMongoDB } from "./config/db";

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;
type Environment = "development" | "test" | "production";
const NODE_ENV: Environment = (process.env.NODE_ENV as Environment) ?? "development";

// QUERY no esta en los metodos por defecto de cors: sin esto el preflight de QUERY /subjects falla.
app.use(cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "QUERY"],
}));
app.use(express.json());
app.use(cookieParser());

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