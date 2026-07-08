import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import DoctorRequest from "../models/DoctorRequest.js";
import DoctorAssignment from "../models/DoctorAssignment.js";
import DoctorRating from "../models/DoctorRating.js";

export {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  activateDoctor,
  deactivateDoctor,
  deleteDoctor,
  getMyProfile,
  updateMyProfile,
  updateAvailability,
} from "./doctorController.js";

const VALID_REQUEST_LEVELS = ["low", "moderate", "high", "severe"];

const generateDoctorToken = (doctorId) => {
  return jwt.sign(
    { userId: doctorId, role: "volunteer_doctor" },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const normalizeText = (value) => String(value ?? "").trim();

const normalizeLanguages = (languages) => {
  if (Array.isArray(languages)) {
    return languages.map((language) => normalizeText(language)).filter(Boolean);
  }

  if (typeof languages === "string") {
    return languages
      .split(",")
      .map((language) => normalizeText(language))
      .filter(Boolean);
  }

  return undefined;
};

const mapStressSeverityToRequestLevel = (severity) => {
  switch (severity) {
    case "moderate":
      return "moderate";
    case "severe":
      return "high";
    case "extremely_severe":
      return "severe";
    case "normal":
    case "mild":
    default:
      return "low";
  }
};

const getDoctorByIdOr404 = async (doctorId, res) => {
  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: "Invalid doctor id" });
    return null;
  }

  const doctor = await Doctor.findById(doctorId).select("-password");

  if (!doctor) {
    res.status(404).json({ message: "Doctor not found" });
    return null;
  }

  return doctor;
};

const syncDoctorStats = async (doctorId) => {
  if (!isValidObjectId(doctorId)) {
    return null;
  }

  const doctorObjectId = toObjectId(doctorId);
  const [ratingStats] = await DoctorRating.aggregate([
    { $match: { doctorId: doctorObjectId } },
    {
      $group: {
        _id: "$doctorId",
        averageRating: { $avg: "$stars" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const uniquePatients = await DoctorAssignment.distinct("userId", {
    doctorId: doctorObjectId,
  });

  const totalConsultations = await DoctorAssignment.countDocuments({
    doctorId: doctorObjectId,
    status: "completed",
  });

  const nextStats = {
    averageRating: ratingStats?.averageRating ? Number(ratingStats.averageRating.toFixed(2)) : 0,
    totalReviews: ratingStats?.totalReviews ?? 0,
    totalPatients: uniquePatients.length,
    totalConsultations,
  };

  await Doctor.findByIdAndUpdate(doctorObjectId, nextStats);
  return nextStats;
};

const getRecentReviews = async (doctorId, limit = 5) => {
  if (!isValidObjectId(doctorId)) {
    return [];
  }

  return DoctorRating.find({ doctorId: toObjectId(doctorId) })
    .sort({ ratedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("userId", "username profileImage")
    .lean();
};

const getQuestionnaireStressLevel = async (userId) => {
  const user = await User.findById(userId).select("questionnaireResults").lean();

  if (!user || !Array.isArray(user.questionnaireResults) || user.questionnaireResults.length === 0) {
    return null;
  }

  const latestResult = user.questionnaireResults[user.questionnaireResults.length - 1];
  const mappedLevel = mapStressSeverityToRequestLevel(latestResult?.stressSeverity);

  return VALID_REQUEST_LEVELS.includes(mappedLevel) ? mappedLevel : null;
};

export const loginVolunteerDoctor = async (req, res) => {
  try {
    const email = normalizeText(req.body.email).toLowerCase();
    const password = normalizeText(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (doctor.accountStatus !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const isPasswordCorrect = await doctor.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateDoctorToken(doctor._id);

    return res.status(200).json({
      token,
      user: {
        id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        phoneNumber: doctor.phoneNumber,
        profilePicture: doctor.profilePicture,
        qualifications: doctor.qualifications,
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        yearsOfExperience: doctor.yearsOfExperience,
        languages: doctor.languages,
        biography: doctor.biography,
        availability: doctor.availability,
        accountStatus: doctor.accountStatus,
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews,
        totalPatients: doctor.totalPatients,
        totalConsultations: doctor.totalConsultations,
        role: "volunteer_doctor",
      },
    });
  } catch (error) {
    console.error("Error logging in doctor:", error);
    return res.status(500).json({ message: "Error logging in doctor", error: error.message });
  }
};

export const getPublicDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      availability,
      sort = "rating",
    } = req.query;

    const filter = { accountStatus: "active" };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (availability && ["available", "unavailable"].includes(availability)) {
      filter.availability = availability;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
        { hospital: { $regex: search, $options: "i" } },
        { qualifications: { $regex: search, $options: "i" } },
      ];
    }

    let sortQuery = { averageRating: -1, totalReviews: -1, createdAt: -1 };

    if (sort === "reviews") {
      sortQuery = { totalReviews: -1, averageRating: -1, createdAt: -1 };
    } else if (sort === "experience") {
      sortQuery = { yearsOfExperience: -1, averageRating: -1, totalReviews: -1 };
    } else if (sort === "newest") {
      sortQuery = { createdAt: -1 };
    }

    const doctors = await Doctor.find(filter).select("-password").sort(sortQuery).lean();

    return res.status(200).json({
      total: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Error fetching public doctors:", error);
    return res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
};

export const getPublicDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await getDoctorByIdOr404(doctorId, res);

    if (!doctor) {
      return;
    }

    if (doctor.accountStatus !== "active") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const recentReviews = await getRecentReviews(doctorId, 5);
    const patientCount = await DoctorAssignment.distinct("userId", { doctorId: doctor._id });
    const reviewCount = await DoctorRating.countDocuments({ doctorId: doctor._id });

    return res.status(200).json({
      doctor: {
        ...doctor.toObject(),
        patientCount: patientCount.length,
        reviewCount,
        recentReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching public doctor profile:", error);
    return res.status(500).json({ message: "Error fetching doctor profile", error: error.message });
  }
};

export const createConsultationRequest = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { doctorId } = req.params;
    const reason = normalizeText(req.body.reason);
    const requestLevel = normalizeText(req.body.stressLevel);

    if (!reason) {
      return res.status(400).json({ message: "Consultation reason is required" });
    }

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor || doctor.accountStatus !== "active") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.availability !== "available") {
      return res.status(400).json({ message: "Doctor is currently unavailable" });
    }

    const activeRequest = await DoctorRequest.findOne({
      userId,
      status: { $in: ["pending", "accepted"] },
    });

    if (activeRequest) {
      return res.status(409).json({
        message: "You already have an active consultation request",
      });
    }

    const stressLevel = VALID_REQUEST_LEVELS.includes(requestLevel)
      ? requestLevel
      : await getQuestionnaireStressLevel(userId);

    const request = await DoctorRequest.create({
      userId,
      doctorId,
      reason,
      stressLevel,
      status: "pending",
      requestedAt: new Date(),
    });

    return res.status(201).json({
      message: "Consultation request submitted",
      request,
    });
  } catch (error) {
    console.error("Error creating consultation request:", error);
    return res.status(500).json({ message: "Error creating request", error: error.message });
  }
};

export const getMyConsultationRequests = async (req, res) => {
  try {
    const userId = req.user?._id;

    const requests = await DoctorRequest.find({ userId })
      .populate("doctorId", "fullName specialization hospital profilePicture availability averageRating totalReviews")
      .sort({ requestedAt: -1, createdAt: -1 })
      .lean();

    const assignments = await DoctorAssignment.find({
      requestId: { $in: requests.map((request) => request._id) },
    })
      .select("_id requestId status completedAt assignedAt")
      .lean();

    const assignmentByRequestId = new Map(
      assignments.map((assignment) => [String(assignment.requestId), assignment])
    );

    const enrichedRequests = requests.map((request) => ({
      ...request,
      assignment: assignmentByRequestId.get(String(request._id)) ?? null,
      assignmentId: assignmentByRequestId.get(String(request._id))?._id ?? null,
    }));

    return res.status(200).json({
      total: enrichedRequests.length,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error("Error fetching consultation requests:", error);
    return res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

export const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const [pendingRequests, activePatients, completedConsultations, reviews] = await Promise.all([
      DoctorRequest.countDocuments({ doctorId, status: "pending" }),
      DoctorAssignment.countDocuments({ doctorId, status: "active" }),
      DoctorAssignment.countDocuments({ doctorId, status: "completed" }),
      DoctorRating.countDocuments({ doctorId }),
    ]);

    const doctor = await Doctor.findById(doctorId).select(
      "fullName profilePicture specialization hospital availability averageRating totalReviews totalPatients totalConsultations"
    ).lean();

    return res.status(200).json({
      doctor,
      stats: {
        pendingRequests,
        activePatients,
        completedConsultations,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor dashboard:", error);
    return res.status(500).json({ message: "Error fetching dashboard", error: error.message });
  }
};

export const getDoctorPendingRequests = async (req, res) => {
  try {
    const doctorId = req.user?._id;

    const requests = await DoctorRequest.find({ doctorId, status: "pending" })
      .populate("userId", "username age gender profileImage")
      .sort({ requestedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      total: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ message: "Error fetching pending requests", error: error.message });
  }
};

export const acceptConsultationRequest = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { requestId } = req.params;

    const request = await DoctorRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    const activeAssignment = await DoctorAssignment.findOne({
      userId: request.userId,
      status: "active",
    });

    if (activeAssignment) {
      return res.status(409).json({ message: "User already has an active consultation" });
    }

    request.status = "accepted";
    request.respondedAt = new Date();
    await request.save();

    const assignment = await DoctorAssignment.create({
      userId: request.userId,
      doctorId,
      requestId: request._id,
      status: "active",
      assignedAt: new Date(),
    });

    await syncDoctorStats(doctorId);

    return res.status(200).json({
      message: "Request accepted",
      request,
      assignment,
    });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ message: "Error accepting request", error: error.message });
  }
};

export const rejectConsultationRequest = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { requestId } = req.params;

    const request = await DoctorRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(request.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    request.status = "rejected";
    request.respondedAt = new Date();
    await request.save();

    return res.status(200).json({
      message: "Request rejected",
      request,
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({ message: "Error rejecting request", error: error.message });
  }
};

export const getDoctorCurrentPatients = async (req, res) => {
  try {
    const doctorId = req.user?._id;

    const assignments = await DoctorAssignment.find({ doctorId, status: "active" })
      .populate("userId", "username age gender profileImage")
      .populate("requestId", "reason stressLevel requestedAt status")
      .sort({ assignedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      total: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching current patients:", error);
    return res.status(500).json({ message: "Error fetching current patients", error: error.message });
  }
};

export const getDoctorCompletedConsultations = async (req, res) => {
  try {
    const doctorId = req.user?._id;

    const consultations = await DoctorAssignment.find({ doctorId, status: "completed" })
      .populate("userId", "username age gender profileImage")
      .populate("requestId", "reason stressLevel requestedAt completedAt")
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      total: consultations.length,
      consultations,
    });
  } catch (error) {
    console.error("Error fetching completed consultations:", error);
    return res.status(500).json({ message: "Error fetching completed consultations", error: error.message });
  }
};

export const finishConsultation = async (req, res) => {
  try {
    const doctorId = req.user?._id;
    const { assignmentId } = req.params;

    const assignment = await DoctorAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (String(assignment.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (assignment.status !== "active") {
      return res.status(400).json({ message: "Consultation already completed" });
    }

    assignment.status = "completed";
    assignment.completedAt = new Date();
    await assignment.save();

    const request = await DoctorRequest.findById(assignment.requestId);
    if (request) {
      request.status = "completed";
      request.completedAt = new Date();
      await request.save();
    }

    await syncDoctorStats(doctorId);

    return res.status(200).json({
      message: "Consultation completed",
      assignment,
      request,
    });
  } catch (error) {
    console.error("Error finishing consultation:", error);
    return res.status(500).json({ message: "Error finishing consultation", error: error.message });
  }
};

export const createDoctorRating = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { assignmentId } = req.params;
    const { stars, review } = req.body;

    const starsNumber = Number(stars);

    if (!Number.isInteger(starsNumber) || starsNumber < 1 || starsNumber > 5) {
      return res.status(400).json({ message: "Rating stars must be between 1 and 5" });
    }

    if (!isValidObjectId(assignmentId)) {
      return res.status(400).json({ message: "Invalid assignment id" });
    }

    const assignment = await DoctorAssignment.findById(assignmentId);

    if (!assignment || String(assignment.userId) !== String(userId)) {
      return res.status(404).json({ message: "Completed consultation not found" });
    }

    if (assignment.status !== "completed") {
      return res.status(400).json({ message: "You can only rate completed consultations" });
    }

    const existingRating = await DoctorRating.findOne({ assignmentId: assignment._id });

    if (existingRating) {
      return res.status(409).json({ message: "This consultation has already been rated" });
    }

    const doctor = await Doctor.findById(assignment.doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const rating = await DoctorRating.create({
      userId,
      doctorId: doctor._id,
      assignmentId: assignment._id,
      requestId: assignment.requestId,
      stars: starsNumber,
      review: normalizeText(review),
      ratedAt: new Date(),
    });

    await syncDoctorStats(doctor._id);

    return res.status(201).json({
      message: "Doctor rated successfully",
      rating,
    });
  } catch (error) {
    console.error("Error creating doctor rating:", error);
    return res.status(500).json({ message: "Error creating rating", error: error.message });
  }
};

export const getDoctorReviews = async (req, res) => {
  try {
    const doctorId = req.params.doctorId || req.user?._id;
    const limit = Number(req.query.limit ?? 50);

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const reviews = await DoctorRating.find({ doctorId })
      .sort({ ratedAt: -1, createdAt: -1 })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 50)
      .populate("userId", "username profileImage")
      .populate("assignmentId", "status assignedAt completedAt")
      .lean();

    return res.status(200).json({
      total: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching doctor reviews:", error);
    return res.status(500).json({ message: "Error fetching reviews", error: error.message });
  }
};

export const getDoctorStatistics = async (req, res) => {
  try {
    const doctorId = req.params.doctorId || req.user?._id;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await Doctor.findById(doctorId).select("-password").lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const [pendingRequests, activePatients, completedConsultations, totalReviews, recentReviews] =
      await Promise.all([
        DoctorRequest.countDocuments({ doctorId, status: "pending" }),
        DoctorAssignment.countDocuments({ doctorId, status: "active" }),
        DoctorAssignment.countDocuments({ doctorId, status: "completed" }),
        DoctorRating.countDocuments({ doctorId }),
        getRecentReviews(doctorId, 5),
      ]);

    return res.status(200).json({
      doctor,
      statistics: {
        pendingRequests,
        activePatients,
        completedConsultations,
        totalReviews,
        averageRating: doctor.averageRating ?? 0,
        totalPatients: doctor.totalPatients ?? 0,
        totalConsultations: doctor.totalConsultations ?? 0,
      },
      recentReviews,
    });
  } catch (error) {
    console.error("Error fetching doctor statistics:", error);
    return res.status(500).json({ message: "Error fetching doctor statistics", error: error.message });
  }
};
