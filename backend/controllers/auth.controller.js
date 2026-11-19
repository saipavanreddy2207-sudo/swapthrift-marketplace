import {
  registerUser,
  loginUser,
  verifyEmail as verifyEmailService,
  resendVerification as resendVerificationService,
  resendVerificationByEmail as resendVerificationByEmailService,
  changeEmail as changeEmailService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  changePassword as changePasswordService,
  updateProfile as updateProfileService,
  deleteAccount as deleteAccountService,
} from "../services/auth.service.js";
import { deleteImage, imageFromFile } from "../config/cloudinary.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await registerUser(req.body);
  res.cookie("token", token, cookieOptions());
  return sendSuccess(
    res,
    { user, token },
    "Konto erfolgreich erstellt. Bitte bestätige deine E-Mail-Adresse.",
    201,
  );
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);
  res.cookie("token", token, cookieOptions());
  return sendSuccess(res, { user, token }, "Erfolgreich angemeldet.");
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return sendSuccess(res, undefined, "Erfolgreich abgemeldet.");
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { alreadyVerified } = await verifyEmailService(req.body.token);
  return sendSuccess(
    res,
    undefined,
    alreadyVerified
      ? "Die E-Mail-Adresse ist bereits bestätigt."
      : "E-Mail-Adresse erfolgreich bestätigt.",
  );
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  if (req.user) {
    const { alreadyVerified } = await resendVerificationService(req.user._id);
    return sendSuccess(
      res,
      undefined,
      alreadyVerified
        ? "Deine E-Mail-Adresse ist bereits bestätigt."
        : "Eine neue Bestätigungs-E-Mail wurde versendet.",
    );
  }

  await resendVerificationByEmailService(req.body.email);
  return sendSuccess(
    res,
    undefined,
    "Falls ein Konto mit dieser E-Mail-Adresse existiert und noch nicht bestätigt wurde, wurde eine neue Bestätigungs-E-Mail versendet.",
  );
});

export const changeEmail = asyncHandler(async (req, res) => {
  const user = await changeEmailService(
    req.user._id,
    req.body.password,
    req.body.newEmail,
  );
  return sendSuccess(
    res,
    { user },
    "E-Mail-Adresse geändert. Bitte bestätige die neue Adresse.",
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await forgotPasswordService(req.body.email);
  return sendSuccess(
    res,
    undefined,
    "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des Passworts versendet.",
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  await resetPasswordService(req.body.token, req.body.password);
  return sendSuccess(res, undefined, "Passwort erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.");
});

export const changePassword = asyncHandler(async (req, res) => {
  await changePasswordService(req.user._id, req.body.currentPassword, req.body.newPassword);
  return sendSuccess(res, undefined, "Passwort erfolgreich geändert.");
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await updateProfileService(req.user._id, req.body);
  return sendSuccess(res, { user }, "Profil erfolgreich aktualisiert.");
});

export const deleteMe = asyncHandler(async (req, res) => {
  await deleteAccountService(req.user._id);
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return sendSuccess(res, undefined, "Dein Konto wurde gelöscht.");
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Keine Bilddatei übergeben.", 400);
  }

  const uploaded = await imageFromFile(req.file, "swapthrift/avatars");
  const user = await User.findById(req.user._id);
  const oldPublicId = user.avatar?.publicId;
  user.avatar = { url: uploaded.url, publicId: uploaded.publicId };
  await user.save({ validateBeforeSave: false });

  if (oldPublicId) {
    await deleteImage(oldPublicId);
  }
  return sendSuccess(res, { user }, "Profilbild erfolgreich aktualisiert.");
});

export default {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerificationEmail,
  changeEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  updateMe,
  deleteMe,
  uploadAvatar,
};
