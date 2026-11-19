import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, notificationQuerySchema } from "../utils/validators.js";

const router = Router();

router.use(protect);

router.get(
  "/",
  validate(notificationQuerySchema, "query"),
  notificationController.listNotifications,
);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch(
  "/:id/read",
  validate(idParamSchema, "params"),
  notificationController.markNotificationRead,
);
router.delete("/:id", validate(idParamSchema, "params"), notificationController.deleteNotification);

export default router;
