import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function DoctorAppointmentsScreen() {
  const { token } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("Pending");

  const fetchAppointments = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getAppointments(token, filter);
      setAppointments(data.appointments ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, filter]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const handleAction = async (appointmentId, action) => {
    try {
      if (action === "accept") {
        await doctorApi.acceptAppointment(appointmentId, token);
      } else {
        await doctorApi.rejectAppointment(appointmentId, "Doctor unavailable", token);
      }
      fetchAppointments();
    } catch (error) {
      Alert.alert("Action failed", error.message);
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Appointments</Text>
          <Text style={doctorStyles.pageSubtitle}>Review and manage your scheduled appointments.</Text>
        </View>

        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, filter === "Pending" && styles.tabActive]}
            onPress={() => setFilter("Pending")}
          >
            <Text style={[styles.tabText, filter === "Pending" && styles.tabTextActive]}>Pending</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, filter === "Accepted" && styles.tabActive]}
            onPress={() => setFilter("Accepted")}
          >
            <Text style={[styles.tabText, filter === "Accepted" && styles.tabTextActive]}>Accepted</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={doctorStyles.centered}>
            <ActivityIndicator size="large" color="#0b5ea8" />
          </View>
        ) : appointments.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No {filter.toLowerCase()} appointments</Text>
          </View>
        ) : (
          appointments.map((apt) => (
            <View key={apt._id} style={doctorStyles.card}>
              <Text style={doctorStyles.cardTitle}>{apt.patientId?.username ?? "User"}</Text>
              
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>{apt.appointmentDate} at {apt.startTime} - {apt.endTime}</Text>
              </View>
              
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Reason:</Text>
                <Text style={styles.infoValue}>{apt.reason}</Text>
              </View>

              {apt.dassSnapshot && (
                <View style={styles.dassBox}>
                  <Text style={styles.dassTitle}>DASS Snapshot (at booking):</Text>
                  <Text style={styles.dassValue}>Stress: {apt.dassSnapshot.stress} | Anxiety: {apt.dassSnapshot.anxiety} | Depression: {apt.dassSnapshot.depression}</Text>
                  <Text style={styles.dassValue}>Severity: {apt.dassSnapshot.severity}</Text>
                </View>
              )}

              {filter === "Pending" && (
                <View style={doctorStyles.buttonRow}>
                  <Pressable style={doctorStyles.button} onPress={() => handleAction(apt._id, "accept")}>
                    <Text style={doctorStyles.buttonText}>Accept</Text>
                  </Pressable>
                  <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => handleAction(apt._id, "reject")}>
                    <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Reject</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee'
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  tabActive: {
    backgroundColor: '#0b5ea8'
  },
  tabText: {
    fontWeight: 'bold',
    color: '#666'
  },
  tabTextActive: {
    color: '#fff'
  },
  infoBox: {
    flexDirection: 'row',
    marginTop: 6
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
    width: 60,
  },
  infoValue: {
    flex: 1,
    color: '#333'
  },
  dassBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#d9534f'
  },
  dassTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    marginBottom: 4
  },
  dassValue: {
    fontSize: 12,
    color: '#555'
  }
});
