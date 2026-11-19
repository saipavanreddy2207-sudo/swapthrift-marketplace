/** German-friendly URL slug, used for admin-created categories. */
export function slugify(value) {
  return String(value ?? "")
    .replace(/ä/gi, "ae")
    .replace(/ö/gi, "oe")
    .replace(/ü/gi, "ue")
    .replace(/ß/gi, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default slugify;
