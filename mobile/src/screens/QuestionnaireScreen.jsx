import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Image, Alert, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";
import questionnaireBanner from "../../assets/images/questionnaire-banner.png";
import { API_URL } from "../../constants/api";

function getSeverityTheme(rawSeverity) {
  const level = (rawSeverity || "").toLowerCase();

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

function WatermarkFlower({ style }) {
  return (
    <View pointerEvents="none" style={[styles.flowerWrap, style]}>
      <View style={[styles.flowerPetal, styles.flowerPetalTop]} />
      <View style={[styles.flowerPetal, styles.flowerPetalBottom]} />
      <View style={[styles.flowerPetal, styles.flowerPetalLeft]} />
      <View style={[styles.flowerPetal, styles.flowerPetalRight]} />
      <View style={styles.flowerCenter} />
    </View>
  );
}

function WatermarkStar({ style }) {
  return (
    <Ionicons
      pointerEvents="none"
      name="star"
      size={10}
      color="#7fb6e8"
      style={[styles.watermarkStar, style]}
    />
  );
}

function DecorativeBackground({ variant }) {
  const settings = {
    intro: { flowers: 0, stars: 0, seed: 3 },
    instructions: { flowers: 36, stars: 64, seed: 11 },
    questions: { flowers: 42, stars: 72, seed: 19 },
    results: { flowers: 38, stars: 68, seed: 27 },
  }[variant] || { flowers: 0, stars: 0, seed: 1 };

  const flowerLayout = Array.from({ length: settings.flowers }, (_, index) => {
    const top = (index * 23 + settings.seed * 17) % 100;
    const left = (index * 31 + settings.seed * 13) % 100;
    const scale = 0.42 + ((index * 7) % 38) / 100;
    const rotate = `${(index * 29 + settings.seed) % 360}deg`;

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: [{ scale }, { rotate }],
      opacity: 0.11,
    };
  });

  const starLayout = Array.from({ length: settings.stars }, (_, index) => {
    const top = (index * 17 + settings.seed * 19) % 100;
    const left = (index * 37 + settings.seed * 7) % 100;
    const scale = 0.55 + ((index * 11) % 42) / 100;

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: [{ scale }],
      opacity: 0.18,
    };
  });

  return (
    <>
      {(flowerLayout[variant] || []).map((style, index) => (
        <WatermarkFlower key={`flower-${variant}-${index}`} style={style} />
      ))}
      {(starLayout[variant] || []).map((style, index) => (
        <WatermarkStar key={`star-${variant}-${index}`} style={style} />
      ))}
    </>
  );
}

export default function QuestionnaireScreen() {
  const questions = useMemo(
    () => [
      { id: 1, text: "I found it hard to wind down" },
      { id: 2, text: "I was aware of dryness of my mouth" },
      { id: 3, text: "I couldn’t seem to experience any positive feeling at all" },
      {
        id: 4,
        text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)",
      },
      { id: 5, text: "I found it difficult to work up the initiative to do things" },
      { id: 6, text: "I tended to over-react to situations" },
      { id: 7, text: "I experienced trembling (e.g. in the hands)" },
      { id: 8, text: "I felt that I was using a lot of nervous energy" },
      {
        id: 9,
        text: "I was worried about situations in which I might panic and make a fool of myself",
      },
      { id: 10, text: "I felt that I had nothing to look forward to" },
      { id: 11, text: "I found myself getting agitated" },
      { id: 12, text: "I found it difficult to relax" },
      { id: 13, text: "I felt down-hearted and blue" },
      {
        id: 14,
        text: "I was intolerant of anything that kept me from getting on with what I was doing",
      },
      { id: 15, text: "I felt I was close to panic" },
      { id: 16, text: "I was unable to become enthusiastic about anything" },
      { id: 17, text: "I felt I wasn’t worth much as a person" },
      { id: 18, text: "I felt that I was rather touchy" },
      {
        id: 19,
        text: "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)",
      },
      { id: 20, text: "I felt scared without any good reason" },
      { id: 21, text: "I felt that life was meaningless" },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showIntro, setShowIntro] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const instructionsOpacity = useRef(new Animated.Value(0)).current;
  const instructionsLift = useRef(new Animated.Value(26)).current;
  const alertPulse = useRef(new Animated.Value(1)).current;
  const questionOpacity = useRef(new Animated.Value(1)).current;
  const questionLift = useRef(new Animated.Value(0)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsLift = useRef(new Animated.Value(24)).current;
  const scoreScale = useRef(new Animated.Value(0.9)).current;
  const scoreGlow = useRef(new Animated.Value(0.35)).current;
  const scoreStarFloat = useRef(new Animated.Value(0)).current;
  const scoreStarPulse = useRef(new Animated.Value(0.55)).current;
  const pulseLoopRef = useRef(null);
  const scoreLoopRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      setShowInstructions(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showInstructions) {
      return;
    }

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
    if (showIntro || showInstructions || showResults) {
      return;
    }

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
  }, [
    currentIndex,
    showIntro,
    showInstructions,
    showResults,
    questionOpacity,
    questionLift,
  ]);

  useEffect(() => {
    if (!showResults) {
      return;
    }

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

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedValue = answers[currentQuestion?.id];
  const severityTheme = useMemo(() => getSeverityTheme(severity), [severity]);

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (selectedValue === undefined) return;

    if (isLastQuestion) {
      handleSubmit();
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
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
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to calculate score");
      }

      setTotalScore(data.totalScore);
      setSeverity(data.severity || null);
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
        {showIntro ? (
          <View style={styles.introContainer}>
            <View style={styles.introForeground}>
              <Image
                source={questionnaireBanner}
                style={styles.introImage}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : showInstructions ? (
          <View style={styles.instructionsContainer}>
            <DecorativeBackground variant="instructions" />
            <WatermarkFlower style={styles.flowerOne} />
            <WatermarkFlower style={styles.flowerTwo} />
            <WatermarkFlower style={styles.flowerThree} />
            <WatermarkFlower style={styles.flowerFour} />

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
                For each statement, choose how much it applied to you over the
                past week.
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
              <Pressable
                style={styles.startButton}
                onPress={() => setShowInstructions(false)}
              >
                <Ionicons name="play" size={16} color="#ffffff" />
                <Text style={styles.startButtonText}>Start Questionnaire</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : showResults ? (
          <View style={styles.instructionsContainer}>
            <DecorativeBackground variant="results" />
            <WatermarkFlower style={styles.flowerResultOne} />
            <WatermarkFlower style={styles.flowerResultTwo} />

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

              <Text style={styles.resultsSubText}>Your total score</Text>

              <Animated.View
                style={[
                  styles.scoreBubble,
                  {
                    backgroundColor: severityTheme.bubbleBg,
                    borderColor: severityTheme.bubbleBorder,
                    transform: [{ scale: scoreScale }],
                  },
                ]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.scoreGlow,
                    {
                      backgroundColor: severityTheme.accent,
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
                <Text style={[styles.scoreValue, { color: severityTheme.bubbleText }]}>{totalScore}</Text>
              </Animated.View>

              {severity && (
                <View
                  style={[
                    styles.severityPill,
                    {
                      backgroundColor: severityTheme.pillBg,
                      borderColor: severityTheme.pillBorder,
                    },
                  ]}
                >
                  <Ionicons name="pulse" size={16} color={severityTheme.pillText} />
                  <Text style={[styles.severityText, { color: severityTheme.pillText }]}> 
                    Stress level: {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Text>
                </View>
              )}
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
                  // Reset to allow taking the questionnaire again
                  setAnswers({});
                  setCurrentIndex(0);
                  setTotalScore(null);
                  setSeverity(null);
                  setShowResults(false);
                  // Skip the timed intro on retake; go straight to instructions
                  setShowIntro(false);
                  setShowInstructions(true);
                }}
              >
                <Ionicons name="refresh" size={16} color="#ffffff" />
                <Text style={styles.startButtonText}>Retake Questionnaire</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <>
            <DecorativeBackground variant="questions" />
            <WatermarkFlower style={styles.flowerQuestionOne} />
            <WatermarkFlower style={styles.flowerQuestionTwo} />

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
                    {value === 1 &&
                      "Applied to me to some degree, or some of the time"}
                    {value === 2 &&
                      "Applied to me to a considerable degree or a good part of the time"}
                    {value === 3 &&
                      "Applied to me very much or most of the time"}
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
                <Text
                  style={[styles.navButtonText, styles.navButtonTextSecondary]}
                >
                  Previous
                </Text>
              </Pressable>

              <Pressable
                onPress={handleNext}
                disabled={selectedValue === undefined || isSubmitting}
                style={[
                  styles.navButton,
                  (selectedValue === undefined || isSubmitting) &&
                    styles.navButtonDisabled,
                ]}
              >
                <Text style={styles.navButtonText}>
                  {isLastQuestion ? "Done" : "Next"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeScreen>
  );
}


