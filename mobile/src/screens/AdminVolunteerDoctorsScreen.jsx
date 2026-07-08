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

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  profilePicture: "",
  qualifications: "",
  specialization: "",
  hospital: "",
  yearsOfExperience: "",
  languages: "",
  biography: "",
};

export default function AdminVolunteerDoctorsScreen() {
  const { token } = useAuthStore();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDoctors = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const data = await doctorApi.getAdminDoctors(token);
      setDoctors(data.doctors ?? []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const fillFormForEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setForm({
      fullName: doctor.fullName ?? "",
      email: doctor.email ?? "",
      password: "",
      phoneNumber: doctor.phoneNumber ?? "",
      profilePicture: doctor.profilePicture ?? "",
      qualifications: doctor.qualifications ?? "",
      specialization: doctor.specialization ?? "",
      hospital: doctor.hospital ?? "",
      yearsOfExperience: doctor.yearsOfExperience ? String(doctor.yearsOfExperience) : "",
      languages: Array.isArray(doctor.languages) ? doctor.languages.join(", ") : "",
      biography: doctor.biography ?? "",
    });
  };

  const clearForm = () => {
    setSelectedDoctor(null);
    setForm(emptyForm);
    setStats(null);
    setReviews([]);
  };

  const saveDoctor = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      Alert.alert("Missing info", "Please fill the required fields");
      return;
    }

    if (!selectedDoctor && (!form.qualifications.trim() || !form.specialization.trim() || !form.hospital.trim() || !form.yearsOfExperience.trim())) {
      Alert.alert("Missing info", "Please fill qualifications, specialization, hospital, and years of experience");
      return;
    }

    if (!selectedDoctor && !form.password.trim()) {
      Alert.alert("Missing info", "Password is required for new doctors");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      profilePicture: form.profilePicture.trim(),
      qualifications: form.qualifications.trim(),
      specialization: form.specialization.trim(),
      hospital: form.hospital.trim(),
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      languages: form.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      biography: form.biography.trim(),
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (selectedDoctor) {
        await doctorApi.updateDoctor(token, selectedDoctor._id, payload);
      } else {
        await doctorApi.createDoctor(token, payload);
      }

      clearForm();
      fetchDoctors();
    } catch (error) {
      Alert.alert("Save failed", error.message);
    }
  };

  const toggleDoctorStatus = async (doctor) => {
    try {
      if (doctor.accountStatus === "active") {
        await doctorApi.deactivateDoctor(token, doctor._id);
      } else {
        await doctorApi.activateDoctor(token, doctor._id);
      }
      fetchDoctors();
    } catch (error) {
      Alert.alert("Action failed", error.message);
    }
  };

  const removeDoctor = async (doctor) => {
    Alert.alert("Delete doctor", `Delete ${doctor.fullName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await doctorApi.deleteDoctor(token, doctor._id);
            fetchDoctors();
          } catch (error) {
            Alert.alert("Delete failed", error.message);
          }
        },
      },
    ]);
  };

  const loadStats = async (doctor) => {
    try {
      const data = await doctorApi.getDoctorStatistics(doctor._id, token);
      setSelectedDoctor(doctor);
      setStats(data.statistics);
      setReviews(data.recentReviews ?? []);
    } catch (error) {
      Alert.alert("Stats failed", error.message);
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
          <Text style={doctorStyles.pageTitle}>Volunteer Doctor Management</Text>
          <Text style={doctorStyles.pageSubtitle}>
            Create doctors, manage account status, and inspect consultation metrics.
          </Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>{selectedDoctor ? "Edit Doctor" : "Add Doctor"}</Text>
          {[
            ["Full name", "fullName"],
            ["Email", "email"],
            ["Password", "password"],
            ["Phone number", "phoneNumber"],
            ["Profile picture URL", "profilePicture"],
            ["Qualifications", "qualifications"],
            ["Specialization", "specialization"],
            ["Hospital / Organization", "hospital"],
            ["Years of experience", "yearsOfExperience"],
            ["Languages", "languages"],
          ].map(([label, key]) => (
            <View key={key} style={{ gap: 6 }}>
              <Text style={doctorStyles.label}>{label}</Text>
              <TextInput
                value={form[key]}
                onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
                style={doctorStyles.input}
                placeholder={label}
                placeholderTextColor="#7a8ea6"
                secureTextEntry={key === "password"}
              />
            </View>
          ))}

          <View style={{ gap: 6 }}>
            <Text style={doctorStyles.label}>Biography</Text>
            <TextInput
              value={form.biography}
              onChangeText={(value) => setForm((current) => ({ ...current, biography: value }))}
              multiline
              style={[doctorStyles.input, doctorStyles.multiLineInput]}
              placeholder="Biography"
              placeholderTextColor="#7a8ea6"
            />
          </View>

          <View style={doctorStyles.buttonRow}>
            <Pressable style={doctorStyles.button} onPress={saveDoctor}>
              <Text style={doctorStyles.buttonText}>{selectedDoctor ? "Update Doctor" : "Create Doctor"}</Text>
            </Pressable>
            <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={clearForm}>
              <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Clear</Text>
            </Pressable>
          </View>
        </View>

        {selectedDoctor ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.cardTitle}>Selected Doctor</Text>
            <Text style={doctorStyles.cardSubtitle}>{selectedDoctor.fullName}</Text>
            <Text style={doctorStyles.cardSubtitle}>Status: {selectedDoctor.accountStatus}</Text>
            <Text style={doctorStyles.cardSubtitle}>Availability: {selectedDoctor.availability}</Text>
            <View style={doctorStyles.buttonRow}>
              <Pressable style={doctorStyles.button} onPress={() => toggleDoctorStatus(selectedDoctor)}>
                <Text style={doctorStyles.buttonText}>
                  {selectedDoctor.accountStatus === "active" ? "Deactivate" : "Activate"}
                </Text>
              </Pressable>
              <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => loadStats(selectedDoctor)}>
                <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>View Stats</Text>
              </Pressable>
              <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => removeDoctor(selectedDoctor)}>
                <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {stats ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.cardTitle}>Statistics</Text>
            <Text style={doctorStyles.cardSubtitle}>Average rating: {stats.averageRating ?? 0}</Text>
            <Text style={doctorStyles.cardSubtitle}>Total reviews: {stats.totalReviews ?? 0}</Text>
            <Text style={doctorStyles.cardSubtitle}>Total patients: {stats.totalPatients ?? 0}</Text>
            <Text style={doctorStyles.cardSubtitle}>Completed consultations: {stats.completedConsultations ?? 0}</Text>
            <Text style={doctorStyles.cardSubtitle}>Active patients: {stats.activePatients ?? 0}</Text>
          </View>
        ) : null}

        {reviews.length ? (
          <View style={doctorStyles.card}>
            <Text style={doctorStyles.cardTitle}>Recent Reviews</Text>
            {reviews.map((review) => (
              <View key={review._id} style={doctorStyles.card}>
                <Text style={doctorStyles.cardSubtitle}>{review.userId?.username ?? "User"}</Text>
                <Text style={doctorStyles.cardSubtitle}>Stars: {review.stars}</Text>
                <Text style={doctorStyles.cardSubtitle}>{review.review || "No written review."}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Registered Doctors</Text>
          {doctors.length === 0 ? (
            <Text style={doctorStyles.cardSubtitle}>No doctors registered.</Text>
          ) : (
            doctors.map((doctor) => (
              <View key={doctor._id} style={doctorStyles.card}>
                <View style={doctorStyles.row}>
                  {doctor.profilePicture ? (
                    <Image source={{ uri: doctor.profilePicture }} style={doctorStyles.avatarSmall} />
                  ) : (
                    <View style={doctorStyles.avatarSmall} />
                  )}
                  <View style={doctorStyles.column}>
                    <Text style={doctorStyles.cardTitle}>{doctor.fullName}</Text>
                    <Text style={doctorStyles.cardSubtitle}>{doctor.specialization}</Text>
                    <Text style={doctorStyles.cardSubtitle}>{doctor.hospital}</Text>
                    <Text style={doctorStyles.cardSubtitle}>Status: {doctor.accountStatus}</Text>
                  </View>
                </View>
                <View style={doctorStyles.buttonRow}>
                  <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => fillFormForEdit(doctor)}>
                    <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Edit</Text>
                  </Pressable>
                  <Pressable style={doctorStyles.button} onPress={() => toggleDoctorStatus(doctor)}>
                    <Text style={doctorStyles.buttonText}>
                      {doctor.accountStatus === "active" ? "Deactivate" : "Activate"}
                    </Text>
                  </Pressable>
                  <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => loadStats(doctor)}>
                    <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Stats / Reviews</Text>
                  </Pressable>
                  <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => removeDoctor(doctor)}>
                    <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
