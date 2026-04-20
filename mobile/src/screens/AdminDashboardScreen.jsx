import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SafeScreen from "../../components/SafeScreen";

export default function AdminDashboardScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>
          Manage users and view system overview.
        </Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b3a5a",
  },
  subtitle: {
    fontSize: 15,
    color: "#37506a",
  },
});
