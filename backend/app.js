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
import {
  UPLOAD_DIR,
  UPLOAD_ROUTE,
  isAllowedImageMime,
  isSafeLocalFilename,
} from "./config/uploads.js";
import { getUpload } from "./config/uploadStore.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * Both origins are accepted so local development, the self-healing tunnel and
 * a hosted Vercel deployment all work without code changes.
 */
const allowedOrigins = [
  // Vercel exposes the live deployment hostname at runtime.
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
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

let readyPromise;

/** Connect + seed once per running instance (cold start on serverless). */
export function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await connectDB(process.env.MONGO_URI);
      await runSeed();
    })().catch((error) => {
      readyPromise = undefined;
      throw error;
    });
  }
  return readyPromise;
}

// On serverless platforms there is no separate startup script, so the first
// request of a cold instance waits for the database before reaching a route.
app.use((req, res, next) => {
  if (!process.env.VERCEL) return next();
  ensureReady().then(() => next()).catch(next);
});

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function serveUploads(directory) {
  app.use(
    UPLOAD_ROUTE,
    express.static(directory, {
      fallthrough: true,
      maxAge: "1d",
      setHeaders(res) {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    }),
  );
}

serveUploads(UPLOAD_DIR);

// MongoDB-backed uploads (serverless) are served through the same /uploads
// route as the bundled demo images.
app.get(`${UPLOAD_ROUTE}/:filename`, async (req, res, next) => {
  const { filename } = req.params;
  if (!isSafeLocalFilename(filename)) {
    return res.status(400).json({ success: false, message: "Ungültiger Dateiname." });
  }
  try {
    const upload = await getUpload(filename);
    if (!upload?.data || !isAllowedImageMime(upload.contentType)) return next();
    const bytes = Buffer.isBuffer(upload.data)
      ? upload.data
      : Buffer.from(upload.data.buffer || upload.data);
    if (!bytes.length) return next();
    res.setHeader("Content-Type", upload.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    return res.send(bytes);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/health", health);

app.use("/api", apiLimiter);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

const io = new SocketServer(server, {
  cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
});

registerSockets(io);

export { app, server, io, allowedOrigins };
export default server;
