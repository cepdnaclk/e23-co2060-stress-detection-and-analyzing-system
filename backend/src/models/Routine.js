import mongoose from "mongoose";

const routineBlockSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    activity: { type: String, required: true },
    type: {
      type: String,
      enum: ["activity", "break", "meal", "free"],
      default: "activity",
    },
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Routine",
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    alertText: {
      type: String,
      default: "",
    },
    sourceText: {
      type: String,
      default: "",
    },
    blocks: {
      type: [routineBlockSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Routine blocks are required",
      },
    },
  },
  { timestamps: true }
);

const Routine = mongoose.model("Routine", routineSchema);

export default Routine;