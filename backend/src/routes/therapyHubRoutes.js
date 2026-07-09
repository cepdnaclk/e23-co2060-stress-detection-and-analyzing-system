import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getTherapyHubExercises } from "../controllers/therapyHubController.js";

const router = express.Router();

// Allow authenticated users to fetch all exercises
router.get("/", authenticate, getTherapyHubExercises);

export default router;
