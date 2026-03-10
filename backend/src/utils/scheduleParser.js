import * as chrono from "chrono-node";

// Convert Date → HH:MM
function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

function minutesFromHHMM(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function durationMinutes(startHHMM, endHHMM) {
  const start = minutesFromHHMM(startHHMM);
  const end = minutesFromHHMM(endHHMM);

  if (start === null || end === null) return null;

  if (end >= start) return end - start;
  // If the end time appears earlier, treat it as crossing midnight.
  return (24 * 60 - start) + end;
}

function cleanName(raw) {
  return raw
    .replace(/\b(i need to|i have to|i should|please|today|tomorrow|my|and|then|also)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
}

function detectPriority(text) {
  if (/\b(urgent|asap|critical|high priority|important)\b/i.test(text)) return "high";
  if (/\b(optional|if possible|low priority|later)\b/i.test(text)) return "low";
  return "medium";
}

function detectRelaxPreference(text) {
  if (/\b(more relax|more relaxing|more breaks?|light day|easy day|slow pace|avoid burnout)\b/i.test(text)) {
    return "high";
  }
  if (/\b(intense|packed day|minimal breaks?|push hard)\b/i.test(text)) {
    return "low";
  }
  return "medium";
}

function detectBreakAfterFreePreference(text) {
  return /\b(short\s+break|quick\s+break|small\s+break)\b/i.test(text)
    && /\b(after\s+free\s*time|after\s+free\s*slot|after\s+free\b)\b/i.test(text);
}

function extractSchedule(text) {
  const data = {
    wake_time: null,
    sleep_time: null,
    activities: [],
    tasks: [],
    relaxation_preference: "medium",
    break_after_free_preference: false,
    raw_text: text
  };

  const lower = text.toLowerCase();
  data.relaxation_preference = detectRelaxPreference(lower);
  data.break_after_free_preference = detectBreakAfterFreePreference(lower);

  /* =============================
      Wake & Sleep
  ============================== */

  const wake = lower.match(/(?:wake(?:\s*up)?|get up)(?:\s*time)?\s*(?:at)?\s*(.+?)(\.|,|and|$|\n)/);
  if (wake) {
    const time = chrono.parseDate(wake[1]);
    if (time) data.wake_time = formatTime(time);
  }

  const sleep = lower.match(/(?:sleep|go to bed|bedtime)\s*(?:at)?\s*(.+?)(\.|,|and|$|\n)/);
  if (sleep) {
    const time = chrono.parseDate(sleep[1]);
    if (time) data.sleep_time = formatTime(time);
  }

  /* =============================
      Activities
  ============================== */

  // Match fixed-time work blocks from free text.
  const activityRegex =
    /([a-z][^\n\.,;]*?)\s*(?:from|at)?\s*(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)/gi;

  let match;

  while ((match = activityRegex.exec(lower)) !== null) {
    const name = cleanName(match[1]);
    const startRaw = match[2];
    const endRaw = match[3];

    const start = chrono.parseDate(startRaw);
    const end = chrono.parseDate(endRaw);

    if (start && end && name) {
      const startTime = formatTime(start);
      const endTime = formatTime(end);
      const minutes = durationMinutes(startTime, endTime);

      const task = {
        name,
        priority: detectPriority(match[0]),
        fixed_time: {
          start: startTime,
          end: endTime
        }
      };

      if (minutes && minutes > 0) {
        task.duration_minutes = minutes;
      }

      data.activities.push({
        name,
        start: startTime,
        end: endTime
      });

      data.tasks.push(task);
    }
  }

  // Match: "workout for 45 minutes", "coding for 2 hours".
  const durationRegex =
    /([a-z][^\n\.,;]*?)\s+(?:for)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|h|m)\b/gi;

  while ((match = durationRegex.exec(lower)) !== null) {
    const name = cleanName(match[1]);
    if (!name) continue;

    const value = Number(match[2]);
    const unit = match[3];
    if (Number.isNaN(value) || value <= 0) continue;

    const duration = /h|hour|hr/i.test(unit)
      ? Math.round(value * 60)
      : Math.round(value);

    data.tasks.push({
      name,
      duration_minutes: duration,
      priority: detectPriority(match[0])
    });
  }

  // Match: "2 hours of project work".
  const reverseDurationRegex =
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|h|m)\s+of\s+([a-z][^\n\.,;]*)/gi;

  while ((match = reverseDurationRegex.exec(lower)) !== null) {
    const value = Number(match[1]);
    const unit = match[2];
    const name = cleanName(match[3]);

    if (Number.isNaN(value) || value <= 0 || !name) continue;

    const duration = /h|hour|hr/i.test(unit)
      ? Math.round(value * 60)
      : Math.round(value);

    const duplicate = data.tasks.some(
      (t) => t.name === name && t.duration_minutes === duration && !t.fixed_time
    );

    if (!duplicate) {
      data.tasks.push({
        name,
        duration_minutes: duration,
        priority: detectPriority(match[0])
      });
    }
  }

  return data;
}

export default extractSchedule;