/**
 * Generates recommendation targets based on risk analysis.
 * @param {Object} riskAnalysis - Output from stressRiskService ({ riskScore, riskLevel, stressTrend, contributingFactors })
 * @returns {Object|null} Recommendation configuration { feature, title, message } or null
 */
export const getRecommendation = (riskAnalysis) => {
  const { riskLevel, stressTrend, contributingFactors } = riskAnalysis;

  if (riskLevel === "HIGH" && stressTrend === "INCREASING") {
    return {
      feature: "ClinicalLocator",
      title: "Stress Alert",
      message: "Your stress levels have been increasing significantly. Please consider exploring nearby professional support in the Clinical Locator.",
    };
  }

  if (contributingFactors.includes("reduced_sleep")) {
    return {
      feature: "TherapyHub",
      title: "Sleep Optimization",
      message: "We noticed you reported less sleep than usual. Try a relaxation exercise in the Therapy Hub before bed to help you get more rest.",
    };
  }

  if (contributingFactors.includes("poor_sleep")) {
    return {
      feature: "TherapyHub",
      title: "Sleep Quality",
      message: "Your sleep quality was lower than ideal. Consider checking the Therapy Hub for guided sleep meditations to improve how you rest.",
    };
  }

  if (contributingFactors.includes("high_workload")) {
    return {
      feature: "RoutineGenerator",
      title: "Workload Management",
      message: "Your workload has been high recently. Consider using the Routine Generator to balance your schedule.",
    };
  }

  if (contributingFactors.includes("low_physical_activity")) {
    return {
      feature: "RoutineGenerator",
      title: "Physical Activity",
      message: "We noticed your physical activity is low today. A short 15-minute walk can significantly boost your mood and lower stress.",
    };
  }

  if (stressTrend === "INCREASING") {
    return {
      feature: "TherapyHub",
      title: "Stress Trend Alert",
      message: "Your stress is trending slightly up. Taking a short break with a breathing exercise in the Therapy Hub might help.",
    };
  }

  // No specific alert needed if doing well
  return null;
};
