import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  conversationSchema,
  idParamSchema,
  messageQuerySchema,
  messageSchema,
} from "../utils/validators.js";

const router = Router();

router.use(protect);

router.get("/", conversationController.listConversations);
router.post("/", validate(conversationSchema), conversationController.createConversation);
router.get(
  "/:id/messages",
  validate(idParamSchema, "params"),
  validate(messageQuerySchema, "query"),
  conversationController.listMessages,
);
router.post(
  "/:id/messages",
  validate(idParamSchema, "params"),
  validate(messageSchema),
  conversationController.sendMessage,
);
router.patch(
  "/:id/read",
  validate(idParamSchema, "params"),
  conversationController.markConversationRead,
);

export default router;
