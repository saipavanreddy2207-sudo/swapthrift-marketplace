const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
  "/": "&#47;",
};

/** Escapes basic HTML characters in a string. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (char) => HTML_ENTITIES[char] || char);
}

/** Removes HTML tags and collapses whitespace. */
export function stripHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escapes characters that have a special meaning in a regular expression. */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default { escapeHtml, stripHtml, escapeRegex };
