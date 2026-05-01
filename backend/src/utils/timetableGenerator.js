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

function isLowIntensityBlock(block) {
  const type = String(block?.type || "").toLowerCase();
  const activity = String(block?.activity || "").toLowerCase();
  return type === "free" || type === "break" || type === "recovery" || activity.includes("free") || activity.includes("break") || activity.includes("recovery");
}

function estimateTaskMinutes(task) {
  if (task?.duration_minutes && task.duration_minutes > 0) {
    return task.duration_minutes;
  }

  const name = String(task?.name || "").toLowerCase();

  if (name.includes("reading")) return 30;
  if (name.includes("project")) return 60;
  if (name.includes("study") || name.includes("exam") || name.includes("revise") || name.includes("revision") || name.includes("homework") || name.includes("assignment")) return 45;
  if (name.includes("walk") || name.includes("exercise") || name.includes("break")) return 30;

  return 45;
}

function normalizeBlocks(timetable) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks
    .filter((block) => block && /^\d{2}:\d{2}$/.test(block.start) && /^\d{2}:\d{2}$/.test(block.end))
    .map((block) => ({
      ...block,
      type: String(block.type || "").toLowerCase(),
      activity: String(block.activity || "").trim()
    }))
    .sort(
      (a, b) =>
        minutesFromHHMM(a.start) - minutesFromHHMM(b.start) ||
        minutesFromHHMM(a.end) - minutesFromHHMM(b.end)
    );

  const merged = [];

  for (const block of blocks) {
    const previous = merged[merged.length - 1];

    if (previous && previous.end === block.start && isLowIntensityBlock(previous) && isLowIntensityBlock(block)) {
      previous.end = block.end;
      previous.type = "free";
      previous.activity = previous.activity.toLowerCase().includes("break") || previous.activity.toLowerCase().includes("recovery")
        ? "Free"
        : previous.activity;
      continue;
    }

    if (
      previous &&
      previous.type === block.type &&
      previous.end === block.start &&
      previous.activity === block.activity
    ) {
      previous.end = block.end;
      continue;
    }

    merged.push({ ...block });
  }

  return { ...timetable, blocks: merged };
}

function insertMissingTaskBlocks(timetable, tasks) {
  if (!timetable || !Array.isArray(timetable.blocks) || timetable.blocks.length === 0) {
    return timetable;
  }

  const blocks = timetable.blocks.map((block) => ({ ...block }));
  const existingActivities = new Set(
    blocks.map((block) => String(block.activity || "").trim().toLowerCase())
  );

  const missingTasks = (tasks || []).filter((task) => {
    const name = String(task?.name || "").trim().toLowerCase();
    return name && !existingActivities.has(name);
  });

  if (!missingTasks.length) {
    return timetable;
  }

  for (const task of missingTasks) {
    const taskName = String(task.name || "").trim();
    const taskMinutes = estimateTaskMinutes(task);
    if (!taskName || taskMinutes <= 0) continue;

    let placed = false;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (String(block.type || "").toLowerCase() !== "free") continue;

      const freeMinutes = durationMinutes(block.start, block.end);
      if (freeMinutes === null || freeMinutes < taskMinutes) continue;

      const start = block.start;
      const taskEnd = hhmmFromMinutes(minutesFromHHMM(start) + taskMinutes);

      const inserted = {
        start,
        end: taskEnd,
        activity: taskName,
        type: "activity"
      };

      if (taskEnd === block.end) {
        blocks.splice(i, 1, inserted);
      } else {
        blocks.splice(i, 1,
          inserted,
          {
            start: taskEnd,
            end: block.end,
            activity: "Free",
            type: "free"
          }
        );
      }

      placed = true;
      break;
    }

    if (!placed) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && String(lastBlock.type || "").toLowerCase() === "free") {
        const lastFreeMinutes = durationMinutes(lastBlock.start, lastBlock.end);
        if (lastFreeMinutes !== null && lastFreeMinutes >= taskMinutes) {
          const taskStart = lastBlock.start;
          const taskEnd = hhmmFromMinutes(minutesFromHHMM(taskStart) + taskMinutes);

          blocks.splice(blocks.length - 1, 1,
            {
              start: taskStart,
              end: taskEnd,
              activity: taskName,
              type: "activity"
            },
            {
              start: taskEnd,
              end: lastBlock.end,
              activity: "Free",
              type: "free"
            }
          );
        }
      }
    }
  }

  return { ...timetable, blocks };
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
  const freeAfterTaskPreference = Boolean(schedule.free_after_task_preference);
  const goalText = schedule.goal || schedule.raw_text || "None";

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

Primary goal or intent:
${goalText}

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
Routine rules:
1) Fill the entire period from wake time to sleep time with contiguous blocks and keep them in chronological order.
2) If a task or activity has a fixed time, schedule it exactly at that time.
3) If a task has a duration, preserve that duration exactly and place it in a realistic slot.
4) Do not invent new subjects, tasks, or activities. Only schedule what the user actually mentioned.
5) Do not skip any user-mentioned task or activity. Every input item must appear somewhere in the routine.
6) Prefer a balanced day: early focus blocks for important work, short breaks between work blocks, meals at natural times, and a calmer wind-down near sleep.
7) Keep focused work blocks reasonably short, usually 25-50 minutes, and keep breaks short, usually 5-10 minutes.
8) Never place consecutive free, break, or recovery blocks. If two low-intensity blocks touch, merge them into one block.
9) Do not overlap blocks or leave gaps between blocks unless the gap is part of a single free block.
10) If the user asked for a short break after free time, place a 5-10 minute break immediately after each free block except right before sleep.
11) If the user asked for free time after tasks, place a short free block after each completed task or work block whenever the schedule has room.
${breakAfterFreePreference
  ? '12) User requested this explicitly: after every "free" block, add a short 5-10 minute "break" block next, unless it is immediately followed by sleep. Never place a break immediately before a free block.'
  : ""}
${freeAfterTaskPreference
  ? '13) User requested this explicitly: after each task or work block, add a short free-time block when possible so the day has breathing room between tasks.'
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
    let timetable = normalizeBlocks(parsed);

    if (Array.isArray(schedule.tasks) && schedule.tasks.length) {
      timetable = insertMissingTaskBlocks(timetable, schedule.tasks);
    }

    if (breakAfterFreePreference) {
      timetable = enforceBreakAfterFree(timetable, sleepTime);
    }

    return normalizeBlocks(timetable);
  } catch {
    // Fallback: return raw text so the frontend can still display something
    return { raw_text: raw, blocks: [] };
  }
}

export default generateTimetable;