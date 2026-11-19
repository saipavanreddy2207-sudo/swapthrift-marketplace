import http from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server as SocketServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { health } from "./controllers/health.controller.js";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { runSeed } from "./utils/seed.js";
import { registerSockets } from "./sockets/index.js";
import { UPLOAD_DIR, UPLOAD_ROUTE } from "./config/uploads.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/**
 * Local development uses one origin; hosted deployments often use a Vercel/
 * Netlify preview URL plus the production URL. Both variables accept a
 * comma-separated list so no code change is needed when the frontend URL changes.
 */
const allowedOrigins = [
  ...String(process.env.CLIENT_URL || "http://localhost:5173").split(","),
  ...String(process.env.CORS_ORIGINS || "").split(","),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsOrigin(origin, callback) {
  // Health checks and server-to-server clients send no Origin header.
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
}

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
  UPLOAD_ROUTE,
  express.static(UPLOAD_DIR, {
    fallthrough: true,
    maxAge: "1d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      // Uploads are consumed by the frontend on a different origin.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

app.get("/api/health", health);

app.use("/api", apiLimiter);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

const io = new SocketServer(server, {
  cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
});

registerSockets(io);

async function startServer() {
  try {
    await connectDB(process.env.MONGO_URI);
    await runSeed();
    server.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
