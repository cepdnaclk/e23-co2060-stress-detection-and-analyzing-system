import mongoose from "mongoose";

const doctorRatingSchema = new mongoose.Schema(
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
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAssignment",
      required: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorRequest",
      required: true,
    },

    // Rating Details
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
    },

    // Timestamps
    ratedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure one rating per consultation (unique per user-doctor-assignment combo)
doctorRatingSchema.index({ userId: 1, doctorId: 1, assignmentId: 1 }, { unique: true });

const DoctorRating = mongoose.model("DoctorRating", doctorRatingSchema);

export default DoctorRating;
