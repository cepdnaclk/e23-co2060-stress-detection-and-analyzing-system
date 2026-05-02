import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Modal,
  ScrollView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import styles from "../../assets/styles/routine.styles";
import { API_URL, fetchWithTimeout } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

export default function RoutineGeneratorScreen() {
  const [tasks, setTasks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState(null);
  const [generatedRoutineText, setGeneratedRoutineText] = useState("");
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const { token } = useAuthStore();

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

  const getAuthHeaders = () => {
    if (!token) {
      throw new Error("Please log in first to use saved routines.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadSavedRoutines = async (openModal = true) => {
    if (!token) {
      Alert.alert("Login required", "Please log in to view or save routines.");
      return;
    }

    setIsLoadingRoutines(true);

    try {
      const response = await fetchWithTimeout(`${API_URL}/routine`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load routines");
      }

      setSavedRoutines(data.routines || []);

      if (openModal) {
        setShowSavedModal(true);
      }
    } catch (error) {
      Alert.alert("Could not load routines", error.message || "Try again later.");
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  const saveRoutineToServer = async () => {
    if (!generatedRoutine) {
      Alert.alert("Missing routine", "Generate a routine first.");
      return;
    }

    if (!token) {
      Alert.alert("Login required", "Please log in before saving routines.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetchWithTimeout(`${API_URL}/routine/save`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: "Generated routine",
          date: new Date().toISOString().slice(0, 10),
          summary: generatedRoutine.summary || "",
          alertText: generatedRoutineText,
          rawText: tasks.trim(),
          timetable: generatedRoutine,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save routine");
      }

      setSavedRoutines((current) => [data.routine, ...current]);
      Alert.alert("Saved", "Routine saved to your profile.");
    } catch (error) {
      Alert.alert("Save failed", error.message || "Could not save routine.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRoutineOnServer = async (routineId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/routine/${routineId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete routine");
      }

      setSavedRoutines((current) => current.filter((routine) => routine._id !== routineId));
      Alert.alert("Deleted", "Routine removed.");
    } catch (error) {
      Alert.alert("Delete failed", error.message || "Could not delete routine.");
    }
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
      setGeneratedRoutine(data.timetable);
      setGeneratedRoutineText(routineText);
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

          <View style={styles.actionColumn}>
            <Pressable
              style={[
                styles.secondaryButton,
                isLoadingRoutines && styles.buttonDisabled,
              ]}
              onPress={() => loadSavedRoutines(true)}
              disabled={isLoadingRoutines}
            >
              <Text style={styles.secondaryButtonText}>
                {isLoadingRoutines ? "Loading..." : "View Saved Routines"}
              </Text>
            </Pressable>

          </View>

          <Modal
            visible={!!generatedRoutine}
            animationType="slide"
            transparent
            onRequestClose={() => setGeneratedRoutine(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.generatedRoutineModal}>
                <Text style={styles.generatedRoutineModalTitle}>Generated Routine</Text>
                <ScrollView style={styles.generatedRoutineModalContent}>
                  <Text style={styles.generatedRoutineModalText}>{generatedRoutineText}</Text>
                </ScrollView>
                <Pressable
                  style={[
                    styles.saveFromModalButton,
                    (isSaving || !token) && styles.buttonDisabled,
                  ]}
                  onPress={saveRoutineToServer}
                  disabled={isSaving || !token}
                >
                  <Text style={styles.saveFromModalButtonText}>
                    {isSaving ? "Saving..." : "Save Routine"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setGeneratedRoutine(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showSavedModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowSavedModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Saved Routines</Text>
                <ScrollView
                  style={styles.modalList}
                  contentContainerStyle={styles.modalListContent}
                >
                  {savedRoutines.length === 0 ? (
                    <Text style={styles.modalEmptyText}>No saved routines yet.</Text>
                  ) : (
                    savedRoutines.map((routine) => (
                      <View key={routine._id} style={styles.routineItem}>
                        <Text style={styles.routineItemTitle}>
                          {routine.title || "Routine"}
                        </Text>
                        <Text style={styles.routineItemMeta}>
                          {routine.date || "No date"}
                        </Text>
                        <Text style={styles.routineItemText}>
                          {routine.alertText || formatTimetableForAlert(routine)}
                        </Text>
                        <View style={styles.routineItemActions}>
                          <Pressable
                            style={[styles.itemActionButton, styles.deleteActionButton]}
                            onPress={() => deleteRoutineOnServer(routine._id)}
                          >
                            <Text style={styles.itemActionText}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setShowSavedModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

        </View>
      </ImageBackground>
    </View>
  );
}
