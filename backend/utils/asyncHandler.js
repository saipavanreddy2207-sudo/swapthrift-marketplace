/**
 * Wraps an async Express handler and forwards rejected promises to error middleware.
 */
export function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export default asyncHandler;
