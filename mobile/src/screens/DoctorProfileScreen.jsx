import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => (
    <Ionicons
      key={index}
      name={index < Math.round(value) ? "star" : "star-outline"}
      size={18}
      color="#f5a524"
    />
  ));
}

export default function DoctorProfileScreen({ route, navigation }) {
  const doctorId = route?.params?.doctorId;
  const { token } = useAuthStore();
  const [doctor, setDoctor] = useState(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = async () => {
    if (!doctorId) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await doctorApi.getDoctorProfile(doctorId);
      setDoctor(data.doctor ?? null);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [doctorId]);

  const navigateToBooking = () => {
    if (!token) {
      Alert.alert("Login required", "Please login to book an appointment");
      return;
    }
    navigation.navigate("Appointment Booking", { doctorId, doctorName: doctor.fullName });
  };

  if (isLoading || !doctor) {
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
          <View style={doctorStyles.row}>
            {doctor.profilePicture ? (
              <Image source={{ uri: doctor.profilePicture }} style={doctorStyles.avatar} />
            ) : (
              <View style={doctorStyles.avatar} />
            )}
            <View style={doctorStyles.column}>
              <Text style={doctorStyles.pageTitle}>{doctor.fullName}</Text>
              <Text style={doctorStyles.pageSubtitle}>{doctor.qualifications}</Text>
              <Text style={doctorStyles.pageSubtitle}>{doctor.hospital}</Text>
            </View>
          </View>

          <View style={doctorStyles.row}>
            <View style={doctorStyles.chip}>
              <Text style={doctorStyles.chipText}>{doctor.specialization}</Text>
            </View>
            <View style={doctorStyles.chip}>
              <Text style={doctorStyles.chipText}>{doctor.yearsOfExperience} years</Text>
            </View>
            <View
              style={[
                doctorStyles.chip,
                doctor.availability === "available"
                  ? doctorStyles.chipSuccess
                  : doctorStyles.chipWarning,
              ]}
            >
              <Text
                style={[
                  doctorStyles.chipText,
                  doctor.availability === "available"
                    ? doctorStyles.chipTextSuccess
                    : doctorStyles.chipTextWarning,
                ]}
              >
                {doctor.availability}
              </Text>
            </View>
          </View>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>About</Text>
          <Text style={doctorStyles.cardSubtitle}>{doctor.biography || "No biography added yet."}</Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Details</Text>
          <Text style={doctorStyles.cardSubtitle}>Languages: {doctor.languages?.join(", ") || "N/A"}</Text>
          <Text style={doctorStyles.cardSubtitle}>Average rating: {doctor.averageRating?.toFixed?.(1) ?? doctor.averageRating ?? 0}</Text>
          <Text style={doctorStyles.cardSubtitle}>Reviews: {doctor.reviewCount ?? doctor.totalReviews ?? 0}</Text>
          <Text style={doctorStyles.cardSubtitle}>Patients: {doctor.patientCount ?? doctor.totalPatients ?? 0}</Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Book Appointment</Text>
          <Text style={doctorStyles.cardSubtitle}>Select a date and time that works best for you.</Text>
          <Pressable
            style={doctorStyles.button}
            onPress={navigateToBooking}
          >
            <Text style={doctorStyles.buttonText}>
              View Availability & Book
            </Text>
          </Pressable>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Recent Reviews</Text>
          {doctor.recentReviews?.length ? (
            doctor.recentReviews.map((review) => (
              <View key={review._id} style={doctorStyles.card}>
                <View style={doctorStyles.row}>
                  <View style={doctorStyles.column}>
                    <Text style={doctorStyles.cardSubtitle}>{review.userId?.username ?? "Anonymous"}</Text>
                    <View style={doctorStyles.starRow}>{renderStars(review.stars)}</View>
                  </View>
                </View>
                <Text style={doctorStyles.cardSubtitle}>{review.review || "No written review."}</Text>
              </View>
            ))
          ) : (
            <Text style={doctorStyles.cardSubtitle}>No reviews yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
