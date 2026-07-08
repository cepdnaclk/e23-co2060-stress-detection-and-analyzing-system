import express from "express";

import {
  authenticate,
  requireAdmin,
} from "../middleware/authMiddleware.js";
import {
  activateDoctor,
  createDoctor,
  deactivateDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
  getDoctorReviews,
  getDoctorStatistics,
  updateDoctor,
} from "../controllers/doctorModuleController.js";

const router = express.Router();

router.post("/", authenticate, requireAdmin, createDoctor);
router.get("/", authenticate, requireAdmin, getAllDoctors);
router.get("/:doctorId/statistics", authenticate, requireAdmin, getDoctorStatistics);
router.get("/:doctorId/reviews", authenticate, requireAdmin, getDoctorReviews);
router.get("/:doctorId", authenticate, requireAdmin, getDoctorById);
router.put("/:doctorId", authenticate, requireAdmin, updateDoctor);
router.patch("/:doctorId/activate", authenticate, requireAdmin, activateDoctor);
router.patch("/:doctorId/deactivate", authenticate, requireAdmin, deactivateDoctor);
router.delete("/:doctorId", authenticate, requireAdmin, deleteDoctor);

export default router;
