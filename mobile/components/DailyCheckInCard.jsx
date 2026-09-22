import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export default function DailyCheckInCard({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    stressLevel: null,
    mood: null,
    sleepHours: 8,
    sleepQuality: null,
    workloadHours: 8,
    physicalActivityMinutes: 30,
  });

  // Reset state when visible
  useEffect(() => {
    if (visible) {
      setStep(1);
      setFormData({
        stressLevel: null,
        mood: null,
        sleepHours: 8,
        sleepQuality: null,
        workloadHours: 8,
        physicalActivityMinutes: 30,
      });
    }
  }, [visible]);

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
        onSuccess(); // Close modal and refresh data
      } else {
        console.error("Failed to submit check-in");
        onClose(); // Close anyway on error for now
      }
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

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

  const renderAdjuster = (field, label, unit, min = 0, stepVal = 1) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.adjusterRow}>
        <Pressable
          style={styles.adjusterBtn}
          onPress={() => updateField(field, Math.max(min, formData[field] - stepVal))}
        >
          <Ionicons name="remove" size={24} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.adjusterValue}>
          {formData[field]} {unit}
        </Text>
        <Pressable
          style={styles.adjusterBtn}
          onPress={() => updateField(field, formData[field] + stepVal)}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Daily Check-in</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {step === 1 && (
                <View>
                  <Text style={styles.subtitle}>How are you feeling today?</Text>
                  {renderRatingRow("mood", "Mood", "Terrible", "Great")}
                  {renderRatingRow("stressLevel", "Stress Level", "Calm", "Very High")}
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text style={styles.subtitle}>How did you sleep?</Text>
                  {renderAdjuster("sleepHours", "Sleep Duration", "hrs", 0, 1)}
                  {renderRatingRow("sleepQuality", "Sleep Quality", "Poor", "Excellent")}
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.subtitle}>Today's activity</Text>
                  {renderAdjuster("workloadHours", "Study / Work", "hrs", 0, 1)}
                  {renderAdjuster("physicalActivityMinutes", "Physical Activity", "mins", 0, 15)}
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              {step > 1 ? (
                <Pressable style={styles.btnSecondary} onPress={handlePrev}>
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              
              {step < 3 ? (
                <Pressable style={styles.btnPrimary} onPress={handleNext}>
                  <Text style={styles.btnPrimaryText}>Next</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.btnPrimaryText}>
                    {loading ? "Saving..." : "Submit"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 25, 40, 0.58)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  scroll: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBtnActive: {
    backgroundColor: COLORS.primary,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  ratingTextActive: {
    color: COLORS.white,
  },
  ratingLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  ratingEdgeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  adjusterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f2f8ff",
    borderRadius: 16,
    padding: 8,
  },
  adjusterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  adjusterValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#f2f8ff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
