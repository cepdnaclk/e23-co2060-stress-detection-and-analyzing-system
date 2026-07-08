import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function CurrentPatientsScreen() {
  const { token } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPatients = async () => {
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
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const finishConsultation = async (assignmentId) => {
    try {
      await doctorApi.completeConsultation(assignmentId, token);
      fetchPatients();
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
              <Pressable style={doctorStyles.button} onPress={() => finishConsultation(assignment._id)}>
                <Text style={doctorStyles.buttonText}>Finish Consultation</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}
