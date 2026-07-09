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
      enum: ["Relaxation Sessions", "Calm Music", "Nature Sounds"],
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
