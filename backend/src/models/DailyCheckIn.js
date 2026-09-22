import mongoose from "mongoose";

const dailyCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    stressLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    mood: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    sleepHours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    sleepQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    workloadHours: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    physicalActivityMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    riskScore: {
      type: Number,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH"],
      default: "LOW",
    },
    stressTrend: {
      type: String,
      enum: ["INCREASING", "DECREASING", "STABLE"],
      default: "STABLE",
    },
    contributingFactors: {
      type: [String],
      default: [],
    },
    recommendationTriggered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "daily_checkins",
  }
);

// Compound index to ensure one check-in per user per day and for fast timeline queries
dailyCheckInSchema.index({ userId: 1, date: -1 }, { unique: true });

const DailyCheckIn = mongoose.model("DailyCheckIn", dailyCheckInSchema);

export default DailyCheckIn;
