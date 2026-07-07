import MoodHistory from "../models/MoodHistory.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildPastDays = (count) => {
  const days = [];
  const today = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push({
      dateKey: formatDateKey(day),
      date: day,
    });
  }

  return days;
};

export const getMyJourneyData = async (req, res) => {
  try {
    const questionnaireHistory = await QuestionnaireResult.find({
      userId: req.user._id,
    })
      .sort({ recordedAt: 1, createdAt: 1 })
      .select("stressScore recordedAt createdAt")
      .lean();

    const sevenDayWindowStart = buildPastDays(7)[0].dateKey;
    const moodHistory = await MoodHistory.find({
      user: req.user._id,
      date: { $gte: sevenDayWindowStart },
    })
      .sort({ date: 1, createdAt: 1 })
      .select("date mood createdAt")
      .lean();

    const moodByDate = new Map();
    for (const entry of moodHistory) {
      moodByDate.set(entry.date, entry.mood);
    }

    const moodTimeline = buildPastDays(7).map(({ dateKey }) => ({
      date: dateKey,
      mood: moodByDate.get(dateKey) || null,
    }));

    return res.status(200).json({
      questionnaireHistory,
      moodTimeline,
    });
  } catch (error) {
    console.log("Error in getMyJourneyData controller:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};