import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getActivities,
  createActivity,
  updateActivity,
} from "../controllers/activityController.js";

const router = express.Router();

router.get("/me", authenticate, getActivities);
router.post("/", authenticate, createActivity);
router.put("/:id", authenticate, updateActivity);

export default router;
