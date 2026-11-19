import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminProductQuerySchema,
  productStatusSchema,
  adminReportQuerySchema,
  adminReportUpdateSchema,
  adminUserQuerySchema,
  adminUserStatusSchema,
  idParamSchema,
} from "../utils/validators.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/overview", adminController.overview);

router.get(
  "/reports",
  validate(adminReportQuerySchema, "query"),
  adminController.listReports,
);
router.patch(
  "/reports/:id",
  validate(idParamSchema, "params"),
  validate(adminReportUpdateSchema),
  adminController.updateReport,
);

router.get(
  "/products",
  validate(adminProductQuerySchema, "query"),
  adminController.listProducts,
);
router.patch(
  "/products/:id/status",
  validate(idParamSchema, "params"),
  validate(productStatusSchema),
  adminController.updateProductStatus,
);

router.get("/users", validate(adminUserQuerySchema, "query"), adminController.listUsers);
router.patch(
  "/users/:id/status",
  validate(idParamSchema, "params"),
  validate(adminUserStatusSchema),
  adminController.updateUserStatus,
);

export default router;
