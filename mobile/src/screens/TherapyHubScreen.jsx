/**
 * TherapyHubScreen.jsx
 *
 * Full Therapy Hub with:
 *  - Exercises fetched from GET /api/therapy-hub
 *  - Search / category filtering
 *  - expo-av audio player (play, pause, seek, stop)
 *  - Activity tracking via POST/PUT /api/activities
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import SafeScreen from "../../components/SafeScreen";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/therapy_hub.styles";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime = (millis) => {
  if (!millis && millis !== 0) return "0:00";
  const totalSec = Math.floor(millis / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Activity tracking helpers (fire-and-forget, non-blocking)
// ─────────────────────────────────────────────────────────────────────────────

async function trackActivityCreate(token, exercise) {
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        activityType: "therapy",
        title: exercise.title,
        status: "in_progress",
        progress: 0,
        metadata: { category: exercise.category },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.activity?._id ?? null;
  } catch {
    return null;
  }
}

async function trackActivityUpdate(token, activityId, status, progress, metadata) {
  if (!token || !activityId) return;
  try {
    await fetch(`${API_URL}/activities/${activityId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, progress, metadata }),
    });
  } catch {
    // Silently fail — don't disrupt UX
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ExerciseCard
// ─────────────────────────────────────────────────────────────────────────────

function ExerciseCard({ exercise, isActive, onPress }) {
  const hasThumb = !!exercise.thumbnail;
  return (
    <Pressable
      style={[styles.card, isActive && styles.activeCard]}
      onPress={onPress}
    >
      <View style={styles.cardImageContainer}>
        {hasThumb ? (
          <Image
            source={{ uri: exercise.thumbnail }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="musical-notes-outline" size={40} color="#90caf9" />
          </View>
        )}
        <View style={styles.playIconOverlay}>
          <Ionicons
            name={isActive ? "pause-circle" : "play-circle"}
            size={42}
            color="rgba(255,255,255,0.9)"
          />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {exercise.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {exercise.description}
        </Text>
        <View style={styles.badgesWrapper}>
          <View style={[styles.badge, { backgroundColor: "#e3f2fd" }]}>
            <Text style={[styles.badgeText, { color: "#1565c0" }]}>
              {exercise.category}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlayerBar
// ─────────────────────────────────────────────────────────────────────────────

function PlayerBar({ exercise, soundStatus, onPlayPause, onStop }) {
  const position = soundStatus?.positionMillis ?? 0;
  const duration = soundStatus?.durationMillis ?? 1;
  const progress = Math.min(position / duration, 1);
  const isPlaying = soundStatus?.isPlaying ?? false;

  const hasThumb = !!exercise?.thumbnail;

  return (
    <View style={styles.playerBar}>
      {/* Slim progress track */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.playerContent}>
        {hasThumb ? (
          <Image
            source={{ uri: exercise.thumbnail }}
            style={styles.playerThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.playerThumbnailPlaceholder}>
            <Ionicons name="musical-notes-outline" size={20} color="#90caf9" />
          </View>
        )}

        <View style={styles.playerInfo}>
          <Text style={styles.playerTitle} numberOfLines={1}>
            {exercise?.title ?? ""}
          </Text>
          <Text style={styles.playerCategory}>
            {fmtTime(position)} / {fmtTime(duration)}
          </Text>
        </View>

        <View style={styles.playerControls}>
          <Pressable style={styles.playerControlBtn} onPress={onPlayPause}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={22}
              color="#1976D2"
            />
          </Pressable>
          <Pressable style={styles.playerControlBtn} onPress={onStop}>
            <Ionicons name="stop" size={20} color="#78909c" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TherapyHubScreen
// ─────────────────────────────────────────────────────────────────────────────

export default function TherapyHubScreen() {
  const { token } = useAuthStore();

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [search, setSearch] = useState("");

  // Audio state
  const soundRef = useRef(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [soundStatus, setSoundStatus] = useState(null);

  // Activity tracking
  const activityIdRef = useRef(null);

  // ── Fetch exercises ─────────────────────────────────────────────────────────

  const loadExercises = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setErrorMsg("Please sign in to access the Therapy Hub.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithTimeout(`${API_URL}/therapy-hub`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load exercises");

      const list = Array.isArray(data) ? data : (data.exercises ?? []);
      setExercises(list);
    } catch (err) {
      setErrorMsg(err.message || "Could not load exercises. Try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
      return () => {
        // Pause (don't stop) when navigating away so progress is preserved
        soundRef.current?.pauseAsync?.().catch(() => {});
      };
    }, [loadExercises])
  );

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync?.().catch(() => {});
    };
  }, []);

  // ── Audio controls ──────────────────────────────────────────────────────────

  const stopAndUnload = useCallback(async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync().catch(() => null);
      if (status?.isLoaded) {
        const pos = status.positionMillis ?? 0;
        const dur = status.durationMillis ?? 1;
        const pct = Math.round((pos / dur) * 100);

        // Save paused state
        if (activityIdRef.current) {
          await trackActivityUpdate(token, activityIdRef.current, "in_progress", pct, {
            totalDurationSeconds: Math.round(dur / 1000),
          });
        }

        await soundRef.current.unloadAsync().catch(() => {});
      }
    }
    soundRef.current = null;
    setSoundStatus(null);
    setActiveExercise(null);
    activityIdRef.current = null;
  }, [token]);

  const handleSelectExercise = useCallback(
    async (exercise) => {
      // If tapping the currently active exercise → toggle play/pause
      if (activeExercise?._id === exercise._id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync().catch(() => null);
        if (status?.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync().catch(() => {});
            // Update activity to paused state
            const pos = status.positionMillis ?? 0;
            const dur = status.durationMillis ?? 1;
            const pct = Math.round((pos / dur) * 100);
            if (activityIdRef.current) {
              await trackActivityUpdate(token, activityIdRef.current, "in_progress", pct, {
                totalDurationSeconds: Math.round(dur / 1000),
              });
            }
          } else {
            await soundRef.current.playAsync().catch(() => {});
          }
        }
        return;
      }

      // Stop any current audio
      await stopAndUnload();

      // Build audio URL
      const base = API_URL.replace("/api", "");
      const audioUri = exercise.audioUrl.startsWith("http")
        ? exercise.audioUrl
        : `${base}${exercise.audioUrl}`;

      setActiveExercise(exercise);

      // Create activity record immediately (fire-and-forget)
      trackActivityCreate(token, exercise).then((id) => {
        activityIdRef.current = id;
      });

      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          (status) => {
            setSoundStatus(status);

            // Finished playing
            if (status?.didJustFinish) {
              const dur = status.durationMillis ?? 0;
              trackActivityUpdate(token, activityIdRef.current, "completed", 100, {
                durationSeconds: Math.round(dur / 1000),
                totalDurationSeconds: Math.round(dur / 1000),
              });
              soundRef.current?.unloadAsync().catch(() => {});
              soundRef.current = null;
              setSoundStatus(null);
              setActiveExercise(null);
              activityIdRef.current = null;
            }
          }
        );

        soundRef.current = sound;
      } catch {
        setActiveExercise(null);
        activityIdRef.current = null;
      }
    },
    [activeExercise, stopAndUnload, token]
  );

  const handlePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync().catch(() => null);
    if (!status?.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync().catch(() => {});
      const pos = status.positionMillis ?? 0;
      const dur = status.durationMillis ?? 1;
      const pct = Math.round((pos / dur) * 100);
      if (activityIdRef.current) {
        trackActivityUpdate(token, activityIdRef.current, "in_progress", pct, {
          totalDurationSeconds: Math.round(dur / 1000),
        });
      }
    } else {
      await soundRef.current.playAsync().catch(() => {});
    }
  }, [token]);

  const handleStop = useCallback(async () => {
    await stopAndUnload();
  }, [stopAndUnload]);

  // ── Filtering ───────────────────────────────────────────────────────────────

  const categories = [...new Set(exercises.map((e) => e.category))];

  const filtered = exercises.filter(
    (e) =>
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = categories.reduce((acc, cat) => {
    const items = filtered.filter((e) => e.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading Therapy Hub…</Text>
        </View>
      </SafeScreen>
    );
  }

  if (errorMsg) {
    return (
      <SafeScreen>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={40} color="#ef9a9a" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Pressable onPress={loadExercises} style={{ marginTop: 8 }}>
            <Text style={{ color: "#1976D2", fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            activeExercise && { paddingBottom: 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Therapy Hub 🎧</Text>
            <Text style={styles.headerSubtitle}>
              Audio sessions to calm your mind, ease anxiety, and restore balance.
            </Text>
            {/* Search */}
            <View style={styles.searchBarContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#78909c"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises…"
                placeholderTextColor="#9e9e9e"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearch("")}
                >
                  <Ionicons name="close-circle" size={18} color="#78909c" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* No results */}
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={36} color="#90caf9" />
              <Text style={styles.noResultsText}>No exercises found</Text>
              <Pressable
                style={styles.clearSearchBtn}
                onPress={() => setSearch("")}
              >
                <Text style={styles.clearSearchBtnText}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <View key={cat} style={styles.section}>
                <Text style={styles.sectionTitle}>{cat}</Text>
                <FlatList
                  horizontal
                  data={items}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <ExerciseCard
                      exercise={item}
                      isActive={activeExercise?._id === item._id}
                      onPress={() => handleSelectExercise(item)}
                    />
                  )}
                  contentContainerStyle={styles.horizontalScrollContent}
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ))
          )}
        </ScrollView>

        {/* Floating player bar */}
        {activeExercise && soundStatus && (
          <PlayerBar
            exercise={activeExercise}
            soundStatus={soundStatus}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
          />
        )}
      </View>
    </SafeScreen>
  );
}