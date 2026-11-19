import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileUpdateSchema } from "../utils/validators.js";

const router = Router();

router.get("/:id", userController.getUser);
router.patch("/me", protect, validate(profileUpdateSchema), userController.updateMe);
router.delete("/me", protect, userController.deleteMe);

export default router;
