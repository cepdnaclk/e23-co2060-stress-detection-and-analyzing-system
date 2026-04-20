import express from "express";
import { getAdminOverview } from "../controllers/adminController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", authenticate, requireAdmin, getAdminOverview);

export default router;
