import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ["assessment", "therapy", "routine", "mood"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["completed", "in_progress", "not_started"],
      required: true,
      default: "not_started",
    },
    // Flexible field: stressLevel, score, mood, exerciseName, totalBlocks, etc.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // 0–100 percentage; used primarily for therapy audio progress
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "user_activities",
  }
);

// Compound index for efficient per-user descending timeline queries
userActivitySchema.index({ userId: 1, createdAt: -1 });

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

export default UserActivity;
