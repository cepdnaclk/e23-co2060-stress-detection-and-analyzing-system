import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { createMoodHistoryEntry, getMyMoodHistory } from "../controllers/moodHistoryController.js";

const router = express.Router();

router.get("/me", authenticate, getMyMoodHistory);
router.post("/", authenticate, createMoodHistoryEntry);

export default router;