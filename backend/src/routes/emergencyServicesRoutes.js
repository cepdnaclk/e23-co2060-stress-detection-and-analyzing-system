import express from "express";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/emergencyServicesController.js";

const router = express.Router();

// Public — any client can read the service list (no login required)
router.get("/", getServices);

// Admin-only — create, update, delete
router.post("/",     authenticate, requireAdmin, createService);
router.put("/:id",   authenticate, requireAdmin, updateService);
router.delete("/:id",authenticate, requireAdmin, deleteService);

export default router;
