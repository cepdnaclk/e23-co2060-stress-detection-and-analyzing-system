import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet
} from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";
import { doctorApi } from "../lib/doctorApi";

// Generate next 7 days for the date picker
const getNext7Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // Format YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Format label e.g., "Mon, Sep 28"
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    
    dates.push({ dateStr, label });
  }
  return dates;
};

export default function AppointmentBookingScreen({ route, navigation }) {
  const doctorId = route?.params?.doctorId;
  const doctorName = route?.params?.doctorName || "Doctor";
  const { token } = useAuthStore();
  
  const dates = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(dates[0].dateStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSlots = async (date) => {
    setIsLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      // doctorApi.getAvailableSlots doesn't exist yet, I'll add it
      const res = await doctorApi.getAvailableSlots(doctorId, date);
      setSlots(res.slots || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, doctorId]);

  const handleBooking = async () => {
    if (!selectedSlot) {
      Alert.alert("Missing info", "Please select an available time slot");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Missing info", "Please enter a consultation reason");
      return;
    }
    if (!token) {
      Alert.alert("Login required", "Please login to request an appointment");
      return;
    }

    setIsSubmitting(true);
    try {
      // In Phase 6 we create the actual endpoint, but for now we route to the old request consultation or placeholder
      // We'll prepare it to call the new API (which we will create in Phase 6).
      // For now, I'll just use the old API but we'll change it in Phase 6.
      // Or we can mock the new API endpoint here and just alert "To be implemented in Phase 6" if it fails.
      // Since Phase 5 is purely UI, we can just call it and catch the error cleanly.
      await doctorApi.createAppointment(token, {
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim()
      });
      Alert.alert("Success", "Appointment requested successfully");
      navigation.navigate("My Appointments");
    } catch (error) {
      Alert.alert("Request failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Book Appointment</Text>
          <Text style={doctorStyles.pageSubtitle}>with {doctorName}</Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {dates.map((d) => (
              <Pressable
                key={d.dateStr}
                onPress={() => setSelectedDate(d.dateStr)}
                style={[styles.dateChip, selectedDate === d.dateStr && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipText, selectedDate === d.dateStr && styles.dateChipTextActive]}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Available Times</Text>
          {isLoadingSlots ? (
            <ActivityIndicator size="small" />
          ) : slots.length === 0 ? (
            <Text style={doctorStyles.cardSubtitle}>No availability on this date.</Text>
          ) : (
            <View style={styles.slotGrid}>
              {slots.map((slot, index) => (
                <Pressable
                  key={index}
                  onPress={() => slot.available && setSelectedSlot(slot)}
                  style={[
                    styles.slotChip,
                    !slot.available && styles.slotChipDisabled,
                    selectedSlot === slot && styles.slotChipActive
                  ]}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.slotChipText,
                    !slot.available && styles.slotChipTextDisabled,
                    selectedSlot === slot && styles.slotChipTextActive
                  ]}>
                    {slot.startTime} {slot.available ? "" : "(Booked)"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Consultation Reason</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Tell the doctor why you need help"
            placeholderTextColor="#7a8ea6"
            multiline
            style={[doctorStyles.input, doctorStyles.multiLineInput]}
          />
        </View>

        <Pressable
          style={[doctorStyles.button, (!selectedSlot || isSubmitting) ? { opacity: 0.7 } : null]}
          onPress={handleBooking}
          disabled={!selectedSlot || isSubmitting}
        >
          <Text style={doctorStyles.buttonText}>
            {isSubmitting ? "Submitting..." : "Submit Appointment"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  dateScroll: {
    gap: 10,
    paddingVertical: 10,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f8ff',
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  dateChipActive: {
    backgroundColor: '#0b5ea8',
    borderColor: '#0b5ea8',
  },
  dateChipText: {
    color: '#0b5ea8',
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0b5ea8',
    backgroundColor: '#fff',
  },
  slotChipActive: {
    backgroundColor: '#0b5ea8',
  },
  slotChipDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  slotChipText: {
    color: '#0b5ea8',
    fontWeight: '500',
  },
  slotChipTextActive: {
    color: '#fff',
  },
  slotChipTextDisabled: {
    color: '#aaa',
    textDecorationLine: 'line-through'
  }
});
