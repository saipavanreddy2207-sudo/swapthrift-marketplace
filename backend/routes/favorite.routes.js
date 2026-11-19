import { Router } from "express";
import * as favoriteController from "../controllers/favorite.controller.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { productIdParamSchema } from "../utils/validators.js";

const router = Router();

router.use(protect);

router.get("/", favoriteController.listFavorites);
router.post(
  "/:productId",
  validate(productIdParamSchema, "params"),
  favoriteController.addFavorite,
);
router.delete(
  "/:productId",
  validate(productIdParamSchema, "params"),
  favoriteController.removeFavorite,
);

export default router;
