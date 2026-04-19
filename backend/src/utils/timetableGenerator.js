import OpenAI from "openai";

function minutesFromHHMM(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmmFromMinutes(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = String(Math.floor(normalized / 60)).padStart(2, "0");
  const m = String(normalized % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function durationMinutes(startHHMM, endHHMM) {
  const start = minutesFromHHMM(startHHMM);
  const end = minutesFromHHMM(endHHMM);

  if (start === null || end === null) return null;
  if (end >= start) return end - start;
  return (24 * 60 - start) + end;
}

function enforceBreakAfterFree(timetable, sleepTime) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((b) => ({ ...b, type: String(b.type || "").toLowerCase() }));

  // If the model returns "break -> free", rewrite it as "free -> short break".
  for (let i = 1; i < blocks.length; i += 1) {
    const prev = blocks[i - 1];
    const curr = blocks[i];

    if (prev.type !== "break" || curr.type !== "free") continue;
    if (prev.end !== curr.start) continue;

    const prevDuration = durationMinutes(prev.start, prev.end);
    const currDuration = durationMinutes(curr.start, curr.end);
    if (prevDuration === null || currDuration === null) continue;
    if (currDuration < 10) continue;

    const newBreakMinutes = 5;
    const freeEnd = hhmmFromMinutes(minutesFromHHMM(curr.end) - newBreakMinutes);

    blocks.splice(i - 1, 2,
      {
        start: prev.start,
        end: freeEnd,
        activity: "Free time",
        type: "free"
      },
      {
        start: freeEnd,
        end: curr.end,
        activity: "Break",
        type: "break"
      }
    );

    i -= 1;
  }

  // Ensure each free block is followed by a short break unless the day ends at sleep time.
  for (let i = 0; i < blocks.length; i += 1) {
    const curr = blocks[i];
    if (curr.type !== "free") continue;
    if (curr.end === sleepTime) continue;

    const next = blocks[i + 1];
    if (next && next.type === "break") continue;

    const freeDuration = durationMinutes(curr.start, curr.end);
    if (freeDuration === null || freeDuration < 10) continue;

    const newBreakMinutes = 5;
    const breakStart = hhmmFromMinutes(minutesFromHHMM(curr.end) - newBreakMinutes);
    const breakEnd = curr.end;

    curr.end = breakStart;
    blocks.splice(i + 1, 0, {
      start: breakStart,
      end: breakEnd,
      activity: "Break",
      type: "break"
    });
    i += 1;
  }

  return { ...timetable, blocks };
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
  const breakAfterFreePreference = Boolean(schedule.break_after_free_preference);

  const relaxTargetMinutes =
    relaxPreference === "high" ? 120 : relaxPreference === "low" ? 60 : 90;

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

Wake time: ${wakeTime}
Sleep time: ${sleepTime}
Relaxation preference: ${relaxPreference}
Target relaxing time (break + free + recovery): at least ${relaxTargetMinutes} minutes

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
${breakAfterFreePreference
  ? '8) User requested this explicitly: after every "free" block, add a short 5-10 minute "break" block next, unless it is immediately followed by sleep. Never place a break immediately before a free block.'
  : ""}
`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You generate optimized student timetables. Always respond with valid JSON only, no markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const raw = response.choices[0].message.content.trim();

  // Strip markdown code fences if the LLM wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned);
    if (breakAfterFreePreference) {
      return enforceBreakAfterFree(parsed, sleepTime);
    }
    return parsed;
  } catch {
    // Fallback: return raw text so the frontend can still display something
    return { raw_text: raw, blocks: [] };
  }
}

export default generateTimetable;