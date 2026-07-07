import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import COLORS from "../constants/colors";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";

const MOODS = [
  { key: "ecstatic", label: "Ecstatic", emoji: "🤩", tint: "#ffd24d" },
  { key: "happy", label: "Happy", emoji: "😊", tint: "#ffc96b" },
  { key: "calm", label: "Calm", emoji: "😌", tint: "#8dd3c7" },
  { key: "neutral", label: "Okay", emoji: "🙂", tint: "#8fb5ff" },
  { key: "tired", label: "Tired", emoji: "🥱", tint: "#c5b8ff" },
  { key: "stressed", label: "Stressed", emoji: "😣", tint: "#ffb96b" },
  { key: "sad", label: "Sad", emoji: "😔", tint: "#8ab4f8" },
  { key: "angry", label: "Angry", emoji: "😡", tint: "#ff8e8e" },
];

export default function MoodTrackerPopup({ user }) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const storageKey = useMemo(() => {
    const userKey = user?.id ?? user?.username ?? "guest";
    return `mood-tracker:last-seen:${userKey}`;
  }, [user?.id, user?.username]);

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    let mounted = true;

    async function checkShouldShow() {
      setReady(false);
      setVisible(false);
      setSelectedMood(null);

      try {
        const lastSeen = await AsyncStorage.getItem(storageKey);
        const todayKey = getTodayKey();

        if (mounted && lastSeen !== todayKey) {
          setVisible(true);
        }
      } catch {
        if (mounted) setVisible(true);
      } finally {
        if (mounted) setReady(true);
      }
    }

    if (user) {
      checkShouldShow();
    } else {
      setReady(true);
      setVisible(false);
    }

    return () => {
      mounted = false;
    };
  }, [storageKey, user]);

  const persistToday = async () => {
    try {
      await AsyncStorage.setItem(storageKey, getTodayKey());
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    try {
      const token = useAuthStore.getState().token;

      if (token && selectedMood) {
        await fetch(`${API_URL}/mood-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mood: selectedMood, date: getTodayKey() }),
        });
      }
    } finally {
      await persistToday();
      setVisible(false);
    }
  };

  const handleDismiss = async () => {
    await persistToday();
    setVisible(false);
  };

  const selectedMoodData = MOODS.find((mood) => mood.key === selectedMood) ?? null;

  if (!ready || !user) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="happy-outline" size={24} color={COLORS.primary} />
              </View>
              <Pressable onPress={handleDismiss} hitSlop={10} accessibilityRole="button">
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.title}>Mood check-in</Text>
            <Text style={styles.subtitle}>
              How are you feeling today? Pick the emoji that matches your real mood.
            </Text>

            <View style={styles.emojiGrid}>
              {MOODS.map((mood) => {
                const isSelected = mood.key === selectedMood;

                return (
                  <Pressable
                    key={mood.key}
                    onPress={() => setSelectedMood(mood.key)}
                    style={({ pressed }) => [
                      styles.emojiCard,
                      { borderColor: mood.tint },
                      isSelected && styles.emojiCardSelected,
                      pressed && styles.emojiCardPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={mood.label}
                  >
                    <Text style={styles.emoji}>{mood.emoji}</Text>
                    <Text style={styles.emojiLabel}>{mood.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedMoodData ? (
              <View style={styles.selectionBanner}>
                <Text style={styles.selectionBannerEmoji}>{selectedMoodData.emoji}</Text>
                <Text style={styles.selectionBannerText}>
                  You chose {selectedMoodData.label.toLowerCase()} today.
                </Text>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                onPress={handleSubmit}
                disabled={!selectedMood}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryButton,
                  !selectedMood && styles.primaryButtonDisabled,
                  pressed && selectedMood && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Save mood</Text>
              </Pressable>
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
    justifyContent: "center",
    padding: 20,
  },
  keyboardAvoidingView: {
    width: "100%",
  },
  card: {
    borderRadius: 28,
    backgroundColor: COLORS.white,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eaf4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "System",
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    textShadowColor: "rgba(25, 118, 210, 0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 18,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  emojiCard: {
    width: "23%",
    minWidth: 74,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "#f8fbff",
  },
  emojiCardSelected: {
    backgroundColor: "#eaf4ff",
    transform: [{ scale: 1.03 }],
    borderWidth: 2,
  },
  emojiCardPressed: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  emojiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
  },
  selectionBanner: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#f2f8ff",
    borderWidth: 1,
    borderColor: "#d8e9fb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectionBannerEmoji: {
    fontSize: 22,
  },
  selectionBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: "row",
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#edf4fb",
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});