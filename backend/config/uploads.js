import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to backend/uploads (independent of the current working directory). */
export const UPLOAD_DIR = fileURLToPath(new URL("../uploads/", import.meta.url));
export const UPLOAD_ROUTE = "/uploads";

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export function isAllowedImageMime(mimetype) {
  return Boolean(MIME_EXTENSIONS[mimetype]);
}

export function mimeExtension(mimetype) {
  return MIME_EXTENSIONS[mimetype] || "";
}

export function publicBaseUrl() {
  return (process.env.API_PUBLIC_URL || "http://localhost:5000").replace(/\/+$/, "");
}

/** Absolute, publicly reachable URL for a locally stored upload. */
export function uploadFileUrl(filename) {
  return `${publicBaseUrl()}${UPLOAD_ROUTE}/${encodeURIComponent(filename)}`;
}

export function isSafeLocalFilename(filename) {
  return (
    typeof filename === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,150}$/.test(filename) &&
    !filename.includes("..")
  );
}

export function localPublicId(filename) {
  return `local:${filename}`;
}

/** Returns the safe filename of a `local:<filename>` public id, otherwise null. */
export function localFilenameFromPublicId(publicId) {
  if (typeof publicId !== "string" || !publicId.startsWith("local:")) return null;
  const filename = publicId.slice("local:".length);
  return isSafeLocalFilename(filename) ? filename : null;
}
