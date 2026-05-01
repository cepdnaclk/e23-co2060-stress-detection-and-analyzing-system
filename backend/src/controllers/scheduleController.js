import generateTimetable from "../utils/timetableGenerator.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeStructuredSchedule(structuredSchedule, backupText) {
  if (!isPlainObject(structuredSchedule)) {
    return { raw_text: backupText || "" };
  }

  return {
    ...structuredSchedule,
    raw_text: backupText || structuredSchedule.raw_text || ""
  };
}

export const parseSchedule = async (req, res) => {
  try {
    const body = typeof req.body === "string"
      ? { text: req.body }
      : req.body || {};

    const text = body.text || body.backup_text || body.fallback_text || "";
    const structuredSchedule = body.schedule || body.structured || body.data || null;

    if (!text && !structuredSchedule) {
      return res.status(400).json({
        error: 'Text or structured schedule data is required. Send JSON { "text": "..." } or { "structured": {...}, "backup_text": "..." }.'
      });
    }

    const schedule = mergeStructuredSchedule(structuredSchedule, text);

    const timetable = await generateTimetable(schedule);

    res.json({
      success: true,
      parsed_data: schedule,
      timetable
    });

  } catch (err) {
    console.error("Schedule parse failed:", {
      message: err?.message,
      status: err?.status,
      code: err?.code,
      type: err?.type,
    });

    if (err?.message?.includes("looks like a Google API key")) {
      return res.status(400).json({ error: err.message });
    }

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