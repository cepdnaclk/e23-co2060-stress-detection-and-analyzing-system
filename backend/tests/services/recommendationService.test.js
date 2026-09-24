import { getRecommendation } from "../../src/services/recommendationService.js";

describe("Recommendation Service", () => {
  it("should return Clinical Locator recommendation for HIGH risk and INCREASING trend", () => {
    const riskAnalysis = {
      riskLevel: "HIGH",
      stressTrend: "INCREASING",
      contributingFactors: [],
    };

    const recommendation = getRecommendation(riskAnalysis);

    expect(recommendation).not.toBeNull();
    expect(recommendation.feature).toBe("ClinicalLocator");
    expect(recommendation.title).toBe("Stress Alert");
  });

  it("should return Therapy Hub recommendation for poor sleep", () => {
    const riskAnalysis = {
      riskLevel: "MODERATE",
      stressTrend: "STABLE",
      contributingFactors: ["poor_sleep"],
    };

    const recommendation = getRecommendation(riskAnalysis);

    expect(recommendation).not.toBeNull();
    expect(recommendation.feature).toBe("TherapyHub");
    expect(recommendation.title).toBe("Sleep Optimization");
  });

  it("should return null for healthy metrics", () => {
    const riskAnalysis = {
      riskLevel: "LOW",
      stressTrend: "STABLE",
      contributingFactors: [],
    };

    const recommendation = getRecommendation(riskAnalysis);

    expect(recommendation).toBeNull();
  });
});
