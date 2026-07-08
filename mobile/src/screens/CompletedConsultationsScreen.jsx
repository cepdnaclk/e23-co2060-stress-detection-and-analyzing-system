import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function CompletedConsultationsScreen() {
  const { token } = useAuthStore();
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCompleted = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getCompletedConsultations(token);
      setConsultations(data.consultations ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, [token]);

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
          <Text style={doctorStyles.pageTitle}>Completed Consultations</Text>
          <Text style={doctorStyles.pageSubtitle}>Closed patient cases and consultation history.</Text>
        </View>

        {consultations.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No completed consultations</Text>
          </View>
        ) : (
          consultations.map((consultation) => (
            <View key={consultation._id} style={doctorStyles.card}>
              <Text style={doctorStyles.cardTitle}>{consultation.userId?.username ?? "User"}</Text>
              <Text style={doctorStyles.cardSubtitle}>Reason: {consultation.requestId?.reason}</Text>
              <Text style={doctorStyles.cardSubtitle}>Completed: {new Date(consultation.completedAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}
