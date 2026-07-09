import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function CurrentPatientsScreen() {
  const { token } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState("");

  const fetchPatients = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getCurrentPatients(token);
      setAssignments(data.assignments ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  const finishConsultation = async (assignmentId) => {
    try {
      await doctorApi.completeConsultation(assignmentId, token);
      fetchPatients();
      if (selectedAssignment?._id === assignmentId) {
        setSelectedAssignment(null);
        setPatientDetails(null);
        setNoteText("");
      }
    } catch (error) {
      Alert.alert("Action failed", error.message);
    }
  };

  const openPatient = async (assignment) => {
    setSelectedAssignment(assignment);
    setDetailLoading(true);
    try {
      const data = await doctorApi.getPatientDetails(assignment.userId?._id, token);
      setPatientDetails(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveNote = async () => {
    if (!selectedAssignment?.requestId?._id || !noteText.trim()) {
      Alert.alert("Missing info", "Enter a consultation note first.");
      return;
    }

    try {
      await doctorApi.addConsultationNote(selectedAssignment.requestId._id, token, noteText.trim());
      setNoteText("");
      const data = await doctorApi.getPatientDetails(selectedAssignment.userId?._id, token);
      setPatientDetails(data);
    } catch (error) {
      Alert.alert("Action failed", error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={doctorStyles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Current Patients</Text>
          <Text style={doctorStyles.pageSubtitle}>Users actively assigned to your care.</Text>
        </View>

        {assignments.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No active patients</Text>
          </View>
        ) : (
          assignments.map((assignment) => (
              <View key={assignment._id} style={doctorStyles.card}>
                <Text style={doctorStyles.cardTitle}>{assignment.userId?.username ?? "User"}</Text>
                <Text style={doctorStyles.cardSubtitle}>Reason: {assignment.requestId?.reason}</Text>
                <Text style={doctorStyles.cardSubtitle}>Stress level: {assignment.requestId?.stressLevel ?? "N/A"}</Text>
                <Text style={doctorStyles.cardSubtitle}>Assigned: {new Date(assignment.assignedAt).toLocaleString()}</Text>
                <Text style={doctorStyles.cardSubtitle}>Tap to view stress history and notes.</Text>
                <View style={doctorStyles.buttonRow}>
                  <Pressable style={doctorStyles.button} onPress={() => openPatient(assignment)}>
                    <Text style={doctorStyles.buttonText}>Open Patient</Text>
                  </Pressable>
                  <Pressable style={doctorStyles.button} onPress={() => finishConsultation(assignment._id)}>
                    <Text style={doctorStyles.buttonText}>Finish Consultation</Text>
                  </Pressable>
                </View>
              </View>
          ))
        )}

        {selectedAssignment ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.cardTitle}>Patient Detail</Text>
            {detailLoading ? (
              <View style={doctorStyles.centered}>
                <ActivityIndicator size="small" />
              </View>
            ) : patientDetails ? (
              <>
                <View style={doctorStyles.row}>
                  {patientDetails.patient?.profileImage ? (
                    <Image source={{ uri: patientDetails.patient.profileImage }} style={doctorStyles.avatar} />
                  ) : (
                    <View style={doctorStyles.avatar} />
                  )}
                  <View style={doctorStyles.column}>
                    <Text style={doctorStyles.cardTitle}>{patientDetails.patient?.username ?? "User"}</Text>
                    <Text style={doctorStyles.cardSubtitle}>Age: {patientDetails.patient?.age ?? "N/A"}</Text>
                    <Text style={doctorStyles.cardSubtitle}>Gender: {patientDetails.patient?.gender ?? "N/A"}</Text>
                  </View>
                </View>

                <Text style={doctorStyles.cardSubtitle}>
                  Latest stress score: {patientDetails.latestAssessment?.stressScore ?? "N/A"}
                </Text>
                <Text style={doctorStyles.cardSubtitle}>
                  Stress level: {patientDetails.latestAssessment?.stressSeverity ?? "N/A"}
                </Text>
                <Text style={doctorStyles.cardSubtitle}>
                  Previous assessments: {patientDetails.questionnaireHistory?.length ?? 0}
                </Text>
                <Text style={doctorStyles.cardSubtitle}>
                  Journey entries: {patientDetails.moodHistory?.length ?? 0}
                </Text>

                <View style={doctorStyles.card}>
                  <Text style={doctorStyles.cardTitle}>Private Note</Text>
                  <TextInput
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Add a private consultation note"
                    placeholderTextColor="#7a8ea6"
                    multiline
                    style={[doctorStyles.input, doctorStyles.multiLineInput]}
                  />
                  <Pressable style={doctorStyles.button} onPress={saveNote}>
                    <Text style={doctorStyles.buttonText}>Save Note</Text>
                  </Pressable>
                </View>

                <View style={doctorStyles.card}>
                  <Text style={doctorStyles.cardTitle}>Existing Recommendations</Text>
                  {patientDetails.recommendations?.length ? (
                    patientDetails.recommendations.map((recommendation) => (
                      <View key={recommendation._id} style={doctorStyles.card}>
                        <Text style={doctorStyles.cardSubtitle}>{recommendation.title}</Text>
                        <Text style={doctorStyles.cardSubtitle}>{recommendation.summary || recommendation.alertText || "No summary"}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={doctorStyles.cardSubtitle}>No recommendations saved.</Text>
                  )}
                </View>

                <View style={doctorStyles.card}>
                  <Text style={doctorStyles.cardTitle}>Consultation Notes</Text>
                  {patientDetails.consultation?.doctorNotes?.length ? (
                    patientDetails.consultation.doctorNotes.map((entry, index) => (
                      <Text key={`${entry.createdAt}-${index}`} style={doctorStyles.cardSubtitle}>
                        {new Date(entry.createdAt).toLocaleString()}: {entry.note}
                      </Text>
                    ))
                  ) : (
                    <Text style={doctorStyles.cardSubtitle}>No notes yet.</Text>
                  )}
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeScreen>
  );
}
