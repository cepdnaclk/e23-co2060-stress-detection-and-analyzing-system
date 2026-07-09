import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function PendingRequestsScreen() {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getPendingRequests(token);
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

  const handleAction = async (requestId, action) => {
    try {
      await (action === "accept"
        ? doctorApi.acceptRequest(requestId, token)
        : doctorApi.rejectRequest(requestId, token));
      fetchRequests();
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
          <Text style={doctorStyles.pageTitle}>Pending Requests</Text>
          <Text style={doctorStyles.pageSubtitle}>Review consultation requests sent directly to you.</Text>
        </View>

        {requests.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No pending requests</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request._id} style={doctorStyles.card}>
              <Text style={doctorStyles.cardTitle}>{request.userId?.username ?? "User"}</Text>
              <Text style={doctorStyles.cardSubtitle}>Requested: {new Date(request.requestedAt).toLocaleString()}</Text>
              <Text style={doctorStyles.cardSubtitle}>Reason: {request.reason}</Text>
              <Text style={doctorStyles.cardSubtitle}>Stress level: {request.stressLevel ?? "N/A"}</Text>
              <View style={doctorStyles.buttonRow}>
                <Pressable style={doctorStyles.button} onPress={() => handleAction(request._id, "accept")}>
                  <Text style={doctorStyles.buttonText}>Accept</Text>
                </Pressable>
                <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => handleAction(request._id, "reject")}>
                  <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}
