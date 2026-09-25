import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";
import { API_URL, fetchWithTimeout } from "../../constants/api";

export default function DoctorProfileSettingsScreen() {
  const { user, token } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [biography, setBiography] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhoneNumber(user?.phoneNumber ?? "");
    setProfilePicture(user?.profilePicture ?? "");
    setQualifications(user?.qualifications ?? "");
    setSpecialization(user?.specialization ?? "");
    setHospital(user?.hospital ?? "");
    setYearsOfExperience(user?.yearsOfExperience ? String(user.yearsOfExperience) : "");
    setLanguages(Array.isArray(user?.languages) ? user.languages.join(", ") : "");
    setBiography(user?.biography ?? "");
    checkCalendarStatus();
  }, [user]);

  const checkCalendarStatus = async () => {
    setIsCheckingCalendar(true);
    try {
      const response = await fetchWithTimeout(`${API_URL}/calendar/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsCalendarConnected(data.connected);
      }
    } catch (error) {
      console.log("Could not fetch calendar status", error);
    } finally {
      setIsCheckingCalendar(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/calendar/auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.url) {
        await WebBrowser.openAuthSessionAsync(data.url);
        checkCalendarStatus();
      } else {
        Alert.alert("Connection Failed", "Could not get authorization URL.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to Google Calendar.");
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.updateDoctorProfile(token, {
        fullName,
        phoneNumber,
        profilePicture,
        qualifications,
        specialization,
        hospital,
        yearsOfExperience: yearsOfExperience.trim() ? Number(yearsOfExperience) : undefined,
        languages: languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        biography,
      });

      useAuthStore.setState({
        user: { ...data.doctor, role: "volunteer_doctor" },
      });
      Alert.alert("Saved", "Your profile was updated");
    } catch (error) {
      Alert.alert("Save failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Profile Settings</Text>
          <Text style={doctorStyles.pageSubtitle}>Update your public doctor profile information.</Text>
        </View>

        <View style={doctorStyles.card}>
          {[
            ["Full name", fullName, setFullName],
            ["Phone number", phoneNumber, setPhoneNumber],
            ["Profile picture URL", profilePicture, setProfilePicture],
            ["Qualifications", qualifications, setQualifications],
            ["Specialization", specialization, setSpecialization],
            ["Hospital / Organization", hospital, setHospital],
            ["Years of experience", yearsOfExperience, setYearsOfExperience],
            ["Languages", languages, setLanguages],
          ].map(([label, value, setter]) => (
            <View key={label} style={{ gap: 6 }}>
              <Text style={doctorStyles.label}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={setter}
                style={doctorStyles.input}
                placeholder={label}
                placeholderTextColor="#7a8ea6"
              />
            </View>
          ))}

          <View style={{ gap: 6 }}>
            <Text style={doctorStyles.label}>Biography</Text>
            <TextInput
              value={biography}
              onChangeText={setBiography}
              multiline
              style={[doctorStyles.input, doctorStyles.multiLineInput]}
              placeholder="Short biography"
              placeholderTextColor="#7a8ea6"
            />
          </View>

          <View style={{ gap: 6, marginVertical: 10 }}>
            <Text style={doctorStyles.label}>Google Calendar Integration</Text>
            {isCheckingCalendar ? (
              <ActivityIndicator size="small" />
            ) : isCalendarConnected ? (
              <View style={{ backgroundColor: '#d1e7dd', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#0f5132', fontWeight: 'bold' }}>✅ Google Calendar Connected</Text>
              </View>
            ) : (
              <Pressable 
                style={{ backgroundColor: '#4285F4', padding: 12, borderRadius: 8, alignItems: 'center' }} 
                onPress={connectGoogleCalendar}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>🗓 Connect Google Calendar</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={doctorStyles.button} onPress={saveProfile} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={doctorStyles.buttonText}>Save Profile</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
