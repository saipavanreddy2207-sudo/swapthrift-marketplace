import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  idParamSchema,
  reviewQuerySchema,
  reviewResponseSchema,
  reviewSchema,
} from "../utils/validators.js";

const router = Router();

router.get("/", validate(reviewQuerySchema, "query"), reviewController.listReviews);
router.post("/", protect, validate(reviewSchema), reviewController.createReview);
router.patch(
  "/:id/response",
  protect,
  validate(idParamSchema, "params"),
  validate(reviewResponseSchema),
  reviewController.respondToReview,
);

export default router;
