import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../utils/validators.js";

const router = Router();

router.post("/", protect, validate(checkoutSchema), orderController.checkout);

export default router;
