import rateLimit from "express-rate-limit";

const baseOptions = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Zu viele Anfragen. Bitte versuche es in wenigen Minuten erneut.",
  },
};

/** Stricter limits for login, registration and password endpoints. */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: false,
});

/** General API rate limit. */
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

export default { authLimiter, apiLimiter };
