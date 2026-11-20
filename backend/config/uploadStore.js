import mongoose from "mongoose";

/**
 * Serverless filesystems are ephemeral and not shared between function
 * instances. When deployed without Cloudinary, image bytes are kept in
 * MongoDB and served through the regular /uploads route.
 */
const COLLECTION = "uploads";

export async function saveUpload(filename, buffer, contentType) {
  await mongoose.connection.db.collection(COLLECTION).updateOne(
    { _id: filename },
    {
      $set: {
        data: buffer,
        contentType: contentType || "application/octet-stream",
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );
}

export async function getUpload(filename) {
  return mongoose.connection.db.collection(COLLECTION).findOne({ _id: filename });
}

export async function deleteUpload(filename) {
  await mongoose.connection.db.collection(COLLECTION).deleteOne({ _id: filename });
}
