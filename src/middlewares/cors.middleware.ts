import cors, { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
  origin: process.env.MATERIAS_CORS_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

export const materiasCors = cors(corsOptions);