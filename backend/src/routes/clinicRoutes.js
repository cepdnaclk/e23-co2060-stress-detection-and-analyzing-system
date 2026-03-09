import express from "express";
import { getNearbyClinics } from "../controllers/clinicController.js";

const router = express.Router();

/**
 * Clinic Routes
 */
router.get("/nearby", getNearbyClinics);

export default router;
