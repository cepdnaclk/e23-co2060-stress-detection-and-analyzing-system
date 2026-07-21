import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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

export default function MyRequestsScreen() {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingDrafts, setRatingDrafts] = useState({});

  const fetchRequests = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await doctorApi.getMyRequests(token);
      setRequests(data.requests ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const submitRating = async (assignmentId) => {
    const draft = ratingDrafts[assignmentId] ?? { stars: 5, review: "" };

    try {
      await doctorApi.rateDoctor(assignmentId, token, draft.stars, draft.review);
      Alert.alert("Thanks", "Your review was submitted");
      fetchRequests();
    } catch (error) {
      Alert.alert("Rating failed", error.message);
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
      <BubbleBackground variant="subtle" />
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>My Requests</Text>
          <Text style={doctorStyles.pageSubtitle}>
            Track consultation requests and rate completed consultations.
          </Text>
        </View>

        {requests.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No requests yet</Text>
            <Text style={doctorStyles.emptyText}>Request a doctor to see your consultation history here.</Text>
          </View>
        ) : (
          requests.map((request) => {
            const assignmentId = request.assignmentId ?? request.assignment?._id;
            const currentDraft = ratingDrafts[assignmentId] ?? { stars: 5, review: "" };
            const normalizedStatus = String(request.status ?? "").toLowerCase();

            return (
              <View key={request._id} style={doctorStyles.card}>
                <Text style={doctorStyles.cardTitle}>
                  {request.doctorId?.fullName ?? "Doctor"}
                </Text>
                <Text style={doctorStyles.cardSubtitle}>{request.reason}</Text>
                <Text style={doctorStyles.cardSubtitle}>Status: {request.status}</Text>
                {request.stressLevel ? (
                  <Text style={doctorStyles.cardSubtitle}>Stress level: {request.stressLevel}</Text>
                ) : null}

                {normalizedStatus === "pending" ? (
                  <View style={[doctorStyles.card, { borderColor: "#fff3d9" }]}>
                    <Text style={[doctorStyles.cardTitle, { color: "#8a5a00" }]}>Request Pending</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      Your consultation request is pending review by the doctor.
                    </Text>
                  </View>
                ) : null}

                {normalizedStatus === "rejected" ? (
                  <View style={[doctorStyles.card, { borderColor: "#fde8e8" }]}>
                    <Text style={[doctorStyles.cardTitle, { color: "#a23636" }]}>Request Rejected</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      Your consultation request has been rejected by the doctor.
                    </Text>
                  </View>
                ) : null}

                {(normalizedStatus === "accepted" || normalizedStatus === "completed") && request.contactDetails ? (
                  <View style={doctorStyles.card}>
                    <Text style={doctorStyles.cardTitle}>Consultation Accepted</Text>
                    <Text style={doctorStyles.cardSubtitle}>
                      Your consultation request has been accepted. Please contact the doctor using the details below.
                    </Text>
                    <Text style={doctorStyles.cardSubtitle}>Phone: {request.contactDetails.phoneNumber ?? "N/A"}</Text>
                    <Text style={doctorStyles.cardSubtitle}>Email: {request.contactDetails.email ?? "N/A"}</Text>
                  </View>
                ) : null}

                {assignmentId && normalizedStatus === "completed" ? (
                  <View style={doctorStyles.card}>
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
