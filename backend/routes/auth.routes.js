import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { uploadAvatar } from "../middleware/upload.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changeEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  profileUpdateSchema,
} from "../utils/validators.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/logout", authController.logout);

router.get("/me", protect, authController.me);
router.patch("/me", protect, validate(profileUpdateSchema), authController.updateMe);
router.delete("/me", protect, authController.deleteMe);

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  "/resend-verification",
  authLimiter,
  optionalAuth,
  validate(resendVerificationSchema),
  authController.resendVerificationEmail,
);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.post(
  "/change-email",
  protect,
  validate(changeEmailSchema),
  authController.changeEmail,
);
router.post("/avatar", protect, uploadAvatar, authController.uploadAvatar);

export default router;
