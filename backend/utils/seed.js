import { pathToFileURL } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import { seedDefaultCategories } from "../services/category.service.js";

dotenv.config();

/** Creates (or upgrades) the single admin account defined by ADMIN_EMAIL / ADMIN_PASSWORD. */
export async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[seed] ADMIN_EMAIL / ADMIN_PASSWORD fehlen – kein Admin-Konto angelegt.");
    }
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    let changed = false;
    if (!existing.roles.includes("admin")) {
      existing.roles.push("admin");
      changed = true;
    }
    if (!existing.isEmailVerified) {
      existing.isEmailVerified = true;
      changed = true;
    }
    if (changed) {
      await existing.save({ validateBeforeSave: false });
    }
    return existing;
  }

  const admin = await User.create({
    firstName: "Admin",
    lastName: "SwapThrift",
    email: normalizedEmail,
    password,
    city: "Berlin",
    postalCode: "10115",
    roles: ["admin", "seller"],
    isEmailVerified: true,
    isActive: true,
    gdprConsent: {
      terms: true,
      privacy: true,
      acceptedAt: new Date(),
    },
  });
  console.log(`[seed] Admin-Konto angelegt: ${admin.email}`);
  return admin;
}

/** Seeds categories and admin. `connect` is only needed for standalone CLI usage. */
export async function runSeed({ connect = false } = {}) {
  if (connect) {
    await connectDB(process.env.MONGO_URI);
  }
  const categories = await seedDefaultCategories();
  const admin = await seedAdminUser();
  return { categories: categories.length, admin: admin ? admin.email : null };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runSeed({ connect: true })
    .then((result) => {
      console.log(
        `[seed] Fertig: ${result.categories} Kategorien, Admin: ${result.admin || "nicht konfiguriert"}`,
      );
    })
    .catch((error) => {
      console.error("[seed] Fehler:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

export default { seedAdminUser, runSeed };
