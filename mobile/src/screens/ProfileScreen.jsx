import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import SafeScreen from "../../components/SafeScreen";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/profile.styles";

export default function ProfileScreen() {
  const { user, isLoading, updateProfile } = useAuthStore();

  const initialValues = useMemo(
    () => ({
      username: user?.username ?? "",
      age: user?.age ? String(user.age) : "",
      gender: user?.gender ?? "",
    }),
    [user]
  );

  const [username, setUsername] = useState(initialValues.username);
  const [age, setAge] = useState(initialValues.age);
  const [gender, setGender] = useState(initialValues.gender);

  const onSave = async () => {
    const payload = {
      username: username.trim(),
      age: age.trim() === "" ? undefined : Number(age),
      gender: gender.trim(),
    };

    const result = await updateProfile(payload);

    if (!result.success) {
      Alert.alert("Update failed", result.error || "Something went wrong");
      return;
    }

    Alert.alert("Saved", "Your profile was updated");
  };

  if (!user) {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Not signed in</Text>
          <Text style={styles.emptyText}>Please login to view your profile.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your details</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            autoCapitalize="none"
            placeholder="Enter username"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter age"
          />

          <Text style={styles.label}>Gender</Text>
          <TextInput
            value={gender}
            onChangeText={setGender}
            style={styles.input}
            autoCapitalize="none"
            placeholder="Enter gender"
          />

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onSave}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
                isLoading ? styles.primaryButtonDisabled : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
