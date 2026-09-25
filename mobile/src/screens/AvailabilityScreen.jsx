import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View, ScrollView, TextInput, StyleSheet } from "react-native";

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
export default function AvailabilityScreen() {
  const { user, token } = useAuthStore();
  const [generalStatus, setGeneralStatus] = useState(user?.availability ?? "available");
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // ID of the slot being edited or 'new'
  const dates = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(dates[0].dateStr);
  const [editForm, setEditForm] = useState({ startTime: "09:00", endTime: "12:00", slotDuration: "30" });

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      const res = await doctorApi.getDoctorAvailability(user.id || user._id);
      setWeeklyAvailability(res.availability || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const updateGeneralStatus = async (nextAvailability) => {
    setIsLoading(true);
    try {
      const data = await doctorApi.updateAvailability(token, nextAvailability);
      setGeneralStatus(data.availability);
      useAuthStore.setState({ user: { ...user, availability: data.availability } });
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    setIsLoading(true);
    try {
      if (isEditing === "new") {
        await doctorApi.createDoctorAvailability(token, {
          ...editForm,
          date: selectedDate,
          slotDuration: parseInt(editForm.slotDuration, 10),
        });
      } else {
        await doctorApi.updateDoctorAvailability(token, isEditing, {
          ...editForm,
          date: selectedDate,
          slotDuration: parseInt(editForm.slotDuration, 10),
        });
      }
      setIsEditing(null);
      await fetchAvailability();
    } catch (error) {
      Alert.alert("Error saving availability", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    setIsLoading(true);
    try {
      await doctorApi.deleteDoctorAvailability(token, id);
      await fetchAvailability();
    } catch (error) {
      Alert.alert("Error deleting availability", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={doctorStyles.scrollContent}>
        <View style={doctorStyles.heroCard}>
          <Text style={doctorStyles.pageTitle}>Availability</Text>
          <Text style={doctorStyles.pageSubtitle}>Manage your weekly schedule.</Text>
        </View>

        <View style={doctorStyles.card}>
          <Text style={doctorStyles.cardTitle}>Global Status: {generalStatus}</Text>
          <View style={doctorStyles.buttonRow}>
            <Pressable
              style={doctorStyles.button}
              onPress={() => updateGeneralStatus("available")}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={doctorStyles.buttonText}>Available</Text>}
            </Pressable>
            <Pressable
              style={[doctorStyles.button, doctorStyles.secondaryButton]}
              onPress={() => updateGeneralStatus("unavailable")}
              disabled={isLoading}
            >
              <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Unavailable</Text>
            </Pressable>
          </View>
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
          <View style={styles.headerRow}>
             <Text style={doctorStyles.cardTitle}>Daily Schedule</Text>
             {!isEditing && (
                <Pressable onPress={() => { setIsEditing("new"); setEditForm({ startTime: "09:00", endTime: "12:00", slotDuration: "30" }); }}>
                   <Text style={styles.addText}>+ Add Period</Text>
                </Pressable>
             )}
          </View>

          {isEditing && (
            <View style={styles.editForm}>
              <Text style={styles.label}>Start Time (HH:mm)</Text>
              <TextInput style={styles.input} value={editForm.startTime} onChangeText={t => setEditForm({...editForm, startTime: t})} placeholder="09:00" />
              
              <Text style={styles.label}>End Time (HH:mm)</Text>
              <TextInput style={styles.input} value={editForm.endTime} onChangeText={t => setEditForm({...editForm, endTime: t})} placeholder="12:00" />
              
              <Text style={styles.label}>Slot Duration (mins)</Text>
              <TextInput style={styles.input} value={String(editForm.slotDuration)} onChangeText={t => setEditForm({...editForm, slotDuration: t})} placeholder="30" keyboardType="numeric" />

              <View style={doctorStyles.buttonRow}>
                <Pressable style={doctorStyles.button} onPress={handleSaveSlot} disabled={isLoading}>
                   {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={doctorStyles.buttonText}>Save</Text>}
                </Pressable>
                <Pressable style={[doctorStyles.button, doctorStyles.secondaryButton]} onPress={() => setIsEditing(null)} disabled={isLoading}>
                   <Text style={[doctorStyles.buttonText, doctorStyles.secondaryButtonText]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!isEditing && (() => {
             const daySlots = weeklyAvailability.filter(a => a.date === selectedDate);
             return (
               <View style={styles.dayContainer}>
                 {daySlots.length === 0 ? (
                   <Text style={styles.unavailableText}>No availability set for this date.</Text>
                 ) : (
                   daySlots.map(slot => (
                     <View key={slot._id} style={styles.slotRow}>
                       <Text style={styles.slotText}>{slot.startTime} ───── {slot.endTime}</Text>
                       <View style={styles.slotActions}>
                         <Pressable onPress={() => { setIsEditing(slot._id); setEditForm({ startTime: slot.startTime, endTime: slot.endTime, slotDuration: String(slot.slotDuration) }); }}>
                           <Text style={styles.actionText}>[Edit]</Text>
                         </Pressable>
                         <Pressable onPress={() => handleDeleteSlot(slot._id)}>
                           <Text style={styles.actionTextDel}>[Remove]</Text>
                         </Pressable>
                       </View>
                     </View>
                   ))
                 )}
               </View>
             )
          })()}

        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addText: {
    color: '#0b5ea8',
    fontWeight: 'bold'
  },
  editForm: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  dayContainer: {
    marginTop: 15,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  unavailableText: {
    color: '#999',
    fontStyle: 'italic',
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f8ff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  slotText: {
    fontSize: 14,
    color: '#333',
  },
  slotActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionText: {
    color: '#0b5ea8',
    fontSize: 12,
  },
  actionTextDel: {
    color: '#d9534f',
    fontSize: 12,
  }
});
