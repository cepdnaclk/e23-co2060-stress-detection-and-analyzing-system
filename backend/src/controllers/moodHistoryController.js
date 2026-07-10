import MoodHistory from "../models/MoodHistory.js";
import UserActivity from "../models/UserActivity.js";

export const createMoodHistoryEntry = async (req, res) => {
    try {
        const { mood, date } = req.body;

        const nextMood = String(mood || "").trim();
        const nextDate = String(date || "").trim();

        if (!nextMood || !nextDate) {
            return res.status(400).json({ message: "Mood and date are required" });
        }

        const moodHistory = await MoodHistory.create({
            user: req.user._id,
            mood: nextMood,
            date: nextDate,
        });

        // Record mood activity for the wellness timeline
        await UserActivity.create({
            userId: req.user._id,
            activityType: "mood",
            title: "Mood Updated",
            status: "completed",
            metadata: { mood: nextMood },
        });

        return res.status(201).json({ moodHistory });
    } catch (error) {
        console.log("Error in createMoodHistoryEntry controller:", error);
        return res.status(500).json({ message: "Internal Server error" });
    }
};

export const getMyMoodHistory = async (req, res) => {
    try {
        const moodHistory = await MoodHistory.find({ user: req.user._id }).sort({
            date: -1,
            createdAt: -1,
        });

        return res.status(200).json({ moodHistory });
    } catch (error) {
        console.log("Error in getMyMoodHistory controller:", error);
        return res.status(500).json({ message: "Internal Server error" });
    }
};