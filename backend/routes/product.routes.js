import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { uploadProductImages } from "../middleware/upload.js";
import {
  productQuerySchema,
  productSchema,
  productUpdateSchema,
  productStatusSchema,
  reportSchema,
} from "../utils/validators.js";

const router = Router();

router.get("/", validate(productQuerySchema, "query"), productController.listProducts);
router.get("/:id", productController.getProduct);

router.post("/", protect, uploadProductImages, validate(productSchema), productController.createProduct);
router.put(
  "/:id",
  protect,
  uploadProductImages,
  validate(productUpdateSchema),
  productController.updateProduct,
);
router.patch(
  "/:id/status",
  protect,
  validate(productStatusSchema),
  productController.updateStatus,
);
router.delete("/:id", protect, productController.deleteProduct);
router.post(
  "/:id/report",
  protect,
  authLimiter,
  validate(reportSchema),
  productController.reportProduct,
);

export default router;
