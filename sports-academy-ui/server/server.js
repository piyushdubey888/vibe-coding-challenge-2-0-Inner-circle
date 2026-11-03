import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import playersRouter from "./routes/player.js";
import matchesRouter from "./routes/matches.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    // Allow the React app on any local port (Vite may pick 5173, 5174, 5175...)
    origin: /^http:\/\/localhost:\d+$/,
  })
);

app.use(express.json({ limit: "10mb" }));

// Player API routes
app.use("/api/players", playersRouter);
app.use("/api/matches", matchesRouter);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Sports Academy API is running!",
  });
});

// Database health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from the .env file");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

startServer();