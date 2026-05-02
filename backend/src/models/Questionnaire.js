import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      min: 1,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionnaireSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);

export default Questionnaire;
