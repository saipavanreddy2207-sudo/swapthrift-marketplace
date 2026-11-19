import User from "../models/User.js";
import { updateProfile, deleteAccount } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** Public seller/profile information. Sensitive fields are removed by toJSON. */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isActive: true });
  if (!user) {
    throw httpError(404, "Benutzer nicht gefunden.");
  }
  return sendSuccess(res, { user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body);
  return sendSuccess(res, { user }, "Profil erfolgreich aktualisiert.");
});

export const deleteMe = asyncHandler(async (req, res) => {
  await deleteAccount(req.user._id);
  return sendSuccess(res, undefined, "Dein Konto wurde gelöscht.");
});

export default { getUser, updateMe, deleteMe };
