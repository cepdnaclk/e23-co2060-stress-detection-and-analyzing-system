import express from "express";
import { getAdminOverview, getAdminUsers } from "../controllers/adminController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", authenticate, requireAdmin, getAdminOverview);
router.get("/users", authenticate, requireAdmin, getAdminUsers);

export default router;
