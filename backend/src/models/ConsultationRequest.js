import mongoose from "mongoose";

const consultationNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const consultationRequestSchema = new mongoose.Schema(
  {
    userId: {
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
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    stressLevel: {
      type: String,
      enum: ["low", "moderate", "high", "severe"],
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    doctorNotes: {
      type: [consultationNoteSchema],
      default: [],
    },
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
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "doctorrequests" }
);

consultationRequestSchema.index({ userId: 1, doctorId: 1, status: 1 });

const ConsultationRequest = mongoose.model("ConsultationRequest", consultationRequestSchema);

export default ConsultationRequest;