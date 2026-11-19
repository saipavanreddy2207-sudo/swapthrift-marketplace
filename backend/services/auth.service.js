import { randomBytes } from "node:crypto";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateEmailToken,
  generatePasswordResetToken,
  verifyToken,
} from "../utils/token.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./email.service.js";

const DAY = 24 * 60 * 60 * 1000;

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function registerUser(data) {
  const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) {
    throw httpError(409, "Diese E-Mail-Adresse ist bereits registriert.");
  }

  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    phone: data.phone || "",
    city: data.city,
    postalCode: data.postalCode,
    gdprConsent: {
      terms: Boolean(data.terms),
      privacy: Boolean(data.privacy),
      acceptedAt: new Date(),
    },
  });

  try {
    const token = generateEmailToken(user);
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + DAY);
    await user.save({ validateBeforeSave: false });
    await sendVerificationEmail(user, token);
  } catch (error) {
    console.warn(`[auth] Bestätigungs-E-Mail konnte nicht versendet werden: ${error.message}`);
  }

  return { user, token: generateAccessToken(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, "E-Mail-Adresse oder Passwort ist falsch.");
  }
  if (!user.isActive) {
    throw httpError(403, "Dieses Benutzerkonto ist nicht aktiv.");
  }
  if (user.isSuspended) {
    throw httpError(403, "Dieses Benutzerkonto ist gesperrt.");
  }
  return { user, token: generateAccessToken(user) };
}

export async function verifyEmail(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw httpError(400, "Der Bestätigungslink ist ungültig oder abgelaufen.");
  }
  if (payload.type !== "email") {
    throw httpError(400, "Ungültiger Bestätigungstoken.");
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw httpError(400, "Benutzerkonto nicht gefunden.");
  }
  if (user.isEmailVerified) {
    return { user, alreadyVerified: true };
  }
  if (user.emailVerificationToken !== token) {
    throw httpError(400, "Dieser Bestätigungslink ist nicht mehr gültig.");
  }
  if (user.emailVerificationExpires && user.emailVerificationExpires.getTime() < Date.now()) {
    throw httpError(400, "Der Bestätigungslink ist abgelaufen.");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  await sendWelcomeEmail(user).catch((error) =>
    console.warn(`[auth] Willkommens-E-Mail fehlgeschlagen: ${error.message}`),
  );

  return { user, alreadyVerified: false };
}

export async function resendVerification(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw httpError(404, "Benutzerkonto nicht gefunden.");
  }
  if (user.isEmailVerified) {
    return { alreadyVerified: true };
  }

  const token = generateEmailToken(user);
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + DAY);
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, token);
  return { alreadyVerified: false };
}

/** Public variant: always behaves the same way so accounts cannot be enumerated. */
export async function resendVerificationByEmail(email) {
  const user = await User.findOne({ email: String(email || "").toLowerCase().trim() });
  if (!user || !user.isActive || user.isEmailVerified) {
    return { sent: false };
  }
  const token = generateEmailToken(user);
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + DAY);
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, token);
  return { sent: true };
}

export async function changeEmail(userId, password, newEmail) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw httpError(404, "Benutzerkonto nicht gefunden.");
  }
  if (!(await user.comparePassword(password))) {
    throw httpError(401, "Das Passwort ist falsch.");
  }

  const normalized = String(newEmail).toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing && existing._id.toString() !== user._id.toString()) {
    throw httpError(409, "Diese E-Mail-Adresse wird bereits verwendet.");
  }

  user.email = normalized;
  user.isEmailVerified = false;
  const token = generateEmailToken(user);
  user.emailVerificationToken = token;
  user.emailVerificationExpires = new Date(Date.now() + DAY);
  await user.save({ validateBeforeSave: false });
  await sendVerificationEmail(user, token).catch((error) =>
    console.warn(`[auth] Bestätigungs-E-Mail fehlgeschlagen: ${error.message}`),
  );
  return user;
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always behave the same way so accounts cannot be enumerated.
  if (!user || !user.isActive) {
    return true;
  }

  try {
    const token = generatePasswordResetToken(user);
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user, token);
  } catch (error) {
    console.warn(`[auth] Passwort-Reset-E-Mail fehlgeschlagen: ${error.message}`);
  }
  return true;
}

export async function resetPassword(token, password) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw httpError(400, "Der Reset-Link ist ungültig oder abgelaufen.");
  }
  if (payload.type !== "password") {
    throw httpError(400, "Ungültiger Reset-Token.");
  }

  const user = await User.findById(payload.id).select("+password");
  if (!user || user.passwordResetToken !== token) {
    throw httpError(400, "Der Reset-Link ist ungültig.");
  }
  if (user.passwordResetExpires && user.passwordResetExpires.getTime() < Date.now()) {
    throw httpError(400, "Der Reset-Link ist abgelaufen.");
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return { user, token: generateAccessToken(user) };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw httpError(404, "Benutzerkonto nicht gefunden.");
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw httpError(401, "Das aktuelle Passwort ist falsch.");
  }
  user.password = newPassword;
  await user.save();
  return user;
}

export async function updateProfile(userId, data) {
  const user = await User.findById(userId);
  if (!user) {
    throw httpError(404, "Benutzerkonto nicht gefunden.");
  }

  const simpleFields = ["firstName", "lastName", "phone", "city", "postalCode", "bio"];
  for (const field of simpleFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      user[field] = data[field];
    }
  }
  if (data.location) {
    Object.assign(user.location, data.location);
  }
  if (data.notificationPreferences?.email) {
    Object.assign(user.notificationPreferences.email, data.notificationPreferences.email);
  }
  if (data.notificationPreferences?.inApp) {
    Object.assign(user.notificationPreferences.inApp, data.notificationPreferences.inApp);
  }

  await user.save();
  return user;
}

/**
 * Soft-delete: the account is deactivated and personal data is anonymized so
 * historical orders and reviews still reference a valid user document.
 */
export async function deleteAccount(userId) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw httpError(404, "Benutzerkonto nicht gefunden.");
  }

  user.isActive = false;
  user.isEmailVerified = false;
  user.email = `deleted-${user._id}@anonymized.invalid`;
  user.firstName = "Gelöscht";
  user.lastName = "Nutzer";
  user.phone = "";
  user.bio = "";
  user.avatar = { publicId: null, url: null };
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.password = randomBytes(32).toString("hex");
  await user.save();

  return true;
}

export default {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  resendVerificationByEmail,
  changeEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  deleteAccount,
};
