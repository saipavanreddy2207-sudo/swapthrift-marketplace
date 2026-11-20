import { mkdir } from "node:fs/promises";
import multer from "multer";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import { UPLOAD_DIR, isAllowedImageMime, newLocalFilename } from "../config/uploads.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_AVATAR_IMAGES = 1;

function imageFilter(req, file, callback) {
  if (!isAllowedImageMime(file.mimetype)) {
    const error = new Error("Nur JPEG-, PNG-, WebP-, GIF- oder AVIF-Bilder sind erlaubt.");
    error.statusCode = 400;
    return callback(error);
  }
  return callback(null, true);
}

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    mkdir(UPLOAD_DIR, { recursive: true })
      .then(() => callback(null, UPLOAD_DIR))
      .catch(callback);
  },
  filename(req, file, callback) {
    callback(null, newLocalFilename(file.mimetype));
  },
});

function uploaders(field, maxFiles) {
  const limits = { fileSize: MAX_FILE_SIZE, files: maxFiles };
  const common = { fileFilter: imageFilter, limits };
  const memory = multer({ ...common, storage: memoryStorage }).array(field, maxFiles);
  const disk = multer({ ...common, storage: diskStorage }).array(field, maxFiles);
  return {
    cloudinary: memory,
    // Serverless filesystems are read-only; keep bytes in memory for MongoDB.
    local: process.env.VERCEL ? memory : disk,
  };
}

function avatarUploaders() {
  const limits = { fileSize: MAX_FILE_SIZE, files: MAX_AVATAR_IMAGES };
  const common = { fileFilter: imageFilter, limits };
  const memory = multer({ ...common, storage: memoryStorage }).single("avatar");
  const disk = multer({ ...common, storage: diskStorage }).single("avatar");
  return {
    cloudinary: memory,
    local: process.env.VERCEL ? memory : disk,
  };
}

const productUploaders = uploaders("images", MAX_PRODUCT_IMAGES);
const avatarUploadersMap = avatarUploaders();

/** Chooses the upload engine at request time so dotenv is loaded first. */
function pick(variants) {
  return isCloudinaryConfigured() ? variants.cloudinary : variants.local;
}

function withFriendlyErrors(handler, avatar) {
  return (req, res, next) =>
    handler(req, res, (error) => {
      if (
        avatar &&
        error?.name === "MulterError" &&
        ["LIMIT_UNEXPECTED_FILE", "LIMIT_FILE_COUNT"].includes(error.code)
      ) {
        error.message = "Es ist nur ein Profilbild erlaubt.";
      }
      return next(error);
    });
}

/** Multipart middleware for up to five product images (`images`). */
export const uploadProductImages = withFriendlyErrors(
  (req, res, next) => pick(productUploaders)(req, res, next),
  false,
);

/** Multipart middleware for a single avatar image (`avatar`). */
export const uploadAvatar = withFriendlyErrors(
  (req, res, next) => pick(avatarUploadersMap)(req, res, next),
  true,
);

export default { uploadProductImages, uploadAvatar };
