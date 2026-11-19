/**
 * Standard success envelope used by every controller.
 */
export function sendSuccess(res, data, message, status = 200) {
  const body = { success: true };
  if (message !== undefined && message !== null) {
    body.message = message;
  }
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(status).json(body);
}

/**
 * Standard error envelope used by controllers and the centralized error handler.
 */
export function sendError(res, message, status = 400, extra = {}) {
  return res.status(status).json({
    success: false,
    message: message || "Es ist ein Fehler aufgetreten.",
    ...extra,
  });
}

export default { sendSuccess, sendError };
