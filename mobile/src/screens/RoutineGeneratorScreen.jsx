import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function RoutineGeneratorScreen() {
  const [tasks, setTasks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const buildRoutineFromTasks = (taskText) => {
    const chunks = taskText
      .split(/[\n,.;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);

    return chunks.map((item, index) => `${index + 1}. ${item}`).join("\n");
  };

  const handleGenerateRoutine = () => {
    if (!tasks.trim()) {
      Alert.alert("Missing tasks", "Please enter your daily tasks first.");
      return;
    }

    setIsGenerating(true);

    // Small delay keeps the interaction responsive and gives visual feedback.
    setTimeout(() => {
      const routine = buildRoutineFromTasks(tasks);
      setIsGenerating(false);

      Alert.alert(
        "Routine Generated",
        routine || "Please add clearer tasks (separated by commas or new lines)."
      );
    }, 300);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEDF2",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  cardBackground: {
    width: "96%",
    maxWidth: 960,
    aspectRatio: 964 / 741,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    borderRadius: 26,
  },
  overlayLayer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  input: {
    position: "absolute",
    left: "11.2%",
    top: "32.2%",
    width: "76%",
    height: "33%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#346EAF",
    fontFamily: "JetBrainsMono-Medium",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(130, 176, 229, 0.65)",
  },
  enterButton: {
    position: "absolute",
    left: "22%",
    top: "71%",
    width: "56%",
    height: "12.5%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(67, 160, 246, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(204, 228, 252, 0.95)",
  },
  enterButtonDisabled: {
    opacity: 0.75,
  },
  enterButtonText: {
    color: "#EDF6FF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "JetBrainsMono-Medium",
    textShadowColor: "rgba(39, 91, 155, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});