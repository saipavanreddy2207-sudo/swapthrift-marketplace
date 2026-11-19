import mongoose from "mongoose";

export function health(req, res) {
  const connected = mongoose.connection.readyState === 1;
  return res.status(200).json({
    status: "ok",
    database: connected ? "connected" : "disconnected",
    app: "SwapThrift",
    currency: "EUR",
    uptime: Math.round(process.uptime()),
  });
}

export default { health };
