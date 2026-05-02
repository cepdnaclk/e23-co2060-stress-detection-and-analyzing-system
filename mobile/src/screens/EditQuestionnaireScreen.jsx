import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import COLORS from "../../constants/colors";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

export default function EditQuestionnaireScreen() {
  const token = useAuthStore((state) => state.token);

  const [questions, setQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => {
    if (!Array.isArray(questions) || questions.length !== 21) return false;
    return questions.every((q, idx) => q.id === idx + 1 && String(q.text || "").trim().length > 0);
  }, [questions]);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/questionnaire/questions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load questions");

      if (Array.isArray(data.questions) && data.questions.length === 21) {
        const normalized = data.questions
          .map((q) => ({ id: Number(q.id), text: String(q.text ?? "") }))
          .sort((a, b) => a.id - b.id);

        for (let i = 1; i <= 21; i++) {
          if (normalized[i - 1]?.id !== i) {
            throw new Error("Invalid questionnaire data");
          }
        }

        setQuestions(normalized);
      } else {
        throw new Error("Invalid questionnaire data");
      }
    } catch (error) {
      setQuestions(null);
      Alert.alert("Error", error.message || "Could not load questionnaire");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const updateText = (id, nextText) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text: nextText } : q)));
  };

  const handleSave = async () => {
    if (!token) {
      Alert.alert("Unauthorized", "Please sign in again.");
      return;
    }

    if (!canSave) {
      Alert.alert("Invalid", "Please ensure all 21 questions have text.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/questionnaire/questions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questions: questions.map((q) => ({ id: q.id, text: q.text })) }),
        },
        15000
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save questions");

      Alert.alert("Saved", "Questionnaire updated successfully.");
      if (Array.isArray(data.questions)) {
        const normalized = data.questions
          .map((q) => ({ id: Number(q.id), text: String(q.text ?? "") }))
          .sort((a, b) => a.id - b.id);
        setQuestions(normalized);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Could not save questionnaire");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Edit Questionnaire</Text>
          <View style={styles.badge}>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>Admin</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Update the text for each question. The questionnaire remains 21 questions (IDs 1–21).
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {Array.isArray(questions) ? (
            questions.map((q) => (
              <View key={q.id} style={styles.card}>
                <Text style={styles.questionLabel}>Question {q.id}</Text>
                <TextInput
                  value={q.text}
                  onChangeText={(t) => updateText(q.id, t)}
                  placeholder="Enter question text"
                  placeholderTextColor={COLORS.placeholderText}
                  multiline
                  style={styles.input}
                />
              </View>
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.questionLabel}>{isLoading ? "Loading..." : "No questions loaded"}</Text>
              <Text style={styles.subtitle}>
                {isLoading
                  ? "Fetching questionnaire questions from the server."
                  : "Please ensure the backend is running and try again."}
              </Text>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={isLoading || isSaving || !canSave}
            style={[styles.saveButton, (isLoading || isSaving || !canSave) && styles.buttonDisabled]}
          >
            <Ionicons name="save-outline" size={16} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  scroll: {
    flex: 1,
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    minHeight: 72,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textDark,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
