import mongoose from "mongoose";

const doctorAssignmentSchema = new mongoose.Schema(
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
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorRequest",
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },

    // Timestamps
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Notes
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure only one active assignment per user
doctorAssignmentSchema.index({ userId: 1, status: 1 });

const DoctorAssignment = mongoose.model(
  "DoctorAssignment",
  doctorAssignmentSchema
);

export default DoctorAssignment;
