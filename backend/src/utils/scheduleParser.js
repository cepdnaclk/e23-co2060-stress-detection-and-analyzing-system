import * as chrono from "chrono-node";

// Convert Date → HH:MM
function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

function extractSchedule(text) {
  const data = {
    wake_time: null,
    sleep_time: null,
    activities: []
  };

  const lower = text.toLowerCase();

  /* =============================
      Wake & Sleep
  ============================== */

  const wake = lower.match(/wake up at (.+?)(\.|,|and|$)/);
  if (wake) {
    const time = chrono.parseDate(wake[1]);
    if (time) data.wake_time = formatTime(time);
  }

  const sleep = lower.match(/sleep at (.+?)(\.|,|and|$)/);
  if (sleep) {
    const time = chrono.parseDate(sleep[1]);
    if (time) data.sleep_time = formatTime(time);
  }

  /* =============================
      Activities
  ============================== */

  // Match: "study 9am to 11am", "lecture at 1-3pm", etc.
  const activityRegex =
    /(study|lecture|lab|work|class).*?(?:from|at)?\s*(\d+[:.]?\d*\s?(?:am|pm)?)\s*(?:to|-)\s*(\d+[:.]?\d*\s?(?:am|pm)?)/gi;

  let match;

  while ((match = activityRegex.exec(lower)) !== null) {
    const name = match[1];
    const startRaw = match[2];
    const endRaw = match[3];

    const start = chrono.parseDate(startRaw);
    const end = chrono.parseDate(endRaw);

    if (start && end) {
      data.activities.push({
        name,
        start: formatTime(start),
        end: formatTime(end)
      });
    }
  }

  return data;
}

export default extractSchedule;