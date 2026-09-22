import mongoose from "mongoose";

const therapyHubExerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      // No enum restriction — categories are managed dynamically by the admin
    },
    audioUrl: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    recommendedStressLevels: {
      type: [String],
      enum: ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"],
      default: ["Normal", "Mild", "Moderate"],
    },
    thumbnail: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "therapy_hub_exercises", // Force correct collection name from prompt
  }
);

const TherapyHubExercise = mongoose.model("TherapyHubExercise", therapyHubExerciseSchema);

export default TherapyHubExercise;
