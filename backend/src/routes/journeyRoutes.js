import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { getMyJourneyData } from "../controllers/journeyController.js";

const router = express.Router();

router.get("/me", authenticate, getMyJourneyData);

export default router;