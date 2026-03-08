import React, { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
import { View, Text, Pressable, Image } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";
import questionnaireBanner from "../../assets/images/questionnaire-banner.png";
=======
import { View, Text, Pressable, Image, Alert } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";
import questionnaireBanner from "../../assets/images/questionnaire-banner.png";
import { API_URL } from "../../constants/api";
>>>>>>> main

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
<<<<<<< HEAD
=======
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalScore, setTotalScore] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [showResults, setShowResults] = useState(false);
>>>>>>> main

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      setShowInstructions(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
<<<<<<< HEAD
=======
  const selectedValue = answers[currentQuestion?.id];
>>>>>>> main

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
<<<<<<< HEAD
    if (isLastQuestion) return;
    if (currentIndex < questions.length - 1) {
=======
    if (selectedValue === undefined) return;

    if (isLastQuestion) {
      handleSubmit();
    } else if (currentIndex < questions.length - 1) {
>>>>>>> main
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

<<<<<<< HEAD
  const selectedValue = answers[currentQuestion?.id];
=======
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
>>>>>>> main

  return (
    <SafeScreen>
      <View style={styles.container}>
        {showIntro ? (
          <View style={styles.introContainer}>
            <Image
              source={questionnaireBanner}
              style={styles.introImage}
              resizeMode="contain"
            />
          </View>
        ) : showInstructions ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsHeading}>INSTRUCTIONS!!</Text>
            <Text style={styles.instructionsText}>
              You will see 21 short statements. For each one, select how
              much it applied to you over the past week.
            </Text>
            <Text style={styles.instructionsText}>
              There are no right or wrong answers. Answer as honestly and
              quickly as you can.
            </Text>

            <Pressable
              style={styles.startButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.startButtonText}>Start Questionnaire</Text>
            </Pressable>
          </View>
<<<<<<< HEAD
=======
        ) : showResults ? (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsHeading}>Your Results</Text>
            <Text style={styles.instructionsText}>
              Your total score is:
            </Text>
            <Text style={[styles.instructionsHeading, { fontSize: 32 }]}>
              {totalScore}
            </Text>

            {severity && (
              <Text style={[styles.instructionsText, { marginTop: 8 }]}> 
                Stress level: {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Text>
            )}

            <Pressable
              style={[styles.startButton, { marginTop: 32 }]}
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
              <Text style={styles.startButtonText}>Retake Questionnaire</Text>
            </Pressable>
          </View>
>>>>>>> main
        ) : (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
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
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedValue === value && styles.optionLabelSelected,
                    ]}
                  >
                    {value}
                  </Text>
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
<<<<<<< HEAD
                disabled={selectedValue === undefined || isLastQuestion}
                style={[
                  styles.navButton,
                  selectedValue === undefined && styles.navButtonDisabled,
=======
                disabled={selectedValue === undefined || isSubmitting}
                style={[
                  styles.navButton,
                  (selectedValue === undefined || isSubmitting) &&
                    styles.navButtonDisabled,
>>>>>>> main
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


