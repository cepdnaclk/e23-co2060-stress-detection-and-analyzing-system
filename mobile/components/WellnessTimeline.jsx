/**
 * WellnessTimeline.jsx
 *
 * Self-contained "My Wellness Timeline" section.
 * Drop this component at the bottom of MyJourneyScreen's ScrollView.
 *
 * Props:
 *   token {string|null}  — JWT from useAuthStore
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { API_URL, fetchWithTimeout } from "../constants/api";
import { MOODS } from "../constants/moods";
import WTS from "../assets/styles/wellness_timeline.styles";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getMoodMeta = (moodKey) =>
  MOODS.find((m) => m.key === moodKey) ?? { emoji: "😶", label: moodKey };

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ") : "";

/** Format seconds → "mm:ss" */
const fmtSeconds = (secs) => {
  if (!secs && secs !== 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

/** Format a Date as "h:mm AM/PM" */
const fmtTime = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};

/**
 * Groups a flat array of activities into date-keyed buckets.
 * Returns [{label, items}] sorted newest-first.
 */
const groupByDate = (activities) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const buckets = new Map();

  for (const act of activities) {
    const d = new Date(act.createdAt);
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    let label;
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays < 7) label = `${diffDays} days ago`;
    else if (diffDays < 14) label = "Last week";
    else label = `${Math.round(diffDays / 7)} weeks ago`;

    const key = dayStart.getTime();
    if (!buckets.has(key)) buckets.set(key, { label, items: [], key });
    buckets.get(key).items.push(act);
  }

  return [...buckets.values()].sort((a, b) => b.key - a.key);
};

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed: {
    icon: "checkmark-circle",
    color: "#2e7d32",
    bg: "#e8f5e9",
    text: "Completed",
  },
  in_progress: {
    icon: "pause-circle",
    color: "#e65100",
    bg: "#fff3e0",
    text: "In Progress",
  },
  not_started: {
    icon: "time-outline",
    color: "#1976D2",
    bg: "#e3f2fd",
    text: "Not Started",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
  return (
    <View style={[WTS.statusBadge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={12} color={cfg.color} />
      <Text style={[WTS.statusBadgeText, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Today's Progress Card
// ─────────────────────────────────────────────────────────────────────────────

const PROGRESS_ITEMS = [
  { key: "assessment", emoji: "📝", label: "DASS-21 Assessment", bg: "#e3f2fd" },
  { key: "therapy", emoji: "🎧", label: "Therapy Session", bg: "#fce4ec" },
  { key: "mood", emoji: "😊", label: "Mood Tracker", bg: "#e8f5e9" },
  { key: "routine", emoji: "📅", label: "Daily Routine", bg: "#fff3e0" },
];

function TodaysProgressCard({ todaySummary }) {
  return (
    <View style={WTS.progressCard}>
      <Text style={WTS.progressCardTitle}>Today's Wellness Progress 🌱</Text>
      {PROGRESS_ITEMS.map((item) => {
        const status = todaySummary?.[item.key] ?? "not_started";
        return (
          <View key={item.key} style={WTS.progressRow}>
            <View style={WTS.progressRowLeft}>
              <View style={[WTS.progressIconBubble, { backgroundColor: item.bg }]}>
                <Text style={WTS.progressRowEmoji}>{item.emoji}</Text>
              </View>
              <Text style={WTS.progressRowLabel}>{item.label}</Text>
            </View>
            <StatusBadge status={status} />
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dot colour by status
// ─────────────────────────────────────────────────────────────────────────────

const dotColor = (status) => {
  if (status === "completed") return "#43a047";
  if (status === "in_progress") return "#fb8c00";
  return "#ef5350";
};

// ─────────────────────────────────────────────────────────────────────────────
// Individual Activity Card
// ─────────────────────────────────────────────────────────────────────────────

function ActivityCard({ item, onResume, isLast }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const cardStyle = [
    WTS.activityCard,
    item.status === "completed" && WTS.activityCardCompleted,
    item.status === "in_progress" && WTS.activityCardInProgress,
    item.status === "not_started" && WTS.activityCardWarning,
  ];

  const renderContent = () => {
    const { activityType, status, metadata, progress, title, createdAt } = item;

    if (activityType === "assessment") {
      if (status === "completed") {
        return (
          <>
            <Text style={WTS.activityTitle}>✅ {title}</Text>
            {metadata?.stressLevel ? (
              <Text style={WTS.activityMeta}>
                Stress Level:{" "}
                <Text style={WTS.activityMetaHighlight}>
                  {capitalize(metadata.stressLevel)}
                </Text>
              </Text>
            ) : null}
            <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
          </>
        );
      }
      if (status === "in_progress") {
        const answered = metadata?.answeredCount ?? 0;
        return (
          <>
            <Text style={WTS.activityTitle}>⏸ Assessment In Progress</Text>
            <Text style={WTS.activityMeta}>
              <Text style={WTS.activityMetaHighlight}>{answered}/21</Text> questions answered
            </Text>
            <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
            <Pressable style={WTS.resumeBtn} onPress={() => onResume("Questionnaire")}>
              <Ionicons name="arrow-forward-circle-outline" size={14} color="#1565c0" />
              <Text style={WTS.resumeBtnText}>Continue →</Text>
            </Pressable>
          </>
        );
      }
    }

    if (activityType === "therapy") {
      if (status === "completed") {
        const dur = metadata?.durationSeconds
          ? fmtSeconds(metadata.durationSeconds)
          : null;
        return (
          <>
            <Text style={WTS.activityTitle}>🎧 Completed: {title}</Text>
            {dur ? (
              <Text style={WTS.activityMeta}>
                Duration: <Text style={WTS.activityMetaHighlight}>{dur}</Text>
              </Text>
            ) : null}
            <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
          </>
        );
      }
      if (status === "in_progress") {
        const pct = progress ?? 0;
        const totalSec = metadata?.totalDurationSeconds;
        const playedSec = totalSec ? Math.round((pct / 100) * totalSec) : null;
        return (
          <>
            <Text style={WTS.activityTitle}>🎧 {title}</Text>
            <Text style={WTS.activityMeta}>
              {playedSec !== null
                ? `Stopped at ${fmtSeconds(playedSec)} / ${fmtSeconds(totalSec)}`
                : `${pct}% listened`}
            </Text>
            <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
            <Pressable style={WTS.resumeBtn} onPress={() => onResume("Therapy Hub")}>
              <Ionicons name="play-circle-outline" size={14} color="#1565c0" />
              <Text style={WTS.resumeBtnText}>Resume →</Text>
            </Pressable>
          </>
        );
      }
    }

    if (activityType === "mood") {
      const moodKey = metadata?.mood;
      const moodMeta = moodKey ? getMoodMeta(moodKey) : null;
      return (
        <>
          <Text style={WTS.activityTitle}>😊 {title}</Text>
          {moodMeta ? (
            <Text style={WTS.activityMeta}>
              Feeling:{" "}
              <Text style={WTS.activityMetaHighlight}>
                {moodMeta.emoji} {moodMeta.label}
              </Text>
            </Text>
          ) : null}
          <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
        </>
      );
    }

    if (activityType === "routine") {
      const blocks = metadata?.totalBlocks;
      return (
        <>
          <Text style={WTS.activityTitle}>📅 {title}</Text>
          {blocks ? (
            <Text style={WTS.activityMeta}>
              <Text style={WTS.activityMetaHighlight}>{blocks}</Text> activities scheduled
            </Text>
          ) : null}
          <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
        </>
      );
    }

    // Fallback
    return (
      <>
        <Text style={WTS.activityTitle}>{title}</Text>
        <Text style={WTS.activityTime}>{fmtTime(createdAt)}</Text>
      </>
    );
  };

  return (
    <Animated.View
      style={[
        WTS.timelineItem,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <View style={WTS.railWrap}>
        <View style={[WTS.railDot, { backgroundColor: dotColor(item.status) }]} />
        {!isLast && <View style={WTS.railLine} />}
      </View>
      <View style={cardStyle}>{renderContent()}</View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InactivityNudge
// ─────────────────────────────────────────────────────────────────────────────

function InactivityNudge({ days, onPress }) {
  const label =
    days === null
      ? "No DASS-21 assessment yet."
      : `It's been ${days} days since your last assessment.`;
  return (
    <View style={[WTS.activityCard, WTS.activityCardWarning, { marginBottom: 10 }]}>
      <Text style={WTS.activityTitle}>🌱 Time for a Check-in</Text>
      <Text style={WTS.activityMeta}>{label}</Text>
      <Text style={WTS.activityMeta}>
        Take a new assessment to monitor your progress — whenever you're ready.
      </Text>
      <Pressable style={WTS.resumeBtn} onPress={onPress}>
        <Ionicons name="clipboard-outline" size={14} color="#1565c0" />
        <Text style={WTS.resumeBtnText}>Take Assessment →</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main WellnessTimeline component
// ─────────────────────────────────────────────────────────────────────────────

export default function WellnessTimeline({ token }) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [daysSinceLastAssessment, setDaysSinceLastAssessment] = useState(null);

  const loadTimeline = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setActivities([]);
      setTodaySummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(`${API_URL}/activities/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (not JSON). Check your API connection.`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load timeline");
      }

      setActivities(Array.isArray(data.activities) ? data.activities : []);
      setTodaySummary(data.todaySummary ?? null);
      setDaysSinceLastAssessment(data.daysSinceLastAssessment ?? null);
    } catch (err) {
      setError(err.message || "Could not load your wellness timeline.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadTimeline();
    }, [loadTimeline])
  );

  const handleResume = (routeName) => {
    navigation.navigate(routeName);
  };

  const showInactivityNudge =
    daysSinceLastAssessment === null || daysSinceLastAssessment >= 7;

  const groups = groupByDate(activities);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={WTS.sectionWrapper}>
      {/* Section header */}
      <View>
        <View style={WTS.sectionHeadRow}>
          <Text style={WTS.sectionHeadEmoji}>🌿</Text>
          <Text style={WTS.sectionHeadTitle}>My Wellness Timeline</Text>
        </View>
        <Text style={WTS.sectionHeadSub}>
          A gentle record of everything you've done for your wellbeing.
        </Text>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={WTS.centeredBox}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={[WTS.centeredText, { marginTop: 12 }]}>
            Loading your journey...
          </Text>
        </View>
      ) : error ? (
        /* Error */
        <View style={WTS.centeredBox}>
          <Text style={WTS.centeredEmoji}>😔</Text>
          <Text style={WTS.centeredTitle}>Couldn't load timeline</Text>
          <Text style={WTS.centeredText}>{error}</Text>
          <Pressable style={WTS.startBtn} onPress={loadTimeline}>
            <Text style={WTS.startBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Today's Progress Card */}
          {todaySummary && <TodaysProgressCard todaySummary={todaySummary} />}

          {/* Activity Timeline */}
          <View style={WTS.timelineContainer}>
            <Text style={WTS.timelineSectionTitle}>Activity Timeline</Text>

            {/* Weekly inactivity nudge */}
            {showInactivityNudge && (
              <InactivityNudge
                days={daysSinceLastAssessment}
                onPress={() => handleResume("Questionnaire")}
              />
            )}

            {/* No activities */}
            {activities.length === 0 && !showInactivityNudge ? (
              <View style={[WTS.centeredBox, { borderWidth: 0, shadowOpacity: 0, elevation: 0, padding: 16 }]}>
                <Text style={WTS.centeredEmoji}>🌱</Text>
                <Text style={WTS.centeredTitle}>Your journey starts here</Text>
                <Text style={WTS.centeredText}>
                  Complete an assessment, log your mood, or try a Therapy Hub session to see your activities here.
                </Text>
                <Pressable
                  style={WTS.startBtn}
                  onPress={() => handleResume("Questionnaire")}
                >
                  <Text style={WTS.startBtnText}>Start my journey</Text>
                </Pressable>
              </View>
            ) : (
              /* Grouped timeline */
              groups.map((group) => (
                <View key={group.key} style={WTS.dateGroup}>
                  <Text style={WTS.dateGroupLabel}>{group.label}</Text>
                  {group.items.map((item, idx) => (
                    <ActivityCard
                      key={item._id}
                      item={item}
                      onResume={handleResume}
                      isLast={idx === group.items.length - 1}
                    />
                  ))}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </View>
  );
}
