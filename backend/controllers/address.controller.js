import Address from "../models/Address.js";
import { httpError } from "../utils/httpError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id })
    .sort({ isDefault: -1, createdAt: 1 })
    .lean();
  return sendSuccess(res, { addresses });
});

export const createAddress = asyncHandler(async (req, res) => {
  const { label, firstName, lastName, street, houseNumber, postalCode, city, country, isDefault } =
    req.body;
  const hasAddresses = await Address.exists({ user: req.user._id });
  const makeDefault = Boolean(isDefault || !hasAddresses);

  if (makeDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    user: req.user._id,
    label,
    firstName,
    lastName,
    street,
    houseNumber,
    postalCode,
    city,
    country,
    isDefault: makeDefault,
  });

  return sendSuccess(res, { address }, "Adresse erfolgreich gespeichert.", 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw httpError(404, "Adresse nicht gefunden.");
  }

  const wasDefault = address.isDefault;
  const requestedDefault = req.body.isDefault;
  Object.assign(address, req.body);

  if (requestedDefault === true) {
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { isDefault: false },
    );
    address.isDefault = true;
  } else if (wasDefault && requestedDefault === false) {
    const fallback = await Address.findOne({
      user: req.user._id,
      _id: { $ne: address._id },
    }).sort({ createdAt: 1 });
    if (fallback) {
      fallback.isDefault = true;
      await fallback.save();
    }
  }

  await address.save();
  return sendSuccess(res, { address }, "Adresse erfolgreich aktualisiert.");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) {
    throw httpError(404, "Adresse nicht gefunden.");
  }

  if (address.isDefault) {
    const next = await Address.findOne({ user: req.user._id }).sort({ createdAt: 1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return sendSuccess(res, undefined, "Adresse erfolgreich gelöscht.");
});

export default { listAddresses, createAddress, updateAddress, deleteAddress };
