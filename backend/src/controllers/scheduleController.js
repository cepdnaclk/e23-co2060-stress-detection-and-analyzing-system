import extractSchedule from "../utils/scheduleParser.js";
import generateTimetable from "../utils/timetableGenerator.js";

export const parseSchedule = async (req, res) => {
  try {
    const text =
      typeof req.body === "string"
        ? req.body
        : req.body?.text;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required. Send JSON { "text": "..." } or a text/plain body.'
      });
    }

    // Step 1: Parse user text
    const schedule = extractSchedule(text);

    // Step 2: Generate timetable using LLM
    const timetable = await generateTimetable(schedule);

    res.json({
      success: true,
      parsed_data: schedule,
      timetable
    });

  } catch (err) {
    console.error(err);

    if (err?.status === 429 || err?.code === "insufficient_quota") {
      return res.status(429).json({
        error: "LLM quota exceeded. Check provider billing/quota and API key."
      });
    }

    if (err?.status === 401 || err?.code === "invalid_api_key") {
      return res.status(401).json({
        error: "Invalid API key for configured LLM provider."
      });
    }

    res.status(500).json({ error: "Processing failed" });
  }
};