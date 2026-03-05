import React, { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";

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

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (isLastQuestion) return;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const selectedValue = answers[currentQuestion?.id];

  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>DASS-21</Text>
        <Text style={styles.subtitle}>
          Over the past week, how much has each statement applied to you?
        </Text>

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
            <Text style={[styles.navButtonText, styles.navButtonTextSecondary]}>
              Previous
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={selectedValue === undefined || isLastQuestion}
            style={[
              styles.navButton,
              selectedValue === undefined && styles.navButtonDisabled,
            ]}
          >
            <Text style={styles.navButtonText}>
              {isLastQuestion ? "Done" : "Next"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeScreen>
  );
}


