import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import SafeScreen from "../../components/SafeScreen";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { DEFAULT_MOOD, MOODS } from "../../constants/moods";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/myjourney.styles";

const CHART_HEIGHT = 240;
const CHART_PADDING = {
  top: 18,
  right: 18,
  bottom: 44,
  left: 42,
};
const MAX_STRESS_SCORE = 42;
const Y_AXIS_TICKS = [0, 10, 20, 30, 40];
const MOOD_CHART_HEIGHT = 300;
const MOOD_CHART_PADDING = {
  top: 22,
  right: 20,
  bottom: 52,
  left: 98,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatChartLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month}\n${hours}:${minutes}`;
};

const formatDisplayDate = (value) => {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = WEEKDAYS[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  return `${weekday}, ${day} ${month}`;
};

const getMoodMeta = (moodKey) => {
  return MOODS.find((item) => item.key === moodKey) ?? DEFAULT_MOOD;
};

const getShortDateLabel = (value) => {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  return `${day} ${month}`;
};

const createSmoothPath = (points) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const point0 = points[index - 1] ?? points[index];
    const point1 = points[index];
    const point2 = points[index + 1];
    const point3 = points[index + 2] ?? point2;

    const controlPoint1X = point1.x + (point2.x - point0.x) / 6;
    const controlPoint1Y = point1.y + (point2.y - point0.y) / 6;
    const controlPoint2X = point2.x - (point3.x - point1.x) / 6;
    const controlPoint2Y = point2.y - (point3.y - point1.y) / 6;

    path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${point2.x} ${point2.y}`;
  }

  return path;
};

function JourneyChart({ data, width }) {
  const innerWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 220);
  const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const chartPoints = data.map((item, index) => {
    const x =
      CHART_PADDING.left +
      (data.length === 1 ? innerWidth / 2 : (innerWidth / Math.max(data.length - 1, 1)) * index);
    const value = Number(item.stressScore ?? 0);
    const normalizedValue = Math.max(0, Math.min(MAX_STRESS_SCORE, value));
    const y =
      CHART_PADDING.top +
      innerHeight - (normalizedValue / MAX_STRESS_SCORE) * innerHeight;

    return {
      ...item,
      x,
      y,
      value: normalizedValue,
    };
  });

  const linePath = createSmoothPath(chartPoints);
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${CHART_PADDING.top + innerHeight} L ${chartPoints[0].x} ${CHART_PADDING.top + innerHeight} Z`
    : "";

  return (
    <Svg width={width} height={CHART_HEIGHT} style={styles.chartSvg}>
      <Defs>
        <LinearGradient id="journeyArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#8fb5ff" stopOpacity="0.28" />
          <Stop offset="100%" stopColor="#8fb5ff" stopOpacity="0.04" />
        </LinearGradient>
        <LinearGradient id="journeyLine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#1976D2" />
          <Stop offset="100%" stopColor="#5b9ff5" />
        </LinearGradient>
      </Defs>

      {Y_AXIS_TICKS.map((tick) => {
        const y = CHART_PADDING.top + innerHeight - (tick / MAX_STRESS_SCORE) * innerHeight;

        return (
          <React.Fragment key={tick}>
            <Line
              x1={CHART_PADDING.left}
              y1={y}
              x2={width - CHART_PADDING.right}
              y2={y}
              stroke="#dbe9f7"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <SvgText x={10} y={y + 4} fontSize="11" fill="#5d7994" fontWeight="700">
              {tick}
            </SvgText>
          </React.Fragment>
        );
      })}

      {areaPath ? <Path d={areaPath} fill="url(#journeyArea)" /> : null}
      {linePath ? <Path d={linePath} fill="none" stroke="url(#journeyLine)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}

      {chartPoints.map((point, index) => (
        <React.Fragment key={`${point.recordedAt}-${index}`}>
          <Circle cx={point.x} cy={point.y} r={6} fill="#ffffff" stroke="#1976D2" strokeWidth={4} />
          <Circle cx={point.x} cy={point.y} r={2.6} fill="#1976D2" />
          <SvgText
            x={point.x}
            y={CHART_HEIGHT - 18}
            fontSize="11"
            fill="#5d7994"
            textAnchor="middle"
          >
            {formatChartLabel(point.recordedAt)}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

function MoodTimelineGraph({ data, width }) {
  const innerWidth = Math.max(width - MOOD_CHART_PADDING.left - MOOD_CHART_PADDING.right, 220);
  const innerHeight = MOOD_CHART_HEIGHT - MOOD_CHART_PADDING.top - MOOD_CHART_PADDING.bottom;

  const moodLevels = MOODS.map((mood) => mood.key);
  const moodLabelByKey = Object.fromEntries(MOODS.map((mood) => [mood.key, mood.label]));
  const moodEmojiByKey = Object.fromEntries(MOODS.map((mood) => [mood.key, mood.emoji]));
  const pointCount = Math.max(data.length, 1);

  const points = data.map((item, index) => {
    const x =
      MOOD_CHART_PADDING.left +
      (pointCount === 1 ? innerWidth / 2 : (innerWidth / Math.max(pointCount - 1, 1)) * index);
    const moodIndex = moodLevels.indexOf(item.mood);
    const hasMood = moodIndex >= 0;
    const y = hasMood
      ? MOOD_CHART_PADDING.top + (innerHeight / Math.max(moodLevels.length - 1, 1)) * moodIndex
      : null;

    return {
      ...item,
      x,
      y,
      hasMood,
    };
  });

  const lineSegments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    if (currentPoint.hasMood && nextPoint.hasMood) {
      lineSegments.push({
        x1: currentPoint.x,
        y1: currentPoint.y,
        x2: nextPoint.x,
        y2: nextPoint.y,
        key: `${currentPoint.date}-${nextPoint.date}`,
      });
    }
  }

  return (
    <Svg width={width} height={MOOD_CHART_HEIGHT} style={styles.chartSvg}>
      {moodLevels.map((moodKey, moodIndex) => {
        const y = MOOD_CHART_PADDING.top + (innerHeight / Math.max(moodLevels.length - 1, 1)) * moodIndex;
        const moodLabel = moodLabelByKey[moodKey] || moodKey;
        const moodEmoji = moodEmojiByKey[moodKey] || "";

        return (
          <React.Fragment key={moodKey}>
            <Line
              x1={MOOD_CHART_PADDING.left}
              y1={y}
              x2={width - MOOD_CHART_PADDING.right}
              y2={y}
              stroke="#dbe9f7"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <SvgText
              x={MOOD_CHART_PADDING.left - 10}
              y={y + 4}
              fontSize="11"
              fill="#5d7994"
              fontWeight="700"
              textAnchor="end"
            >
              {`${moodEmoji} ${moodLabel}`}
            </SvgText>
          </React.Fragment>
        );
      })}

      {lineSegments.map((segment) => (
        <Line
          key={segment.key}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke="#1976D2"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}

      {points.map((point) => (
        <React.Fragment key={point.date}>
          {point.hasMood ? (
            <>
              <Circle cx={point.x} cy={point.y} r={5.5} fill="#ffffff" stroke="#1976D2" strokeWidth={3} />
              <Circle cx={point.x} cy={point.y} r={2.2} fill="#1976D2" />
              <SvgText
                x={point.x}
                y={point.y - 10}
                fontSize="12"
                textAnchor="middle"
              >
                {getMoodMeta(point.mood).emoji}
              </SvgText>
            </>
          ) : (
            <Circle
              cx={point.x}
              cy={MOOD_CHART_PADDING.top + innerHeight + 2}
              r={4}
              fill="#ffffff"
              stroke="#c5d9ee"
              strokeWidth={2}
            />
          )}
          <SvgText
            x={point.x}
            y={MOOD_CHART_HEIGHT - 16}
            fontSize="11"
            fill="#5d7994"
            textAnchor="middle"
          >
            {getShortDateLabel(point.date)}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

export default function MyJourneyScreen() {
  const token = useAuthStore((state) => state.token);
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionnaireHistory, setQuestionnaireHistory] = useState([]);
  const [moodTimeline, setMoodTimeline] = useState([]);

  const loadJourneyData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Please sign in to view your journey.");
      setQuestionnaireHistory([]);
      setMoodTimeline([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(`${API_URL}/journey/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load journey data");
      }

      setQuestionnaireHistory(Array.isArray(data.questionnaireHistory) ? data.questionnaireHistory : []);
      setMoodTimeline(Array.isArray(data.moodTimeline) ? data.moodTimeline : []);
    } catch (fetchError) {
      setError(fetchError.message || "Could not load journey data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadJourneyData();
    }, [loadJourneyData])
  );

  const chartData = useMemo(() => {
    return questionnaireHistory.map((item) => ({
      stressScore: item.stressScore,
      recordedAt: item.recordedAt || item.createdAt,
    }));
  }, [questionnaireHistory]);

  const visibleChartData = useMemo(() => {
    return chartData.slice(-15);
  }, [chartData]);

  const chartWidth = Math.max(width - 36, Math.max(visibleChartData.length, 1) * 88);
  const latestAttempt = visibleChartData.length > 0 ? visibleChartData[visibleChartData.length - 1] : null;
  const moodTimelineSorted = useMemo(() => {
    return [...moodTimeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [moodTimeline]);
  const moodChartWidth = Math.max(width - 36, Math.max(moodTimelineSorted.length, 1) * 76);
  const moodPointsCount = moodTimelineSorted.filter((item) => MOODS.some((mood) => mood.key === item.mood)).length;

  return (
    <SafeScreen variant="questionnaire">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Journey overview</Text>
          <Text style={styles.subtitle}>
            Track how your stress has changed over time and review the mood you logged across the last 7 days.
          </Text>
        </View>

        {loading ? (
          <View style={styles.section}>
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#1976D2" />
              <Text style={styles.loadingText}>Loading your journey...</Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Could not load journey</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stress Score Curve</Text>
              </View>

              <View style={styles.chartWrap}>
                {chartData.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                    <View style={styles.chartInner}>
                      <JourneyChart data={visibleChartData} width={chartWidth} />
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.chartEmpty}>
                    <Ionicons name="analytics-outline" size={28} color="#1976D2" />
                    <Text style={styles.chartEmptyTitle}>No questionnaire attempts yet</Text>
                    <Text style={styles.chartEmptyText}>
                      Complete a questionnaire and your stress score curve will appear here.
                    </Text>
                  </View>
                )}
              </View>

              {latestAttempt ? (
                <Text style={styles.sectionHint}>
                  Latest attempt: {formatDisplayDate(latestAttempt.recordedAt)} with a stress score of {latestAttempt.stressScore}.
                </Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mood timeline</Text>
                <Text style={styles.sectionHint}>Past 7 days</Text>
              </View>

              <View style={styles.chartWrap}>
                {moodTimelineSorted.length > 0 && moodPointsCount > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                    <View style={styles.chartInner}>
                      <MoodTimelineGraph data={moodTimelineSorted} width={moodChartWidth} />
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.chartEmpty}>
                    <Ionicons name="pulse-outline" size={28} color="#1976D2" />
                    <Text style={styles.chartEmptyTitle}>No mood entries yet</Text>
                    <Text style={styles.chartEmptyText}>
                      Log your mood daily to view your timeline graph from Ecstatic to Angry.
                    </Text>
                  </View>
                )}
              </View>

            </View>
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}
