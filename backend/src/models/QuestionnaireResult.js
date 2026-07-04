import mongoose from "mongoose";

const questionnaireResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalScore: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      required: true,
    },
    stressScore: {
      type: Number,
      required: true,
    },
    stressSeverity: {
      type: String,
      required: true,
    },
    anxietyScore: {
      type: Number,
      required: true,
    },
    anxietySeverity: {
      type: String,
      required: true,
    },
    depressionScore: {
      type: Number,
      required: true,
    },
    depressionSeverity: {
      type: String,
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "questionnaire_results",
  }
);

const QuestionnaireResult = mongoose.model("QuestionnaireResult", questionnaireResultSchema);

export default QuestionnaireResult;