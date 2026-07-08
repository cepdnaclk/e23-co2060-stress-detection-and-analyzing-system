import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function DoctorDashboardScreen({ navigation }) {
  const { token } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboard = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getDoctorDashboard(token);
      setDashboard(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  if (isLoading || !dashboard) {
    return (
      <SafeScreen>
        <View style={doctorStyles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeScreen>
    );
  }

  const stats = dashboard.stats ?? {};

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Doctor Dashboard</Text>
          <Text style={doctorStyles.pageSubtitle}>
            Manage your requests, patients, reviews, and profile from one place.
          </Text>
        </View>

        <View style={doctorStyles.row}>
          <View style={doctorStyles.statCard}>
            <Text style={doctorStyles.statLabel}>Pending</Text>
            <Text style={doctorStyles.statValue}>{stats.pendingRequests ?? 0}</Text>
          </View>
          <View style={doctorStyles.statCard}>
            <Text style={doctorStyles.statLabel}>Patients</Text>
            <Text style={doctorStyles.statValue}>{stats.activePatients ?? 0}</Text>
          </View>
          <View style={doctorStyles.statCard}>
            <Text style={doctorStyles.statLabel}>Completed</Text>
            <Text style={doctorStyles.statValue}>{stats.completedConsultations ?? 0}</Text>
          </View>
          <View style={doctorStyles.statCard}>
            <Text style={doctorStyles.statLabel}>Reviews</Text>
            <Text style={doctorStyles.statValue}>{stats.reviews ?? 0}</Text>
          </View>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Quick Actions</Text>
          <View style={doctorStyles.buttonRow}>
            {[
              ["Pending Requests", "Pending Requests"],
              ["Current Patients", "Current Patients"],
              ["Completed Consultations", "Completed Consultations"],
              ["Reviews", "Reviews"],
              ["Profile", "Profile"],
              ["Availability", "Availability"],
            ].map(([label, route]) => (
              <Pressable key={label} style={[doctorStyles.button, doctorStyles.smallButton]} onPress={() => navigation.navigate(route)}>
                <Text style={doctorStyles.buttonText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Profile Summary</Text>
          <Text style={doctorStyles.cardSubtitle}>{dashboard.doctor?.fullName}</Text>
          <Text style={doctorStyles.cardSubtitle}>{dashboard.doctor?.specialization}</Text>
          <Text style={doctorStyles.cardSubtitle}>{dashboard.doctor?.hospital}</Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
