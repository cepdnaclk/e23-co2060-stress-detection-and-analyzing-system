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

function addMinutesToTime(hhmm, minutes) {
  const start = minutesFromHHMM(hhmm);
  if (start === null) return null;
  const total = start + minutes;
  const hours = String(Math.floor((total % (24 * 60)) / 60)).padStart(2, "0");
  const mins = String(total % 60).padStart(2, "0");
  return `${hours}:${mins}`;
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

function detectFreeAfterTaskPreference(text) {
  return /\b(free\s*time|rest|break)\b/i.test(text)
    && /\b(after\s+tasks?|after\s+doing\s+tasks?|after\s+doing\s+task|after\s+each\s+task|after\s+work|after\s+study)\b/i.test(text);
}

function addTaskIfMissing(data, name, sourceText, extra = {}) {
  const normalizedName = name.trim();
  if (!normalizedName) return;

  const fixedStart = extra.fixed_time?.start ? String(extra.fixed_time.start).slice(0, 5) : null;
  const fixedEnd = extra.fixed_time?.end ? String(extra.fixed_time.end).slice(0, 5) : null;

  const duplicate = data.tasks.some(
    (task) => {
      const taskStart = task.fixed_time?.start ? String(task.fixed_time.start).slice(0, 5) : null;
      const taskEnd = task.fixed_time?.end ? String(task.fixed_time.end).slice(0, 5) : null;

      return task.name === normalizedName
        && task.duration_minutes === extra.duration_minutes
        && taskStart === fixedStart
        && taskEnd === fixedEnd;
    }
  );

  if (!duplicate) {
    data.tasks.push({
      name: normalizedName,
      priority: detectPriority(sourceText),
      ...extra
    });
  }
}

function extractGoal(text) {
  const goalPatterns = [
    /(?:^|\b)(?:my goal is|goal(?:\s+for\s+today)?|i want to|i need to|focus on|finish|complete|today i want to|i'm trying to)\s+(.+?)(?:\.|,|\n|$)/i,
    /(?:^|\b)(?:goal|target)[:\-]\s*(.+?)(?:\.|,|\n|$)/i
  ];

  for (const pattern of goalPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return text.trim();
}

function isOpenTaskSentence(sentence) {
  return /\b(do|need to do|work on|study|revise|review|read|reading|practice|write|build|prepare|project|assignment|homework|research|exercise|walk|finish|complete|handle|make|task|todo|to do)\b/i.test(sentence)
    && !/\b(?:from|at)\s*\d{1,2}/i.test(sentence)
    && !/\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|h|m)\b/i.test(sentence)
    && !/\b(?:at|from)\s*\d{1,2}:\d{2}\b/i.test(sentence)
    && !/\b(?:to|-)\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)?\b/i.test(sentence);
}

function splitSentences(text) {
  return text
    .split(/(?:\n|\.|;)+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractTaskName(sentence) {
  return sentence
    .replace(/\b(?:i need to|i have to|i should|i want to|i'm trying to|please|today|tomorrow|my|also|then|need to)\b/gi, " ")
    .replace(/\b(?:do|do this|do that|do some|do a|do the|to do|need to do|have to do|want to do)\b/gi, " ")
    .replace(/\b(?:at|on|for|about|with|to)\s*(?:\d{1,2}(?::\d{2})?\s?(?:am|pm)?|\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|h|m))\b/gi, " ")
    .replace(/\b(?:from\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)?)/gi, " ")
    .replace(/\b(?:some|a|the)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
}

function extractSchedule(text) {
  const data = {
    goal: null,
    wake_time: null,
    sleep_time: null,
    activities: [],
    tasks: [],
    relaxation_preference: "medium",
    break_after_free_preference: false,
    free_after_task_preference: false,
    raw_text: text
  };

  const lower = text.toLowerCase();
  data.relaxation_preference = detectRelaxPreference(lower);
  data.break_after_free_preference = detectBreakAfterFreePreference(lower);
  data.free_after_task_preference = detectFreeAfterTaskPreference(lower);

  data.goal = extractGoal(text);

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

  for (const sentence of splitSentences(text)) {
    const sentenceLower = sentence.toLowerCase();

    if (/\b(?:from|at)\s*\d{1,2}(?::\d{2})?\s?(?:am|pm)?\s*(?:to|-)/i.test(sentence)) {
      continue;
    }

    const singleTimeMatch = sentence.match(/\b(?:at|by)\s*(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)/i);
    const durationMatch = sentence.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|h|m)\b/i);

    if (singleTimeMatch && /\b(work on|study|revise|review|read|reading|practice|write|build|prepare|project|assignment|homework|research|exercise|walk|meet|call|dinner|lunch|breakfast|go for a walk|take a walk)\b/i.test(sentence)) {
      const time = chrono.parseDate(singleTimeMatch[1]);
      const name = extractTaskName(sentence);

      if (time && name) {
        const startTime = formatTime(time);
        const inferredDuration = /\bwalk\b/i.test(name) ? 30 : /\b(lunch|breakfast|dinner|meal)\b/i.test(name) ? 45 : 60;
        const endTime = addMinutesToTime(startTime, inferredDuration) || startTime;

        data.activities.push({ name, start: startTime, end: endTime });
        data.tasks.push({
          name,
          priority: detectPriority(sentence),
          fixed_time: { start: startTime, end: endTime },
          duration_minutes: inferredDuration
        });
        continue;
      }
    }

    if (durationMatch && isOpenTaskSentence(sentenceLower)) {
      const value = Number(durationMatch[1]);
      const unit = durationMatch[2];
      if (!Number.isNaN(value) && value > 0) {
        const duration = /h|hour|hr/i.test(unit) ? Math.round(value * 60) : Math.round(value);
        const name = extractTaskName(sentence.replace(durationMatch[0], " "));

        if (name) {
          addTaskIfMissing(data, name, sentence, { duration_minutes: duration });
          continue;
        }
      }
    }

    if (isOpenTaskSentence(sentence)) {
      const name = extractTaskName(sentence);
      if (name) {
        addTaskIfMissing(data, name, sentence);
      }
    }
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