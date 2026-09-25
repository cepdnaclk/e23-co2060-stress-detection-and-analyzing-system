import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View, StyleSheet, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => (
    <Pressable key={index}>
      <Ionicons name={index < value ? "star" : "star-outline"} size={20} color="#f5a524" />
    </Pressable>
  ));
}

export default function MyAppointmentsScreen() {
  const { token } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingDrafts, setRatingDrafts] = useState({});

  const fetchAppointments = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getUserAppointments(token);
      setAppointments(data.appointments ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const submitRating = async (assignmentId) => {
    const draft = ratingDrafts[assignmentId] ?? { stars: 5, review: "" };

    try {
      await doctorApi.rateDoctor(assignmentId, token, draft.stars, draft.review);
      Alert.alert("Thanks", "Your review was submitted");
      fetchAppointments();
    } catch (error) {
      Alert.alert("Rating failed", error.message);
    }
  };

  return (
    <SafeScreen>
      <BubbleBackground variant="subtle" />
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>My Appointments</Text>
          <Text style={doctorStyles.pageSubtitle}>View your upcoming scheduled appointments with doctors.</Text>
        </View>

        {isLoading ? (
          <View style={doctorStyles.centered}>
            <ActivityIndicator size="large" color="#0b5ea8" />
          </View>
        ) : appointments.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No appointments found</Text>
          </View>
        ) : (
          appointments.map((apt) => {
            const assignmentId = apt.assignmentId;
            const currentDraft = ratingDrafts[assignmentId] ?? { stars: 5, review: "" };
            const normalizedStatus = String(apt.status ?? "").toLowerCase();
            return (
              <View key={apt._id} style={doctorStyles.card}>
                <Text style={doctorStyles.cardTitle}>
                  {apt.doctorId?.fullName?.startsWith("Dr.") 
                    ? apt.doctorId.fullName 
                    : `Dr. ${apt.doctorId?.fullName ?? "Unknown"}`}
                </Text>
                <Text style={doctorStyles.cardSubtitle}>{apt.doctorId?.specialization} - {apt.doctorId?.hospital}</Text>
                
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Time:</Text>
                  <Text style={styles.infoValue}>{apt.appointmentDate} at {apt.startTime} - {apt.endTime}</Text>
                </View>
                
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Reason:</Text>
                  <Text style={styles.infoValue}>{apt.reason}</Text>
                </View>

                {normalizedStatus === "pending" && (
                  <View style={[doctorStyles.card, { borderColor: "#fff3d9", marginTop: 12 }]}>
                    <Text style={[doctorStyles.cardTitle, { color: "#8a5a00" }]}>Pending Doctor Approval</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      Waiting for the doctor to accept this slot.
                    </Text>
                  </View>
                )}

                {normalizedStatus === "rejected" && (
                  <View style={[doctorStyles.card, { borderColor: "#fde8e8", marginTop: 12 }]}>
                    <Text style={[doctorStyles.cardTitle, { color: "#a23636" }]}>Appointment Rejected</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      {apt.rejectionReason || "The doctor was unable to accept this appointment time."}
                    </Text>
                  </View>
                )}

                {normalizedStatus === "accepted" && (
                  <View style={[doctorStyles.card, { borderColor: "#d1e7dd", marginTop: 12 }]}>
                    <Text style={[doctorStyles.cardTitle, { color: "#0f5132" }]}>Appointment Accepted!</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      Your appointment is confirmed. If you connected Google Calendar, the event has been saved there.
                    </Text>
                  </View>
                )}

                {assignmentId && normalizedStatus === "completed" ? (
                  <View style={[doctorStyles.card, { marginTop: 12 }]}>
                    <Text style={doctorStyles.cardTitle}>Rate this consultation</Text>
                    <View style={doctorStyles.starRow}>{renderStars(currentDraft.stars)}</View>
                    <View style={doctorStyles.buttonRow}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable
                          key={value}
                          onPress={() =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [assignmentId]: { ...currentDraft, stars: value },
                            }))
                          }
                          style={[
                            doctorStyles.chip,
                            currentDraft.stars === value ? doctorStyles.chipSuccess : null,
                          ]}
                        >
                          <Text style={doctorStyles.chipText}>{value}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      value={currentDraft.review}
                      onChangeText={(review) =>
                        setRatingDrafts((prev) => ({
                          ...prev,
                          [assignmentId]: { ...currentDraft, review },
                        }))
                      }
                      placeholder="Optional review"
                      placeholderTextColor="#7a8ea6"
                      multiline
                      style={[doctorStyles.input, doctorStyles.multiLineInput]}
                    />
                    <Pressable
                      style={doctorStyles.button}
                      onPress={() => submitRating(assignmentId)}
                    >
                      <Text style={doctorStyles.buttonText}>Submit Review</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
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
  }
});
