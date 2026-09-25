import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function DailyCheckInCard({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    sleepHours: 8,
    sleepQuality: 4,
    workloadHours: 8,
    physicalActivityMinutes: 30,
    mood: 4,
    stressLevel: 2,
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/checkins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (onSuccess) onSuccess();
      } else {
        console.error("Failed to submit check-in");
        if (onClose) onClose();
      }
    } catch (err) {
      console.error(err);
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderRatingRow = (field, label, minLabel, maxLabel) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.ratingRow}>
        {RATING_OPTIONS.map((val) => (
          <Pressable
            key={val}
            style={[
              styles.ratingBtn,
              formData[field] === val && styles.ratingBtnActive,
            ]}
            onPress={() => updateField(field, val)}
          >
            <Text
              style={[
                styles.ratingText,
                formData[field] === val && styles.ratingTextActive,
              ]}
            >
              {val}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.ratingLabelsRow}>
        <Text style={styles.ratingEdgeLabel}>{minLabel}</Text>
        <Text style={styles.ratingEdgeLabel}>{maxLabel}</Text>
      </View>
    </View>
  );

  const renderAdjuster = (field, label, unit, min = 0, max = 24, stepVal = 1) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.adjusterRow}>
        <Pressable
          style={styles.adjusterBtn}
          onPress={() => updateField(field, Math.max(min, formData[field] - stepVal))}
        >
          <Ionicons name="remove" size={20} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.adjusterValue}>
          {formData[field]} {unit}
        </Text>
        <Pressable
          style={styles.adjusterBtn}
          onPress={() => updateField(field, Math.min(max, formData[field] + stepVal))}
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );

  const stepMeta = {
    1: {
      icon: "moon-outline",
      tag: "Step 1 of 3",
      title: "How did you sleep?",
      subtitle: "Track your rest and recovery",
    },
    2: {
      icon: "briefcase-outline",
      tag: "Step 2 of 3",
      title: "Today's Work & Activity",
      subtitle: "Log your daily routine load",
    },
    3: {
      icon: "happy-outline",
      tag: "Step 3 of 3",
      title: "How are you feeling?",
      subtitle: "Check in with your mood and stress",
    },
  }[step];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name={stepMeta.icon} size={20} color={COLORS.primary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Daily Check-in</Text>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{stepMeta.tag}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{stepMeta.subtitle}</Text>
          </View>
        </View>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        {step === 1 && (
          <View>
            {renderAdjuster("sleepHours", "Sleep Duration", "hrs", 0, 24, 1)}
            {renderRatingRow("sleepQuality", "Sleep Quality", "Poor", "Excellent")}
          </View>
        )}

        {step === 2 && (
          <View>
            {renderAdjuster("workloadHours", "Study / Work", "hrs", 0, 24, 1)}
            {renderAdjuster("physicalActivityMinutes", "Physical Activity", "mins", 0, 300, 15)}
          </View>
        )}

        {step === 3 && (
          <View>
            {renderRatingRow("mood", "Mood", "Terrible", "Great")}
            {renderRatingRow("stressLevel", "Stress Level", "Calm", "Very High")}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {step > 1 ? (
          <Pressable style={styles.btnSecondary} onPress={handlePrev}>
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.btnSecondaryText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {step < 3 ? (
          <Pressable style={styles.btnPrimary} onPress={handleNext}>
            <Text style={styles.btnPrimaryText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Submit</Text>
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dce9f7",
    shadowColor: "#2a6ca7",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(25, 118, 210, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0b3a5a",
  },
  stepBadge: {
    backgroundColor: "#eef6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#5b83a4",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0b3a5a",
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f2f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBtnActive: {
    backgroundColor: COLORS.primary,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  ratingTextActive: {
    color: COLORS.white,
  },
  ratingLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  ratingEdgeLabel: {
    fontSize: 11,
    color: "#6f86a8",
    fontWeight: "500",
  },
  adjusterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f2f8ff",
    borderRadius: 14,
    padding: 6,
  },
  adjusterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  adjusterValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0b3a5a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#f2f8ff",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
