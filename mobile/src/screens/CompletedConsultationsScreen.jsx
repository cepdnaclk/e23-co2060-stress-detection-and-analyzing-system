import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function CompletedConsultationsScreen() {
  const { token } = useAuthStore();
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCompleted = useCallback(async () => {
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
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchCompleted();
    }, [fetchCompleted])
  );

  if (isLoading) {
    return (
      <SafeScreen>
        <View style={doctorStyles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeScreen>
    );
  }

  const filteredConsultations = consultations.filter((c) => {
    const name = c.userId?.username?.toLowerCase() ?? "";
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Completed Appointments</Text>
          <Text style={doctorStyles.pageSubtitle}>Closed patient cases and appointment history.</Text>
        </View>

        <TextInput
          style={doctorStyles.input}
          placeholder="Search patient by name..."
          placeholderTextColor="#7a8ea6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredConsultations.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No completed appointments found</Text>
          </View>
        ) : (
          filteredConsultations.map((consultation) => (
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
