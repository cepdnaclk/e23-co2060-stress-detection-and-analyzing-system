import express from "express";
import { createCheckIn, getCheckInHistory, checkTodaySubmission } from "../controllers/dailyCheckInController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCheckIn);
router.get("/history", protect, getCheckInHistory);
router.get("/today", protect, checkTodaySubmission);

export default router;
