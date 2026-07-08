import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

function renderStars(value) {
  return Array.from({ length: 5 }, (_, index) => (
    <Ionicons key={index} name={index < value ? "star" : "star-outline"} size={16} color="#f5a524" />
  ));
}

export default function DoctorReviewsScreen() {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getDoctorReviews(token);
      setReviews(data.reviews ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
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
          <Text style={doctorStyles.pageTitle}>Reviews</Text>
          <Text style={doctorStyles.pageSubtitle}>Feedback from completed consultations.</Text>
        </View>

        {reviews.length === 0 ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.emptyTitle}>No reviews yet</Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review._id} style={doctorStyles.card}>
              <Text style={doctorStyles.cardTitle}>{review.userId?.username ?? "User"}</Text>
              <View style={doctorStyles.starRow}>{renderStars(review.stars)}</View>
              <Text style={doctorStyles.cardSubtitle}>{review.review || "No written review."}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}
