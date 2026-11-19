import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { categorySchema } from "../utils/validators.js";

const router = Router();

router.get("/", categoryController.listCategories);
router.post(
  "/",
  protect,
  authorize("admin"),
  validate(categorySchema),
  categoryController.createCategory,
);
router.get("/:id", categoryController.getCategory);

export default router;
