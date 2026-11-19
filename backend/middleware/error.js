import { sendError } from "../utils/apiResponse.js";

export function notFound(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} nicht gefunden`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let status = error.statusCode || error.status || 500;
  let message = error.message || "Interner Serverfehler";
  const extra = {};

  if (error.name === "ValidationError") {
    status = 400;
    message = Object.values(error.errors || {})
      .map((item) => item.message)
      .join(" | ");
  } else if (error.name === "CastError") {
    status = 400;
    message = `Ungültiger Wert für ${error.path}: ${error.value}`;
  } else if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyValue || {})[0] || "Feld";
    message = `${field} ist bereits vergeben.`;
  } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    status = 401;
    message = "Ungültiger oder abgelaufener Token.";
  } else if (error.name === "MulterError") {
    status = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Ein Bild darf höchstens 5 MB groß sein.";
    } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Es sind höchstens 5 Bilder pro Angebot erlaubt.";
    } else {
      message = `Ungültiger Datei-Upload: ${error.message}`;
    }
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Ungültiges JSON im Request-Body.";
  }

  if (status >= 500) {
    console.error("[error]", error);
    if (process.env.NODE_ENV === "production") {
      message = "Interner Serverfehler. Bitte versuche es später erneut.";
    }
  }

  return sendError(res, message, status, extra);
}

export default { notFound, errorHandler };
