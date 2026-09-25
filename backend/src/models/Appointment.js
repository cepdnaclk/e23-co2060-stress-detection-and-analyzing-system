import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    appointmentDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
      index: true,
    },
    dassSnapshot: {
      stress: Number,
      anxiety: Number,
      depression: Number,
      severity: String,
      submittedAt: Date,
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    googleCalendar: {
      patientEventId: String,
      doctorEventId: String,
      syncStatus: {
        type: String,
        enum: ["not_required", "pending", "synced", "failed"],
        default: "not_required",
      },
      lastSyncError: String,
    },
  },
  { timestamps: true }
);

// Prevent double booking at DB level (excluding cancelled/rejected)
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["Pending", "Accepted", "Completed"] },
    },
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
