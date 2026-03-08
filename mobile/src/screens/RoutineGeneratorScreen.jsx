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

