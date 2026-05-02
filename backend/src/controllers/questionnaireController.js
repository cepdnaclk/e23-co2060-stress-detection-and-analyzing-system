import Questionnaire from "../models/Questionnaire.js";

const DEFAULT_QUESTIONS = [
  { id: 1, text: "I found it hard to wind down" },
  { id: 2, text: "I was aware of dryness of my mouth" },
  { id: 3, text: "I couldn’t seem to experience any positive feeling at all" },
  {
    id: 4,
    text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)",
  },
  { id: 5, text: "I found it difficult to work up the initiative to do things" },
  { id: 6, text: "I tended to over-react to situations" },
  { id: 7, text: "I experienced trembling (e.g. in the hands)" },
  { id: 8, text: "I felt that I was using a lot of nervous energy" },
  {
    id: 9,
    text: "I was worried about situations in which I might panic and make a fool of myself",
  },
  { id: 10, text: "I felt that I had nothing to look forward to" },
  { id: 11, text: "I found myself getting agitated" },
  { id: 12, text: "I found it difficult to relax" },
  { id: 13, text: "I felt down-hearted and blue" },
  {
    id: 14,
    text: "I was intolerant of anything that kept me from getting on with what I was doing",
  },
  { id: 15, text: "I felt I was close to panic" },
  { id: 16, text: "I was unable to become enthusiastic about anything" },
  { id: 17, text: "I felt I wasn’t worth much as a person" },
  { id: 18, text: "I felt that I was rather touchy" },
  {
    id: 19,
    text: "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)",
  },
  { id: 20, text: "I felt scared without any good reason" },
  { id: 21, text: "I felt that life was meaningless" },
];

const normalizeQuestions = (rawQuestions) => {
  if (!Array.isArray(rawQuestions)) return null;

  const normalized = rawQuestions
    .map((q) => ({
      id: Number(q?.id),
      text: String(q?.text ?? "").trim(),
    }))
    .filter((q) => Number.isFinite(q.id) && q.id >= 1);

  if (normalized.length === 0) return null;

  // Ensure unique ids
  const idSet = new Set();
  for (const q of normalized) {
    if (!q.text) return null;
    if (idSet.has(q.id)) return null;
    idSet.add(q.id);
  }

  // Keep stable ordering
  normalized.sort((a, b) => a.id - b.id);
  return normalized;
};

export const getQuestionnaireQuestions = async (req, res) => {
  try {
    const slug = "default";
    let doc = await Questionnaire.findOne({ slug });

    if (!doc) {
      doc = await Questionnaire.create({ slug, questions: DEFAULT_QUESTIONS });
    }

    const questions = Array.isArray(doc.questions) && doc.questions.length
      ? doc.questions
      : DEFAULT_QUESTIONS;

    return res.status(200).json({ questions });
  } catch (error) {
    console.error("Error fetching questionnaire questions:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

export const updateQuestionnaireQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const normalized = normalizeQuestions(questions);

    if (!normalized) {
      return res.status(400).json({ message: "Invalid questions payload" });
    }

    // Keep the scoring questionnaire shape stable (21 questions, ids 1..21)
    if (normalized.length !== 21) {
      return res.status(400).json({ message: "Questionnaire must contain exactly 21 questions" });
    }

    for (let i = 1; i <= 21; i++) {
      if (normalized[i - 1]?.id !== i) {
        return res.status(400).json({ message: "Question ids must be 1 through 21" });
      }
    }

    const slug = "default";
    const doc = await Questionnaire.findOneAndUpdate(
      { slug },
      { $set: { questions: normalized } },
      { new: true, upsert: true }
    );

    return res.status(200).json({ questions: doc.questions });
  } catch (error) {
    console.error("Error updating questionnaire questions:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

export const calculateQuestionnaireScore = (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Answers payload is required" });
    }

    const values = Object.values(answers);

    if (values.length === 0) {
      return res.status(400).json({ message: "No answers provided" });
    }

    let totalScore = 0;

    for (const value of values) {
      const num = Number(value);

      if (!Number.isFinite(num) || num < 0) {
        return res.status(400).json({ message: "Invalid answer value detected" });
      }

      totalScore += num;
    }

    let severity = "normal";

    if (totalScore >= 15 && totalScore <= 18) {
      severity = "mild";
    } else if (totalScore >= 19 && totalScore <= 25) {
      severity = "moderate";
    } else if (totalScore > 26) {
      severity = "severe";
    }

    return res.status(200).json({ totalScore, severity });
  } catch (error) {
    console.error("Error calculating questionnaire score:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};
