import DailyCheckIn from "../models/DailyCheckIn.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";

/**
 * Calculates risk score, trend, and contributing factors based on user data.
 * @param {Object} currentCheckIn - The new check-in data.
 * @param {Array} previousCheckIns - Array of up to 7 previous check-ins (sorted latest first).
 * @param {Object} latestQuestionnaire - The latest DASS-21 result (optional).
 * @returns {Object} { riskScore, riskLevel, stressTrend, contributingFactors }
 */
export const calculateStressRisk = (currentCheckIn, previousCheckIns = [], latestQuestionnaire = null) => {
  let riskScore = 0;
  const contributingFactors = [];

  // 1. Base Score from current stress (Max 40 points)
  riskScore += (currentCheckIn.stressLevel / 5) * 40;

  // 2. Sleep Factor
  // Penalty for low sleep hours (target 8)
  if (currentCheckIn.sleepHours < 8) {
    const sleepHourPenalty = (8 - currentCheckIn.sleepHours) * 2;
    riskScore += sleepHourPenalty;
    contributingFactors.push("reduced_sleep");
  }
  // Penalty for low sleep quality (target 5)
  if (currentCheckIn.sleepQuality < 5) {
    const sleepQualityPenalty = (5 - currentCheckIn.sleepQuality) * 2;
    riskScore += sleepQualityPenalty;
    if (!contributingFactors.includes("poor_sleep")) {
      contributingFactors.push("poor_sleep");
    }
  }

  // 3. Workload Penalty
  if (currentCheckIn.workloadHours > 8) {
    const workloadPenalty = (currentCheckIn.workloadHours - 8) * 2;
    riskScore += workloadPenalty;
    contributingFactors.push("high_workload");
  }

  // 4. Physical Activity (Bonus/Reduction)
  // E.g., over 30 mins reduces risk score slightly
  if (currentCheckIn.physicalActivityMinutes >= 30) {
    riskScore -= 5;
  } else if (currentCheckIn.physicalActivityMinutes === 0) {
    riskScore += 5;
    contributingFactors.push("low_physical_activity");
  }

  // 5. Trend Modifier (Past 3 days average)
  let stressTrend = "STABLE";
  if (previousCheckIns.length > 0) {
    const recentCheckIns = previousCheckIns.slice(0, 3);
    const avgRecentStress =
      recentCheckIns.reduce((sum, ci) => sum + ci.stressLevel, 0) / recentCheckIns.length;
    
    if (currentCheckIn.stressLevel > avgRecentStress) {
      stressTrend = "INCREASING";
      riskScore += 15; // Penalty for increasing trend
      contributingFactors.push("increasing_stress");
    } else if (currentCheckIn.stressLevel < avgRecentStress) {
      stressTrend = "DECREASING";
      riskScore -= 5; // Bonus for decreasing trend
    }
  }

  // 6. DASS-21 Modifier
  if (latestQuestionnaire) {
    if (["Severe", "Extremely Severe"].includes(latestQuestionnaire.stressSeverity)) {
      riskScore += 10;
      contributingFactors.push("dass21_high_stress");
    }
  }

  // Cap score between 0 and 100
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine Risk Level
  let riskLevel = "LOW";
  if (riskScore >= 70) {
    riskLevel = "HIGH";
  } else if (riskScore >= 40) {
    riskLevel = "MODERATE";
  }

  return {
    riskScore: Math.round(riskScore),
    riskLevel,
    stressTrend,
    contributingFactors,
  };
};
