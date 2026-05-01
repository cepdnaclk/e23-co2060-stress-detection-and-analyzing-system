import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import styles from "../../assets/styles/routine.styles";
import { API_URL, fetchWithTimeout } from "../../constants/api";

export default function RoutineGeneratorScreen() {
  const [tasks, setTasks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const formatTimetableForAlert = (timetable) => {
    if (!timetable) return "No timetable was returned by the server.";

    if (Array.isArray(timetable.blocks) && timetable.blocks.length > 0) {
      const lines = timetable.blocks.map(
        (block) => `${block.start} - ${block.end}: ${block.activity}`
      );

      if (timetable.summary) {
        lines.push(`\nSummary: ${timetable.summary}`);
      }

      return lines.join("\n");
    }

    if (timetable.raw_text) {
      return timetable.raw_text;
    }

    return JSON.stringify(timetable, null, 2);
  };

  const handleGenerateRoutine = async () => {
    if (!tasks.trim()) {
      Alert.alert("Missing tasks", "Please enter your daily tasks first.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetchWithTimeout(`${API_URL}/schedule/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: tasks.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate routine");
      }

      const routineText = formatTimetableForAlert(data.timetable);

      Alert.alert("Routine Generated", routineText || "No routine generated.");
    } catch (error) {
      Alert.alert(
        "Generation Failed",
        error.message || "Could not connect to the timetable generator server."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/routine-generator-reference.png")}
        style={styles.cardBackground}
        imageStyle={styles.cardImage}
        resizeMode="contain"
      >
        <View style={styles.overlayLayer}>
          <TextInput
            style={styles.input}
            placeholder="Describe your daily tasks to generate a routine..."
            placeholderTextColor="#7AA7D6"
            multiline
            textAlignVertical="top"
            value={tasks}
            onChangeText={setTasks}
          />

          <Pressable
            style={[styles.enterButton, isGenerating && styles.enterButtonDisabled]}
            onPress={handleGenerateRoutine}
            disabled={isGenerating}
          >
            <Text style={styles.enterButtonText}>
              {isGenerating ? "Generating..." : "Generate Routine"}
            </Text>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  );
}
