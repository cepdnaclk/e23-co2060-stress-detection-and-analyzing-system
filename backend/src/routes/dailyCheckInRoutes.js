import express from "express";
import { createCheckIn, getCheckInHistory, checkTodaySubmission } from "../controllers/dailyCheckInController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createCheckIn);
router.get("/history", authenticate, getCheckInHistory);
router.get("/today", authenticate, checkTodaySubmission);

export default router;
