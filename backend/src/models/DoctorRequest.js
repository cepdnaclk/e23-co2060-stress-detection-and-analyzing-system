import mongoose from "mongoose";

const doctorRequestSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    // Request Details
    reason: {
      type: String,
      required: true,
    },
    stressLevel: {
      type: String,
      enum: ["low", "moderate", "high", "severe"],
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },

    // Timestamps
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure one active request per user (pending or accepted)
doctorRequestSchema.index({ userId: 1, status: 1 });

const DoctorRequest = mongoose.model("DoctorRequest", doctorRequestSchema);

export default DoctorRequest;
