import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getMe, getMyNotifications, updateMe, markNotificationAsRead } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.get("/notifications", authenticate, getMyNotifications);
router.put("/notifications/:id/read", authenticate, markNotificationAsRead);
router.put("/me", authenticate, updateMe);

export default router;
