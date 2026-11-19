import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamSchema, orderQuerySchema, orderStatusSchema } from "../utils/validators.js";

const router = Router();

router.use(protect);

router.get("/", validate(orderQuerySchema, "query"), orderController.listOrders);
router.get("/:id", validate(idParamSchema, "params"), orderController.getOrder);
router.patch(
  "/:id/status",
  validate(idParamSchema, "params"),
  validate(orderStatusSchema),
  orderController.updateOrderStatus,
);
router.post("/:id/cancel", validate(idParamSchema, "params"), orderController.cancelOrder);

export default router;
