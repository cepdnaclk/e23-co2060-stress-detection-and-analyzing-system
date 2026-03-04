import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SafeScreen from "../../components/SafeScreen";

export default function RoutineGeneratorScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Routine Generator</Text>
        <Text style={styles.subtitle}>
          This screen will help users generate and manage wellness routines.
        </Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
});
