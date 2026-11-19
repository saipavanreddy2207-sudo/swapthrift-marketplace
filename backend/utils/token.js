import jwt from "jsonwebtoken";

function secret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET fehlt in der Umgebungskonfiguration.");
  }
  return process.env.JWT_SECRET;
}

function sign(payload, expiresIn) {
  return jwt.sign(payload, secret(), { expiresIn });
}

/** Access token used for API authentication (Bearer header or cookie). */
export function generateAccessToken(user) {
  return sign(
    { id: user._id?.toString() || user.id?.toString(), roles: user.roles || ["user"] },
    process.env.JWT_EXPIRES_IN || "7d",
  );
}

/** Short-lived token for email verification. */
export function generateEmailToken(user) {
  return sign(
    { id: user._id?.toString() || user.id?.toString(), type: "email" },
    process.env.EMAIL_TOKEN_EXPIRES_IN || "24h",
  );
}

/** Short-lived token for password resets. */
export function generatePasswordResetToken(user) {
  return sign(
    { id: user._id?.toString() || user.id?.toString(), type: "password" },
    process.env.PASSWORD_RESET_EXPIRES_IN || "1h",
  );
}

/** Verifies and decodes any token signed by this app. */
export function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Ungültiger Token.");
  }
  return jwt.verify(token, secret());
}

export default {
  generateAccessToken,
  generateEmailToken,
  generatePasswordResetToken,
  verifyToken,
};
