import OpenAI from "openai";

function minutesFromHHMM(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmmFromMinutes(totalMinutes) {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function normalizeType(type, activity) {
  const t = String(type || "").toLowerCase();
  const a = String(activity || "").toLowerCase();

  if (["activity", "meal", "break", "free"].includes(t)) return t;
  if (/meal|breakfast|lunch|dinner/.test(a)) return "meal";
  if (/break|short rest/.test(a)) return "break";
  if (/free|recovery|relax/.test(a)) return "free";

  return "activity";
}

function isRelaxBlock(block) {
  return block.type === "break" || block.type === "free";
}

function splitLongRelaxBlocks(blocks, maxRelaxMinutes) {
  const result = [];

  for (const block of blocks) {
    if (block.type !== "free") {
      result.push(block);
      continue;
    }

    const startMin = minutesFromHHMM(block.start);
    const endMin = minutesFromHHMM(block.end);
    if (startMin === null || endMin === null) {
      result.push(block);
      continue;
    }

    const total = endMin - startMin;
    if (total <= maxRelaxMinutes) {
      result.push(block);
      continue;
    }

    const anchorMinutes = 20;
    let cursor = startMin;
    let remaining = total;

    while (remaining > 0) {
      const chunk = Math.min(maxRelaxMinutes, remaining);
      const freeEnd = cursor + chunk;

      result.push({
        start: hhmmFromMinutes(cursor),
        end: hhmmFromMinutes(freeEnd),
        activity: "Recovery / Free time",
        type: "free",
      });

      cursor = freeEnd;
      remaining -= chunk;

      // Break very long passive time with a short active reset.
      if (remaining > anchorMinutes) {
        const anchorEnd = cursor + anchorMinutes;
        result.push({
          start: hhmmFromMinutes(cursor),
          end: hhmmFromMinutes(anchorEnd),
          activity: "Light activity (walk/stretch)",
          type: "activity",
        });
        cursor = anchorEnd;
        remaining -= anchorMinutes;
      }
    }
  }

  return result;
}

function normalizeBlocks(blocks, maxRelaxMinutes = 120) {
  if (!Array.isArray(blocks)) return [];

  const valid = blocks
    .map((b) => {
      const start = String(b?.start || "");
      const end = String(b?.end || "");
      const startMin = minutesFromHHMM(start);
      const endMin = minutesFromHHMM(end);

      if (startMin === null || endMin === null || endMin <= startMin) return null;

      return {
        start,
        end,
        activity: String(b?.activity || "Task"),
        type: normalizeType(b?.type, b?.activity),
      };
    })
    .filter(Boolean)
    .sort((a, b) => minutesFromHHMM(a.start) - minutesFromHHMM(b.start));

  const merged = [];

  for (const current of valid) {
    const prev = merged[merged.length - 1];

    if (!prev) {
      merged.push(current);
      continue;
    }

    const contiguous = prev.end === current.start;

    // Collapse chains like free -> break -> free into one recovery block.
    if (contiguous && isRelaxBlock(prev) && isRelaxBlock(current)) {
      prev.end = current.end;
      prev.type = "free";
      prev.activity = "Recovery / Free time";
      continue;
    }

    if (contiguous && prev.type === current.type && prev.activity.toLowerCase() === current.activity.toLowerCase()) {
      prev.end = current.end;
      continue;
    }

    merged.push(current);
  }

  return splitLongRelaxBlocks(merged, maxRelaxMinutes);
}

function buildClientConfig() {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
  const groqKey = (process.env.GROQ_API_KEY || "").trim();

  if (openaiKey && openaiKey.startsWith("AIza")) {
    throw new Error(
      "OPENAI_API_KEY looks like a Google API key (AIza...). Use an OpenAI key (sk-...) or set LLM_PROVIDER=groq with GROQ_API_KEY (gsk_...)."
    );
  }

  const useGroq =
    provider === "groq" ||
    Boolean(groqKey) ||
    (provider !== "openai" && typeof openaiKey === "string" && openaiKey.startsWith("gsk_"));

  if (useGroq) {
    const apiKey = groqKey || openaiKey;

    if (!apiKey) {
      throw new Error("GROQ_API_KEY (or OPENAI_API_KEY with a Groq key) is not set.");
    }

    return {
      client: new OpenAI({
        apiKey,
        baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
      }),
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant"
    };
  }

  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
  }

  return {
    client: new OpenAI({ apiKey: openaiKey }),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini"
  };
}

async function generateTimetable(schedule) {
  const { client, model } = buildClientConfig();

  const wakeTime = schedule.wake_time || "07:00";
  const sleepTime = schedule.sleep_time || "23:00";
  const relaxPreference = schedule.relaxation_preference || "medium";

  const relaxTargetMinutes =
    relaxPreference === "high" ? 120 : relaxPreference === "low" ? 60 : 90;
  const maxRelaxBlockMinutes =
    relaxPreference === "high" ? 150 : relaxPreference === "low" ? 90 : 120;

  const fixedActivitiesText = (schedule.activities || []).length
    ? schedule.activities.map((a) => `${a.name} from ${a.start} to ${a.end}`).join("\n")
    : "None";

  const tasksText = (schedule.tasks || []).length
    ? schedule.tasks
      .map((t) => {
        const fixed = t.fixed_time ? `fixed ${t.fixed_time.start}-${t.fixed_time.end}` : "flexible";
        const duration = t.duration_minutes ? `${t.duration_minutes} minutes` : "duration not specified";
        return `- ${t.name} | ${fixed} | ${duration} | priority: ${t.priority || "medium"}`;
      })
      .join("\n")
    : "None";

  const prompt = `
You are a productivity assistant.

Using the following schedule data, generate a clear daily timetable as JSON.

Primary goal or intent:
${goalText}

Raw user message:
${rawText}

Wake time: ${wakeTime}
Sleep time: ${sleepTime}
Fixed-time activities:
${fixedActivitiesText}

User tasks (from free-text input):
${tasksText}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "wake_time": "HH:MM",
  "sleep_time": "HH:MM",
  "blocks": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "activity": "Activity name",
      "type": "activity" | "break" | "meal" | "free"
    }
  ],
  "summary": "One-sentence summary of the day"
}

Fill the entire day from wake to sleep with time blocks.
Rules:
1) Respect all fixed-time tasks exactly.
2) Allocate flexible tasks into realistic focus blocks (usually 45-90 minutes each).
3) Insert short relaxing breaks after each focus block and at least one longer recovery/free block.
4) Include meal blocks at sensible times.
5) Keep transitions realistic and avoid overlapping blocks.
6) Make sure total relaxing time reaches or exceeds the target above.
7) If tasks are too many, reduce low-priority task time first and mention it in summary.
8) Never output consecutive relaxation blocks (break/free/recovery) back-to-back; merge them into one longer recovery block instead.
`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You generate optimized student timetables. Infer the schedule from the user's raw message and always respond with valid JSON only, no markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown code fences if the LLM wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    return {
      ...parsed,
      blocks: normalizeBlocks(parsed.blocks, maxRelaxBlockMinutes),
    };
  } catch {
    // Fallback: return raw text so the frontend can still display something
    return { raw_text: raw, blocks: [] };
  }
}

export default generateTimetable;