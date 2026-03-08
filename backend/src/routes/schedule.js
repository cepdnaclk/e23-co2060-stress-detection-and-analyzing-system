import express from "express";
import { parseSchedule } from "../controllers/scheduleController.js";

const router = express.Router();

/**
 * Schedule Routes
 */
router.post("/parse", parseSchedule);

export default router;