import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";
import { registerEmitter } from "../services/realtime.service.js";

function cookieValue(header, name) {
  if (typeof header !== "string") return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}

/** Anonymous sockets may connect but never join a user room. */
export function registerSockets(io) {
  registerEmitter(io);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || cookieValue(socket.handshake.headers?.cookie, "token");
    if (!token) return next();

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.id).select("_id isActive isSuspended");
      if (user && user.isActive && !user.isSuspended) {
        socket.data.userId = user._id.toString();
      }
    } catch {
      // Invalid or expired tokens simply stay anonymous. Never log the token.
    }
    return next();
  });

  io.on("connection", (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
      console.log(`[socket] Client ${socket.id} angemeldet als ${socket.data.userId}`);
    } else {
      console.log(`[socket] Anonymer Client ${socket.id} verbunden`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`[socket] Client getrennt: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export default registerSockets;
