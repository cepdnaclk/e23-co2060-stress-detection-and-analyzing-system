import UserActivity from "../models/UserActivity.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";
import MoodHistory from "../models/MoodHistory.js";
import Routine from "../models/Routine.js";

/**
 * Derive today's summary from real data in MongoDB.
 * Checks each activity type independently and returns a status string.
 */
const buildTodaySummary = async (userId) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayDateStr = todayStart.toISOString().slice(0, 10);

  // ── DASS-21 ──────────────────────────────────────────────────────────────
  const completedAssessment = await QuestionnaireResult.findOne({
    userId,
    recordedAt: { $gte: todayStart, $lte: todayEnd },
  }).lean();

  let assessmentStatus = "not_started";
  if (completedAssessment) {
    assessmentStatus = "completed";
  } else {
    const inProgressAssessment = await UserActivity.findOne({
      userId,
      activityType: "assessment",
      status: "in_progress",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }).lean();
    if (inProgressAssessment) assessmentStatus = "in_progress";
  }

  // ── Therapy ───────────────────────────────────────────────────────────────
  const latestTherapyToday = await UserActivity.findOne({
    userId,
    activityType: "therapy",
    createdAt: { $gte: todayStart, $lte: todayEnd },
  })
    .sort({ updatedAt: -1 })
    .lean();

  let therapyStatus = "not_started";
  if (latestTherapyToday) {
    therapyStatus = latestTherapyToday.status;
  }

  // ── Mood ─────────────────────────────────────────────────────────────────
  const moodToday = await MoodHistory.findOne({
    user: userId,
    date: todayDateStr,
  }).lean();

  const moodStatus = moodToday ? "completed" : "not_started";

  // ── Routine ───────────────────────────────────────────────────────────────
  const routineToday = await Routine.findOne({
    user: userId,
    date: todayDateStr,
  }).lean();

  const routineStatus = routineToday ? "completed" : "not_started";

  return {
    assessment: assessmentStatus,
    therapy: therapyStatus,
    mood: moodStatus,
    routine: routineStatus,
  };
};

/**
 * GET /api/activities/me
 * Returns all activities for the authenticated user, sorted newest first.
 * Also includes today's summary card data.
 */
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;

    const [activities, todaySummary] = await Promise.all([
      UserActivity.find({ userId }).sort({ createdAt: -1 }).lean(),
      buildTodaySummary(userId),
    ]);

    // Compute weekly inactivity flag
    const lastAssessment = await QuestionnaireResult.findOne({ userId })
      .sort({ recordedAt: -1 })
      .select("recordedAt")
      .lean();

    let daysSinceLastAssessment = null;
    if (lastAssessment?.recordedAt) {
      const diffMs = Date.now() - new Date(lastAssessment.recordedAt).getTime();
      daysSinceLastAssessment = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      activities,
      todaySummary,
      daysSinceLastAssessment,
    });
  } catch (error) {
    console.error("Error in getActivities:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * POST /api/activities
 * Create a new activity record.
 */
export const createActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityType, title, status, metadata, progress } = req.body;

    if (!activityType || !title) {
      return res.status(400).json({ message: "activityType and title are required" });
    }

    const activity = await UserActivity.create({
      userId,
      activityType,
      title,
      status: status || "not_started",
      metadata: metadata || {},
      progress: progress ?? 0,
    });

    return res.status(201).json({ activity });
  } catch (error) {
    console.error("Error in createActivity:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * PUT /api/activities/:id
 * Update status / progress / metadata of an existing activity.
 * Only the owning user may update their own records.
 */
export const updateActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status, progress, metadata } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (metadata !== undefined) updates.metadata = metadata;

    const activity = await UserActivity.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    return res.status(200).json({ activity });
  } catch (error) {
    console.error("Error in updateActivity:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
