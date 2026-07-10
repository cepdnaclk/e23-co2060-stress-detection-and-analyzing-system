import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";
import questionnaireBanner from "../../assets/images/questionnaire-banner.png";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

function getSeverityTheme(rawSeverity) {
  const level = (rawSeverity || "").toLowerCase();

  if (level === "extremely_severe" || level === "extremely severe") {
    // Map to the same visual style as "severe" to keep theme consistent.
    return {
      bubbleBg: "#ffe2e2",
      bubbleBorder: "#eb8f8f",
      bubbleText: "#8a1f1f",
      pillBg: "#ffeceb",
      pillBorder: "#f1aaaa",
      pillText: "#8a1f1f",
      accent: "#d64545",
    };
  }

  if (level === "normal") {
    return {
      bubbleBg: "#dff8e6",
      bubbleBorder: "#78d39a",
      bubbleText: "#176a38",
      pillBg: "#e8faef",
      pillBorder: "#9bdeb4",
      pillText: "#176a38",
      accent: "#34a853",
    };
  }

  if (level === "mild") {
    return {
      bubbleBg: "#fff7dc",
      bubbleBorder: "#eec969",
      bubbleText: "#7a5a05",
      pillBg: "#fff9e8",
      pillBorder: "#f0d58d",
      pillText: "#7a5a05",
      accent: "#d89c16",
    };
  }

  if (level === "moderate") {
    return {
      bubbleBg: "#ffe8cf",
      bubbleBorder: "#f0aa66",
      bubbleText: "#8c4304",
      pillBg: "#fff0e1",
      pillBorder: "#efba86",
      pillText: "#8c4304",
      accent: "#e07a2f",
    };
  }

  if (level === "severe") {
    return {
      bubbleBg: "#ffe2e2",
      bubbleBorder: "#eb8f8f",
      bubbleText: "#8a1f1f",
      pillBg: "#ffeceb",
      pillBorder: "#f1aaaa",
      pillText: "#8a1f1f",
      accent: "#d64545",
    };
  }

  return {
    bubbleBg: "#e4f2ff",
    bubbleBorder: "#90c1f3",
    bubbleText: "#0f4069",
    pillBg: "#e7f3ff",
    pillBorder: "#b8d9fb",
    pillText: "#235684",
    accent: "#1976D2",
  };
}

function formatSeverityLabel(rawSeverity) {
  const value = String(rawSeverity || "").trim();
  if (!value) return "";
  const spaced = value.replace(/_/g, " ");
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function QuestionnaireScreen() {
  const navigation = useNavigation();
  const token = useAuthStore((state) => state.token);

  const [questions, setQuestions] = useState(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [questionsLoadError, setQuestionsLoadError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showIntro, setShowIntro] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [stressScore, setStressScore] = useState(null);
  const [stressSeverity, setStressSeverity] = useState(null);
  const [anxietyScore, setAnxietyScore] = useState(null);
  const [anxietySeverity, setAnxietySeverity] = useState(null);
  const [depressionScore, setDepressionScore] = useState(null);
  const [depressionSeverity, setDepressionSeverity] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const instructionsOpacity = useRef(new Animated.Value(0)).current;
  const instructionsLift = useRef(new Animated.Value(26)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;
  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionLift = useRef(new Animated.Value(0)).current;
  const questionScrollRef = useRef(null);
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsLift = useRef(new Animated.Value(24)).current;
  const scoreScale = useRef(new Animated.Value(0.9)).current;
  const scoreGlow = useRef(new Animated.Value(0.35)).current;
  const scoreStarFloat = useRef(new Animated.Value(0)).current;
  const scoreStarPulse = useRef(new Animated.Value(0.55)).current;
  const pulseLoopRef = useRef(null);
  const scoreLoopRef = useRef(null);

  const loadQuestions = useCallback(async () => {
    setIsQuestionsLoading(true);
    setQuestionsLoadError(null);

    try {
      const response = await fetchWithTimeout(`${API_URL}/questionnaire/questions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load questionnaire");
      }

      if (!Array.isArray(data.questions) || data.questions.length !== 21) {
        throw new Error("Invalid questionnaire data");
      }

      const normalized = data.questions
        .map((q) => ({ id: Number(q.id), text: String(q.text ?? "") }))
        .sort((a, b) => a.id - b.id);

      for (let i = 1; i <= 21; i++) {
        if (normalized[i - 1]?.id !== i) {
          throw new Error("Invalid questionnaire data");
        }
      }

      setQuestions(normalized);
      setCurrentIndex(0);
      setAnswers({});
    } catch (error) {
      setQuestions(null);
      setQuestionsLoadError(error.message || "Could not load questionnaire");
    } finally {
      setIsQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  /**
   * When the user leaves the questionnaire screen mid-session (without completing),
   * save an in_progress activity so the timeline shows the partial attempt.
   * The cleanup fn runs when the screen loses focus.
   */
  useFocusEffect(
    useCallback(() => {
      return () => {
        const answeredCount = Object.keys(answers).length;
        // Only save if they started (answered at least 1 Q) but haven’t finished
        if (!token || answeredCount === 0 || showResults) return;

        fetch(`${API_URL}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activityType: "assessment",
            title: "DASS-21 Assessment",
            status: "in_progress",
            progress: Math.round((answeredCount / 21) * 100),
            metadata: { answeredCount, lastIndex: currentIndex },
          }),
        }).catch(() => {
          // Silently ignore network errors on cleanup
        });
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, answers, currentIndex, showResults])
  );

  useEffect(() => {
    if (!showInstructions) return;

    instructionsOpacity.setValue(0);
    instructionsLift.setValue(26);

    Animated.parallel([
      Animated.timing(instructionsOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(instructionsLift, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulse, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(alertPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoopRef.current.start();

    return () => {
      pulseLoopRef.current?.stop();
    };
  }, [showInstructions, instructionsLift, instructionsOpacity, alertPulse]);

  useEffect(() => {
    if (showIntro || showInstructions || showResults) return;

    questionScrollRef.current?.scrollTo?.({ y: 0, animated: false });

    questionOpacity.setValue(0);
    questionLift.setValue(18);

    Animated.parallel([
      Animated.timing(questionOpacity, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(questionLift, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, showIntro, showInstructions, showResults, questionOpacity, questionLift]);

  useEffect(() => {
    if (!showResults) return;

    resultsOpacity.setValue(0);
    resultsLift.setValue(24);
    scoreScale.setValue(0.9);
    scoreGlow.setValue(0.35);
    scoreStarFloat.setValue(0);
    scoreStarPulse.setValue(0.55);

    Animated.parallel([
      Animated.timing(resultsOpacity, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(resultsLift, {
        toValue: 0,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scoreScale, {
        toValue: 1,
        friction: 6,
        tension: 75,
        useNativeDriver: true,
      }),
    ]).start();

    scoreLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scoreGlow, {
            toValue: 0.95,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scoreStarFloat, {
            toValue: -5,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scoreStarPulse, {
            toValue: 1,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scoreGlow, {
            toValue: 0.35,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scoreStarFloat, {
            toValue: 3,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scoreStarPulse, {
            toValue: 0.55,
            duration: 950,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    scoreLoopRef.current.start();

    return () => {
      scoreLoopRef.current?.stop();
    };
  }, [
    showResults,
    resultsOpacity,
    resultsLift,
    scoreScale,
    scoreGlow,
    scoreStarFloat,
    scoreStarPulse,
  ]);

  const questionCount = questions?.length ?? 0;
  const currentQuestion = questions?.[currentIndex];
  const isLastQuestion = questionCount > 0 && currentIndex === questionCount - 1;
  const selectedValue = answers[currentQuestion?.id];
  const stressTheme = useMemo(
    () => getSeverityTheme(stressSeverity || severity),
    [stressSeverity, severity]
  );
  const anxietyTheme = useMemo(() => getSeverityTheme(anxietySeverity), [anxietySeverity]);
  const depressionTheme = useMemo(
    () => getSeverityTheme(depressionSeverity),
    [depressionSeverity]
  );
  const recommendation = useMemo(() => {
    const level = (stressSeverity || "").toLowerCase();

    if (level === "normal") {
      return {
        routeName: "Routine Generator",
        label: "Go to Routine Generator",
        icon: "calendar-clear-outline",
      };
    }

    if (level === "mild") {
      return {
        routeName: "Therapy Hub",
        label: "Go to Therapy Hub",
        icon: "sparkles-outline",
      };
    }

    if (level === "moderate" || level === "severe" || level === "extremely_severe") {
      return {
        routeName: "Clinical Locator",
        label: "Go to Clinical Locator",
        icon: "location-outline",
      };
    }

    return null;
  }, [stressSeverity]);

  const handleSelect = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (selectedValue === undefined) return;

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!questions || questions.length !== 21) {
      Alert.alert("Unavailable", "Questionnaire could not be loaded. Please try again.");
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      Alert.alert("Incomplete", "Please answer all questions before finishing.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/questionnaire/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to calculate score");
      }

      setTotalScore(data.totalScore);
      setSeverity(data.severity || null);
      setStressScore(Number.isFinite(Number(data.stressScore)) ? Number(data.stressScore) : null);
      setStressSeverity(data.stressSeverity || null);
      setAnxietyScore(Number.isFinite(Number(data.anxietyScore)) ? Number(data.anxietyScore) : null);
      setAnxietySeverity(data.anxietySeverity || null);
      setDepressionScore(
        Number.isFinite(Number(data.depressionScore)) ? Number(data.depressionScore) : null
      );
      setDepressionSeverity(data.depressionSeverity || null);
      setShowResults(true);
    } catch (error) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View pointerEvents="none" style={styles.questionBackdrop}>
          <View style={styles.backdropLayerA} />
          <View style={styles.backdropLayerB} />
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobPink]} />
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobTeal]} />
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobGold]} />
          <View style={[styles.backdropSpark, styles.backdropSparkOne]} />
          <View style={[styles.backdropSpark, styles.backdropSparkTwo]} />
          <View style={[styles.backdropSpark, styles.backdropSparkThree]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleTopRight]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleTopLeft]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleUpperMid]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleBottomLeft]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleBottomRight]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleCenter]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleLowerMid]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleTinyTop]} />
          <View style={[styles.backdropBubble, styles.backdropBubbleTinyBottom]} />
        </View>

        {showIntro ? (
          <Pressable
            style={styles.introContainer}
            onPress={() => {
              setShowIntro(false);
              setShowInstructions(true);
            }}
          >
            <View style={styles.introCard}>
              <View style={styles.introBadge}>
                <Ionicons name="sparkles" size={14} color="#0f538f" />
                <Text style={styles.introBadgeText}>Mental wellness check-in</Text>
              </View>

              <Text style={styles.introSubtitle}>
                A quick, private self-check to understand how {"you've"} been feeling lately.
              </Text>

              <View style={styles.introStatsRow}>
                <View style={styles.introStatPill}>
                  <Ionicons name="document-text-outline" size={14} color="#0f538f" />
                  <Text style={styles.introStatText}>21 items</Text>
                </View>
                <View style={styles.introStatPill}>
                  <Ionicons name="time-outline" size={14} color="#0f538f" />
                  <Text style={styles.introStatText}>About 5 min</Text>
                </View>
                <View style={styles.introStatPill}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#0f538f" />
                  <Text style={styles.introStatText}>Private</Text>
                </View>
              </View>

              <View style={styles.introBannerShell}>
                <Image source={questionnaireBanner} style={styles.introImage} resizeMode="contain" />
              </View>

              <Text style={styles.introFooterText}>Tap through when {"you're"} ready to begin.</Text>
            </View>
          </Pressable>
        ) : showInstructions ? (
          <View style={styles.instructionsContainer}>
            <Animated.View
              style={[
                styles.instructionsCard,
                {
                  opacity: instructionsOpacity,
                  transform: [{ translateY: instructionsLift }],
                },
              ]}
            >
              <View style={styles.instructionsHeaderRow}>
                <Animated.View
                  style={[
                    styles.alertBadge,
                    {
                      transform: [{ scale: alertPulse }],
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={24} color="#ffffff" />
                </Animated.View>
                <Text style={styles.instructionsHeading}>Before You Start</Text>
              </View>

              <View style={styles.infoPill}>
                <Ionicons name="document-text-outline" size={16} color="#0f538f" />
                <Text style={styles.infoPillText}>21 short statements</Text>
              </View>

              <Text style={styles.instructionsText}>
                For each statement, choose how much it applied to you over the past week.
              </Text>
              <Text style={styles.instructionsText}>
                No right or wrong answers. Just answer quickly and honestly.
              </Text>
            </Animated.View>

            <Animated.View
              style={{
                opacity: instructionsOpacity,
                transform: [{ translateY: instructionsLift }],
              }}
            >
              <Pressable style={styles.startButton} onPress={() => setShowInstructions(false)}>
                <Ionicons name="play" size={16} color="#ffffff" />
                <Text style={styles.startButtonText}>Start Questionnaire</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : showResults ? (
          <ScrollView
            style={{ flex: 1, width: "100%" }}
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 22,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.resultsCard,
                {
                  opacity: resultsOpacity,
                  transform: [{ translateY: resultsLift }],
                },
              ]}
            >
              <View style={styles.resultsHeaderRow}>
                <Ionicons name="sparkles" size={20} color="#0f538f" />
                <Text style={styles.resultsHeading}>Your Results</Text>
              </View>

              <Text style={styles.resultsSubText}>Stress score</Text>

              <Animated.View
                style={[
                  styles.scoreBubble,
                  styles.scoreBubblePrimary,
                  {
                    backgroundColor: stressTheme.bubbleBg,
                    borderColor: stressTheme.bubbleBorder,
                    transform: [{ scale: scoreScale }],
                  },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scoreGlow,
                    {
                      backgroundColor: stressTheme.accent,
                      opacity: scoreGlow,
                    },
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scoreStar,
                    {
                      transform: [{ translateY: scoreStarFloat }, { scale: scoreStarPulse }],
                    },
                  ]}
                >
                  <Ionicons name="star" size={24} color="#ffffff" />
                </Animated.View>
                <Text style={[styles.scoreValue, { color: stressTheme.bubbleText }]}>
                  {stressScore ?? totalScore ?? "-"}
                </Text>
              </Animated.View>

              {(stressSeverity || severity) && (
                <View
                  style={[
                    styles.severityPill,
                    {
                      backgroundColor: stressTheme.pillBg,
                      borderColor: stressTheme.pillBorder,
                    },
                  ]}
                >
                  <Ionicons name="pulse" size={16} color={stressTheme.pillText} />
                  <Text style={[styles.severityText, { color: stressTheme.pillText }]}>
                    Stress: {formatSeverityLabel(stressSeverity || severity)}
                  </Text>
                </View>
              )}

              <View style={styles.subScoreRow}>
                <View
                  style={[
                    styles.subScoreCard,
                    {
                      backgroundColor: anxietyTheme.pillBg,
                      borderColor: anxietyTheme.pillBorder,
                    },
                  ]}
                >
                  <View style={styles.subScoreHeaderRow}>
                    <Ionicons name="flash-outline" size={16} color={anxietyTheme.pillText} />
                    <Text style={[styles.subScoreLabel, { color: anxietyTheme.pillText }]}>
                      Anxiety
                    </Text>
                  </View>
                  <Text style={[styles.subScoreValue, { color: anxietyTheme.bubbleText }]}>
                    {anxietyScore ?? "-"}
                  </Text>
                  {anxietySeverity ? (
                    <View
                      style={[
                        styles.subSeverityPill,
                        { backgroundColor: anxietyTheme.pillBg, borderColor: anxietyTheme.pillBorder },
                      ]}
                    >
                      <Text style={[styles.subSeverityText, { color: anxietyTheme.pillText }]}>
                        {formatSeverityLabel(anxietySeverity)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.subScoreCard,
                    {
                      backgroundColor: depressionTheme.pillBg,
                      borderColor: depressionTheme.pillBorder,
                    },
                  ]}
                >
                  <View style={styles.subScoreHeaderRow}>
                    <Ionicons name="cloud-outline" size={16} color={depressionTheme.pillText} />
                    <Text style={[styles.subScoreLabel, { color: depressionTheme.pillText }]}>
                      Depression
                    </Text>
                  </View>
                  <Text style={[styles.subScoreValue, { color: depressionTheme.bubbleText }]}>
                    {depressionScore ?? "-"}
                  </Text>
                  {depressionSeverity ? (
                    <View
                      style={[
                        styles.subSeverityPill,
                        {
                          backgroundColor: depressionTheme.pillBg,
                          borderColor: depressionTheme.pillBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.subSeverityText, { color: depressionTheme.pillText }]}>
                        {formatSeverityLabel(depressionSeverity)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: resultsOpacity,
                transform: [{ translateY: resultsLift }],
              }}
            >
              <Pressable
                style={[styles.startButton, { marginTop: 30 }]}
                onPress={() => {
                  setAnswers({});
                  setCurrentIndex(0);
                  setTotalScore(null);
                  setSeverity(null);
                  setStressScore(null);
                  setStressSeverity(null);
                  setAnxietyScore(null);
                  setAnxietySeverity(null);
                  setDepressionScore(null);
                  setDepressionSeverity(null);
                  setShowResults(false);
                  setShowIntro(false);
                  setShowInstructions(true);
                }}
              >
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.startButtonText}>Retake Questionnaire</Text>
              </Pressable>

              {recommendation ? (
                <>
                  <Text
                    style={[
                      styles.optionDescription,
                      { textAlign: "center", marginTop: 14, marginBottom: 6 },
                    ]}
                  >
                    Based on your results, we recommend taking the following next step:
                  </Text>
                  <Pressable
                    style={[styles.startButton, styles.nextStepButton, { marginTop: 0 }]}
                    onPress={() => navigation.navigate(recommendation.routeName)}
                  >
                    <Ionicons name={recommendation.icon} size={16} color="#ffffff" />
                    <Text style={styles.startButtonText}>{recommendation.label}</Text>
                  </Pressable>
                </>
              ) : null}
            </Animated.View>
          </ScrollView>
        ) : (
          <>
            {isQuestionsLoading || questionsLoadError || !questions ? (
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsHeading}>Loading Questionnaire</Text>

                  {isQuestionsLoading ? (
                    <View style={{ marginTop: 14 }}>
                      <ActivityIndicator size="small" color="#0f538f" />
                      <Text style={[styles.instructionsText, { marginTop: 12 }]}>Please wait.</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.instructionsText, { marginTop: 10 }]}>
                        {questionsLoadError || "Could not load questionnaire."}
                      </Text>
                      <Pressable style={[styles.startButton, { marginTop: 14 }]} onPress={loadQuestions}>
                        <Ionicons name="refresh" size={16} color="#ffffff" />
                        <Text style={styles.startButtonText}>Retry</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            ) : null}

            {!isQuestionsLoading && !questionsLoadError && questions ? (
            <ScrollView
              ref={questionScrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.questionContentWrap,
                  {
                    opacity: questionOpacity,
                    transform: [{ translateY: questionLift }],
                  },
                ]}
              >
                <View style={styles.progressRow}>
                  <View style={styles.progressPill}>
                    <Ionicons name="help-circle-outline" size={18} color="#0f538f" />
                    <Text style={styles.progressText}>
                      Question {currentIndex + 1} of {questions.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.questionText}>{currentQuestion.text}</Text>
                </View>

                <View style={styles.optionsContainer}>
                  {[0, 1, 2, 3].map((value) => (
                    <Pressable
                      key={value}
                      style={[
                        styles.optionButton,
                        selectedValue === value && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleSelect(value)}
                    >
                      <View style={styles.optionTopRow}>
                        <Text
                          style={[
                            styles.optionLabel,
                            selectedValue === value && styles.optionLabelSelected,
                          ]}
                        >
                          {value}
                        </Text>
                        {selectedValue === value && (
                          <Ionicons name="checkmark-circle" size={18} color="#1976D2" />
                        )}
                      </View>
                      <Text style={styles.optionDescription}>
                        {value === 0 && "Did not apply to me at all"}
                        {value === 1 && "Applied to me to some degree, or some of the time"}
                        {value === 2 &&
                          "Applied to me to a considerable degree or a good part of the time"}
                        {value === 3 && "Applied to me very much or most of the time"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <View style={styles.navigationRow}>
                <Pressable
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                  style={[
                    styles.navButton,
                    styles.navButtonSecondary,
                    currentIndex === 0 && styles.navButtonDisabled,
                  ]}
                >
                  <Text style={[styles.navButtonText, styles.navButtonTextSecondary]}>Previous</Text>
                </Pressable>

                <Pressable
                  onPress={handleNext}
                  disabled={selectedValue === undefined || isSubmitting}
                  style={[
                    styles.navButton,
                    (selectedValue === undefined || isSubmitting) && styles.navButtonDisabled,
                  ]}
                >
                  <Text style={styles.navButtonText}>{isLastQuestion ? "Done" : "Next"}</Text>
                </Pressable>
              </View>
            </ScrollView>
            ) : null}
          </>
        )}
      </View>
    </SafeScreen>
  );
}
