import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderPaymentStatus,
  deleteOrder,
} from "../controller/ordersController";
import { authMiddleware, restrictTo } from "../middlewares/auth";

const router = Router();

// Protect all routes after this point
router.use(authMiddleware);

// Routes for regular logged-in users
router.post("/create", createOrder); // Changed from '/createOrder' to '/create' for consistency
router.get("/my-orders", getMyOrders);

// Any logged-in user can get an order by ID.
// The controller itself should have logic to prevent user A from seeing user B's order.
router.get("/:id", getOrderById);

// --- ADMIN-ONLY Routes ---
// Only users with the 'admin' role can access the following routes

router.get("/", restrictTo("admin"), getAllOrders);

router
  .route("/:id")
  .patch(restrictTo("admin"), updateOrderPaymentStatus)
  .delete(restrictTo("admin"), deleteOrder);

export { router as orderRouter };
