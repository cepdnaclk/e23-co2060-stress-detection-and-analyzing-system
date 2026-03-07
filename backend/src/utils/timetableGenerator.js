import OpenAI from "openai";

function buildClientConfig() {
  const provider = (process.env.LLM_PROVIDER || "").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

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

  const prompt = `
You are a productivity assistant.

Using the following schedule data, generate a clear daily timetable as JSON.

Wake time: ${schedule.wake_time}
Sleep time: ${schedule.sleep_time}

Activities:
${schedule.activities.map(a =>
  `${a.name} from ${a.start} to ${a.end}`
).join("\n")}

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
Include break and meal suggestions between activities.
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
    return JSON.parse(cleaned);
  } catch {
    // Fallback: return raw text so the frontend can still display something
    return { raw_text: raw, blocks: [] };
  }
}

export default generateTimetable;