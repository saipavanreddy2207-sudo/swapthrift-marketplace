import { Router } from "express";
import * as sellerController from "../controllers/seller.controller.js";
import { validate } from "../middleware/validate.js";
import { sellerQuerySchema } from "../utils/validators.js";

const router = Router();

router.get("/", validate(sellerQuerySchema, "query"), sellerController.listSellers);

export default router;
