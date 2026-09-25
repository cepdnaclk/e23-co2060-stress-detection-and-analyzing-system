import DailyCheckIn from "../models/DailyCheckIn.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";
import Notification from "../models/Notification.js";
import { calculateStressRisk } from "../services/stressRiskService.js";
import { getRecommendation } from "../services/recommendationService.js";

/**
 * @desc    Submit a new daily check-in
 * @route   POST /api/checkins
 * @access  Private
 */
export const createCheckIn = async (req, res) => {
  try {
    const userId = req.user._id; // Extracted from protect middleware
    const {
      stressLevel,
      mood,
      sleepHours,
      sleepQuality,
      workloadHours,
      physicalActivityMinutes,
    } = req.body;

    // Validate required fields
    if (
      stressLevel === undefined ||
      mood === undefined ||
      sleepHours === undefined ||
      sleepQuality === undefined ||
      workloadHours === undefined ||
      physicalActivityMinutes === undefined
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Use current date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // 1. Check if already submitted today
    const existingCheckIn = await DailyCheckIn.findOne({ userId, date: today });
    if (existingCheckIn) {
      return res.status(400).json({ message: "Check-in already submitted for today." });
    }

    // 2. Fetch past 7 days check-ins for trend analysis
    const pastCheckIns = await DailyCheckIn.find({ userId })
      .sort({ date: -1 })
      .limit(7);

    // 3. Fetch latest DASS-21 result
    const latestQuestionnaire = await QuestionnaireResult.findOne({ userId })
      .sort({ createdAt: -1 });

    // 4. Create new check-in object (before save)
    const newCheckIn = new DailyCheckIn({
      userId,
      date: today,
      stressLevel,
      mood,
      sleepHours,
      sleepQuality,
      workloadHours,
      physicalActivityMinutes,
    });

    // 5. Calculate Risk Score
    const riskAnalysis = calculateStressRisk(newCheckIn, pastCheckIns, latestQuestionnaire);
    
    newCheckIn.riskScore = riskAnalysis.riskScore;
    newCheckIn.riskLevel = riskAnalysis.riskLevel;
    newCheckIn.stressTrend = riskAnalysis.stressTrend;
    newCheckIn.contributingFactors = riskAnalysis.contributingFactors;

    // 6. Generate Recommendation
    const recommendation = getRecommendation(riskAnalysis);
    
    if (recommendation) {
      newCheckIn.recommendationTriggered = true;
      // Create system notification
      await Notification.create({
        userId,
        audience: "user",
        type: "stress_alert",
        title: recommendation.title,
        message: recommendation.message,
        isRead: false,
      });
    }

    await newCheckIn.save();

    res.status(201).json({
      message: "Check-in successful",
      riskScore: riskAnalysis.riskScore,
      stressTrend: riskAnalysis.stressTrend,
      recommendation,
    });
  } catch (error) {
    console.error("Error creating check-in:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Get check-in history (past 14 days)
 * @route   GET /api/checkins/history
 * @access  Private
 */
export const getCheckInHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await DailyCheckIn.find({ userId })
      .sort({ date: -1 })
      .limit(14);
    
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching check-in history:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Check if user submitted today
 * @route   GET /api/checkins/today
 * @access  Private
 */
export const checkTodaySubmission = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().toISOString().split("T")[0];
    const checkIn = await DailyCheckIn.findOne({ userId, date: today });

    res.status(200).json({ submitted: !!checkIn });
  } catch (error) {
    console.error("Error checking today submission:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
