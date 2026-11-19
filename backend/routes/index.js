import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import favoriteRoutes from "./favorite.routes.js";
import conversationRoutes from "./conversation.routes.js";
import addressRoutes from "./address.routes.js";
import checkoutRoutes from "./checkout.routes.js";
import orderRoutes from "./order.routes.js";
import reviewRoutes from "./review.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";
import sellerRoutes from "./seller.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/conversations", conversationRoutes);
router.use("/addresses", addressRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/sellers", sellerRoutes);

export default router;
