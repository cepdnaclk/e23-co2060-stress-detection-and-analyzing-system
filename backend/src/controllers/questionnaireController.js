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
