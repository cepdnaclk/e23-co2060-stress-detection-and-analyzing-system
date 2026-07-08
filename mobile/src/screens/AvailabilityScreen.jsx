import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

export default function AvailabilityScreen() {
  const { user, token } = useAuthStore();
  const [availability, setAvailability] = useState(user?.availability ?? "available");
  const [isLoading, setIsLoading] = useState(false);

  const updateAvailability = async (nextAvailability) => {
    setIsLoading(true);
    try {
      const data = await doctorApi.updateAvailability(token, nextAvailability);
      setAvailability(data.availability);
      useAuthStore.setState({ user: { ...user, availability: data.availability } });
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen>
      <View style={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Availability</Text>
          <Text style={doctorStyles.pageSubtitle}>Switch between available and unavailable modes.</Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Current status: {availability}</Text>
          <View style={doctorStyles.buttonRow}>
            <Pressable
              style={doctorStyles.button}
              onPress={() => updateAvailability("available")}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={doctorStyles.buttonText}>Available</Text>}
            </Pressable>
            <Pressable
              style={[doctorStyles.button, doctorStyles.secondaryButton]}
              onPress={() => updateAvailability("unavailable")}
              disabled={isLoading}
            >
              <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Unavailable</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeScreen>
  );
}
