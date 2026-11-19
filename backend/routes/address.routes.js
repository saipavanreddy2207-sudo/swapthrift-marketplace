import { Router } from "express";
import * as addressController from "../controllers/address.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addressSchema, addressUpdateSchema, idParamSchema } from "../utils/validators.js";

const router = Router();

router.use(protect);

router.get("/", addressController.listAddresses);
router.post("/", validate(addressSchema), addressController.createAddress);
router.put(
  "/:id",
  validate(idParamSchema, "params"),
  validate(addressUpdateSchema),
  addressController.updateAddress,
);
router.delete("/:id", validate(idParamSchema, "params"), addressController.deleteAddress);

export default router;
