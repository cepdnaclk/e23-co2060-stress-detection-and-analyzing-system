import express from "express";

import {
  authenticate,
  requireUser,
  requireVolunteerDoctor,
} from "../middleware/authMiddleware.js";
import {
  createConsultationRequest,
  createDoctorRating,
  finishConsultation,
  getDoctorCompletedConsultations,
  getDoctorCurrentPatients,
  getDoctorDashboard,
  getDoctorPendingRequests,
  getDoctorReviews,
  getMyConsultationRequests,
  getPublicDoctorProfile,
  getPublicDoctors,
  getMyProfile,
  updateAvailability,
  updateMyProfile,
  acceptConsultationRequest,
  rejectConsultationRequest,
} from "../controllers/doctorModuleController.js";

const router = express.Router();

router.get("/dashboard", authenticate, requireVolunteerDoctor, getDoctorDashboard);
router.get("/pending-requests", authenticate, requireVolunteerDoctor, getDoctorPendingRequests);
router.get("/current-patients", authenticate, requireVolunteerDoctor, getDoctorCurrentPatients);
router.get(
  "/completed-consultations",
  authenticate,
  requireVolunteerDoctor,
  getDoctorCompletedConsultations
);
router.get("/reviews", authenticate, requireVolunteerDoctor, getDoctorReviews);
router.get("/profile", authenticate, requireVolunteerDoctor, getMyProfile);
router.put("/profile", authenticate, requireVolunteerDoctor, updateMyProfile);
router.patch("/availability", authenticate, requireVolunteerDoctor, updateAvailability);
router.post(
  "/requests/:requestId/accept",
  authenticate,
  requireVolunteerDoctor,
  acceptConsultationRequest
);
router.post(
  "/requests/:requestId/reject",
  authenticate,
  requireVolunteerDoctor,
  rejectConsultationRequest
);
router.post(
  "/assignments/:assignmentId/complete",
  authenticate,
  requireVolunteerDoctor,
  finishConsultation
);

router.get("/my-requests", authenticate, requireUser, getMyConsultationRequests);
router.post("/:doctorId/requests", authenticate, requireUser, createConsultationRequest);
router.post(
  "/assignments/:assignmentId/rating",
  authenticate,
  requireUser,
  createDoctorRating
);
router.get("/:doctorId", getPublicDoctorProfile);
router.get("/", getPublicDoctors);

export default router;
