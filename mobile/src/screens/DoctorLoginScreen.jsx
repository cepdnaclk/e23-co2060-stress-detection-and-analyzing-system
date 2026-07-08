import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import SafeScreen from "../../components/SafeScreen";
import doctorStyles from "../../assets/styles/doctor.styles";
import { useAuthStore } from "../../store/authStore";

export default function DoctorLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoading, doctorLogin } = useAuthStore();

  const handleLogin = async () => {
    const result = await doctorLogin(email.trim(), password);

    if (!result.success) {
      Alert.alert("Login failed", result.error);
      return;
    }

    navigation.reset({ index: 0, routes: [{ name: "App" }] });
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[doctorStyles.scrollContent, { justifyContent: "center", flex: 1 }]}>
          <View style={doctorStyles.heroCard}>
            <Text style={doctorStyles.pageTitle}>Volunteer Doctor Login</Text>
            <Text style={doctorStyles.pageSubtitle}>
              Sign in to manage consultation requests and your profile.
            </Text>
          </View>

          <View style={doctorStyles.card}>
            <Text style={doctorStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="doctor@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={doctorStyles.input}
              placeholderTextColor="#7a8ea6"
            />

            <Text style={doctorStyles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              style={doctorStyles.input}
              placeholderTextColor="#7a8ea6"
            />

            <Pressable style={doctorStyles.button} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={doctorStyles.buttonText}>Login</Text>}
            </Pressable>

            <Pressable onPress={() => navigation.goBack()}>
              <Text style={[doctorStyles.cardSubtitle, { textAlign: "center" }]}>Back to user login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
