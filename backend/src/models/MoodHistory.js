import mongoose from "mongoose";

const moodHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        mood: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const MoodHistory = mongoose.model("MoodHistory", moodHistorySchema);

export default MoodHistory;