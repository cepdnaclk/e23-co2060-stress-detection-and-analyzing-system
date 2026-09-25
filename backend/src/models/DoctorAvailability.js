import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD format
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:mm format
    },
    slotDuration: {
      type: Number,
      default: 30, // in minutes
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent overlapping availability for the same doctor on the same day
// (In a real scenario, you'd do custom validation in the pre-save hook, 
// but a compound index doesn't fully solve overlapping ranges.
// We'll rely on controller validation for overlaps).

const DoctorAvailability = mongoose.model(
  "DoctorAvailability",
  doctorAvailabilitySchema
);

export default DoctorAvailability;
