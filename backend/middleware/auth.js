import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";
import { sendError } from "../utils/apiResponse.js";

function extractToken(req) {
  const header = req.headers?.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return req.cookies?.token || null;
}

async function authenticate(req, res, next, required) {
  try {
    const token = extractToken(req);
    if (!token) {
      if (required) {
        return sendError(res, "Bitte melde dich an, um diese Aktion auszuführen.", 401);
      }
      req.user = null;
      return next();
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);

    if (!user) {
      return sendError(res, "Benutzerkonto nicht gefunden.", 401);
    }
    if (!user.isActive) {
      return sendError(res, "Dieses Benutzerkonto ist nicht aktiv.", 403);
    }
    if (user.isSuspended) {
      return sendError(res, "Dieses Benutzerkonto ist gesperrt.", 403);
    }

    req.user = user;
    req.tokenPayload = payload;
    return next();
  } catch (error) {
    return sendError(res, "Ungültiger oder abgelaufener Authentifizierungstoken.", 401);
  }
}

/** Requires a valid Bearer token or `token` cookie. */
export function protect(req, res, next) {
  return authenticate(req, res, next, true);
}

/** Attaches the user when a valid token is present, otherwise continues anonymously. */
export function optionalAuth(req, res, next) {
  return authenticate(req, res, next, false);
}

/** Role guard to be used after `protect`. */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Bitte melde dich an, um diese Aktion auszuführen.", 401);
    }
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
    if (!roles.length || !roles.some((role) => userRoles.includes(role))) {
      return sendError(res, "Du hast keine Berechtigung für diese Aktion.", 403);
    }
    return next();
  };
}

export default { protect, optionalAuth, authorize };
