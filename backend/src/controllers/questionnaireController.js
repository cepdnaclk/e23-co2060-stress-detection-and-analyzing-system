import Questionnaire from "../models/Questionnaire.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";
import UserActivity from "../models/UserActivity.js";

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

// DASS-21 item grouping by question id (1..21)
// s = stress, a = anxiety, d = depression
const DASS_21_GROUPS = Object.freeze({
  stress: Object.freeze([1, 6, 8, 11, 12, 14, 18]),
  anxiety: Object.freeze([2, 4, 7, 9, 15, 19, 20]),
  depression: Object.freeze([3, 5, 10, 13, 16, 17, 21]),
});

const readAnswerValue = (answers, questionId) => {
  // Answers can arrive with keys as strings or numbers
  const raw = answers?.[questionId] ?? answers?.[String(questionId)];
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0 || num > 3) return null;
  return num;
};

const sumGroup = (answers, ids) => {
  let sum = 0;
  for (const id of ids) {
    const v = readAnswerValue(answers, id);
    if (v === null) return null;
    sum += v;
  }
  return sum;
};

const getDepressionSeverity = (score) => {
  if (score >= 28) return "extremely_severe";
  if (score >= 21) return "severe";
  if (score >= 14) return "moderate";
  if (score >= 10) return "mild";
  return "normal";
};

const getAnxietySeverity = (score) => {
  if (score >= 20) return "extremely_severe";
  if (score >= 15) return "severe";
  if (score >= 10) return "moderate";
  if (score >= 8) return "mild";
  return "normal";
};

const getStressSeverity = (score) => {
  if (score >= 34) return "extremely_severe";
  if (score >= 26) return "severe";
  if (score >= 19) return "moderate";
  if (score >= 15) return "mild";
  return "normal";
};

const SEVERITY_RANK = Object.freeze({
  normal: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
  extremely_severe: 4,
});

const getOverallSeverity = (severities) => {
  let overall = "normal";

  for (const severity of severities) {
    if (SEVERITY_RANK[severity] > SEVERITY_RANK[overall]) {
      overall = severity;
    }
  }

  return overall;
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

export const calculateQuestionnaireScore = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "Answers payload is required" });
    }

    // Validate we can score all 21 items (ids 1..21) with values in [0..3]
    for (let i = 1; i <= 21; i++) {
      const v = readAnswerValue(answers, i);
      if (v === null) {
        return res.status(400).json({
          message: `Invalid or missing answer for question ${i}. Expected a number between 0 and 3.`,
        });
      }
    }

    // Raw sums are 0..21 for each scale (7 items, each 0..3)
    // Many published DASS-21 thresholds assume scores are multiplied by 2.
    const stressScoreRaw = sumGroup(answers, DASS_21_GROUPS.stress);
    const anxietyScoreRaw = sumGroup(answers, DASS_21_GROUPS.anxiety);
    const depressionScoreRaw = sumGroup(answers, DASS_21_GROUPS.depression);

    if (stressScoreRaw === null || anxietyScoreRaw === null || depressionScoreRaw === null) {
      return res.status(400).json({ message: "Invalid answer value detected" });
    }

    // Scaled scores (0..42) to match the provided thresholds.
    const stressScore = stressScoreRaw * 2;
    const anxietyScore = anxietyScoreRaw * 2;
    const depressionScore = depressionScoreRaw * 2;

    const stressSeverity = getStressSeverity(stressScore);
    const anxietySeverity = getAnxietySeverity(anxietyScore);
    const depressionSeverity = getDepressionSeverity(depressionScore);

    // Keep the raw total for compatibility, but do not use it for severity classification.
    const totalScore = stressScoreRaw + anxietyScoreRaw + depressionScoreRaw;

    const severity = getOverallSeverity([stressSeverity, anxietySeverity, depressionSeverity]);

    if (req.user?._id) {
      await QuestionnaireResult.create({
        userId: req.user._id,
        totalScore,
        severity,
        stressScore,
        stressSeverity,
        anxietyScore,
        anxietySeverity,
        depressionScore,
        depressionSeverity,
        recordedAt: new Date(),
      });

      // Upsert a completed activity — promotes any in_progress doc or creates fresh
      const existingInProgress = await UserActivity.findOne({
        userId: req.user._id,
        activityType: "assessment",
        status: "in_progress",
      }).sort({ createdAt: -1 });

      if (existingInProgress) {
        existingInProgress.status = "completed";
        existingInProgress.progress = 100;
        existingInProgress.metadata = { stressLevel: severity, score: stressScore };
        await existingInProgress.save();
      } else {
        await UserActivity.create({
          userId: req.user._id,
          activityType: "assessment",
          title: "DASS-21 Assessment",
          status: "completed",
          progress: 100,
          metadata: { stressLevel: severity, score: stressScore },
        });
      }
    }

    // Keep existing response fields for mobile compatibility, but add sub-scores.
    return res.status(200).json({
      totalScore,
      severity,
      stressScore,
      stressSeverity,
      anxietyScore,
      anxietySeverity,
      depressionScore,
      depressionSeverity,
      // Extra debug/compat fields (do not remove without coordinating clients)
      stressScoreRaw,
      anxietyScoreRaw,
      depressionScoreRaw,
    });
  } catch (error) {
    console.error("Error calculating questionnaire score:", error);
    return res.status(500).json({ message: "Internal Server error" });
  }
};
