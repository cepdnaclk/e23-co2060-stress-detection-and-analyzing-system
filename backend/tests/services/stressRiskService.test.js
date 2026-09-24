import { calculateStressRisk } from "../../src/services/stressRiskService.js";

describe("Stress Risk Service", () => {
  it("should return a LOW risk score for a healthy check-in", () => {
    const checkIn = {
      stressLevel: 1, // very low stress
      sleepHours: 8,
      sleepQuality: 5, // max quality
      workloadHours: 6,
      physicalActivityMinutes: 45,
    };

    const result = calculateStressRisk(checkIn, [], null);

    expect(result.riskLevel).toBe("LOW");
    expect(result.riskScore).toBeLessThan(40);
    expect(result.stressTrend).toBe("STABLE");
    expect(result.contributingFactors).toEqual([]);
  });

  it("should apply penalties for poor sleep and high stress", () => {
    const checkIn = {
      stressLevel: 5, // very high stress
      sleepHours: 5, // -3 hours
      sleepQuality: 2, // -3 quality
      workloadHours: 8,
      physicalActivityMinutes: 0, // no physical activity
    };

    const result = calculateStressRisk(checkIn, [], null);

    // Baseline stress: (5/5)*40 = 40
    // Sleep Hours Penalty: (8-5)*2 = 6
    // Sleep Quality Penalty: (5-2)*2 = 6
    // Physical Activity Penalty: 5
    // Total expected: 40 + 6 + 6 + 5 = 57 -> MODERATE risk
    expect(result.riskScore).toBe(57);
    expect(result.riskLevel).toBe("MODERATE");
    expect(result.contributingFactors).toContain("reduced_sleep");
    expect(result.contributingFactors).toContain("poor_sleep");
    expect(result.contributingFactors).toContain("low_physical_activity");
  });

  it("should apply trend penalty when stress is increasing", () => {
    const checkIn = {
      stressLevel: 4,
      sleepHours: 8,
      sleepQuality: 5,
      workloadHours: 8,
      physicalActivityMinutes: 30, // -5 bonus
    };

    const previousCheckIns = [
      { stressLevel: 2 },
      { stressLevel: 2 },
      { stressLevel: 2 }
    ]; // Avg: 2

    const result = calculateStressRisk(checkIn, previousCheckIns, null);

    // Baseline: (4/5)*40 = 32
    // PA Bonus: -5
    // Trend Penalty (4 > 2): +15
    // Total expected: 32 - 5 + 15 = 42 -> MODERATE risk
    expect(result.stressTrend).toBe("INCREASING");
    expect(result.riskScore).toBe(42);
    expect(result.contributingFactors).toContain("increasing_stress");
  });

  it("should apply DASS-21 modifier for severe stress", () => {
    const checkIn = {
      stressLevel: 3,
      sleepHours: 8,
      sleepQuality: 5,
      workloadHours: 8,
      physicalActivityMinutes: 30, // -5
    };
    const latestQuestionnaire = { stressSeverity: "Severe" };

    const result = calculateStressRisk(checkIn, [], latestQuestionnaire);

    // Baseline: (3/5)*40 = 24
    // PA Bonus: -5
    // DASS-21 Penalty: +10
    // Total expected: 24 - 5 + 10 = 29 -> LOW risk
    expect(result.riskScore).toBe(29);
    expect(result.riskLevel).toBe("LOW");
    expect(result.contributingFactors).toContain("dass21_high_stress");
  });
});
