import { promises as fs } from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import {
  UPLOAD_DIR,
  uploadFileUrl,
  localPublicId,
  localFilenameFromPublicId,
} from "./uploads.js";

let configured = false;

/**
 * Reads the environment lazily (after dotenv has been loaded) and configures
 * Cloudinary on first actual use.
 */
function ensureConfigured() {
  if (configured) return true;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
  return true;
}

export function isCloudinaryConfigured() {
  return ensureConfigured();
}

function missingConfigError() {
  return new Error(
    "Cloudinary ist nicht konfiguriert. Bitte CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY und CLOUDINARY_API_SECRET in .env setzen.",
  );
}

/**
 * Uploads an image buffer to Cloudinary. Used only when Cloudinary is configured;
 * otherwise multer stores the file on disk and `imageFromFile` builds the URL.
 * @param {Buffer} buffer image bytes
 * @param {string} folder Cloudinary folder
 * @returns {Promise<{url:string, publicId:string}>}
 */
export function uploadImage(buffer, folder = "swapthrift") {
  if (!ensureConfigured()) {
    throw missingConfigError();
  }
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Kein Bild-Puffer für den Upload übergeben.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary hat kein Upload-Ergebnis zurückgegeben."));
          return;
        }
        resolve({ url: result.secure_url || result.url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

async function deleteLocalImage(filename) {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
    return { result: "deleted" };
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`[uploads] Löschen von ${filename} fehlgeschlagen: ${error.message}`);
    }
    return { result: "missing" };
  }
}

/**
 * Deletes an image from Cloudinary or from the local uploads directory.
 * Missing configuration, a missing id and filesystem errors are no-ops so
 * cleanup never breaks a request.
 * @param {string|null|undefined} publicId
 */
export async function deleteImage(publicId) {
  const localFilename = localFilenameFromPublicId(publicId);
  if (localFilename) {
    return deleteLocalImage(localFilename);
  }
  if (!publicId) {
    return { result: "missing" };
  }
  if (!ensureConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[cloudinary] Nicht konfiguriert – Bild ${publicId} wurde nicht gelöscht.`);
    }
    return { result: "skipped" };
  }
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`[cloudinary] Löschen von ${publicId} fehlgeschlagen: ${error.message}`);
    return { result: "error", error: error.message };
  }
}

/**
 * Builds the image object `{url, publicId, isMain}` from a multer file.
 * Local disk files are converted to an absolute URL via API_PUBLIC_URL.
 */
export async function imageFromFile(file, folder = "swapthrift", isMain = false) {
  if (!file) {
    throw new Error("Keine Bilddatei übergeben.");
  }

  const uploaded =
    file.filename && file.path
      ? { url: uploadFileUrl(file.filename), publicId: localPublicId(file.filename) }
      : await uploadImage(file.buffer, folder);

  return { url: uploaded.url, publicId: uploaded.publicId, isMain };
}

export default cloudinary;
