import mongoose from "mongoose";
import dns from "dns";

// Force Node.js to use public DNS servers to bypass local routing/ISP issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Check your .env file (see .env.example)."
    );
  }

  return uri;
}

export async function connectMongoDB(): Promise<void> {
  const uri = getMongoUri();

  mongoose.connection.on("connected", () => {
    console.log("[mongodb] connection established");
  });

  mongoose.connection.on("error", (error: Error) => {
    console.error("[mongodb] connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[mongodb] connection lost");
  });

  await mongoose.connect(uri);
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.connection.close();
  console.log("[mongodb] connection closed");
}
