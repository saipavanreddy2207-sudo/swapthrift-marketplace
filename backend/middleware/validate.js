import { sendError } from "../utils/apiResponse.js";

/**
 * Validates a request property (default: body) with a Zod schema and replaces
 * it with the parsed, coerced result.
 */
export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      return sendError(res, issues.map((issue) => issue.message).join(" | "), 400, { errors: issues });
    }
    req[source] = result.data;
    return next();
  };
}

export default validate;
