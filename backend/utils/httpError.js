/** Creates an error with an HTTP status code for the centralized error handler. */
export function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export default httpError;
