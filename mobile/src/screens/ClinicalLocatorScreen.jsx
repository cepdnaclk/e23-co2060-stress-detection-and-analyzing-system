import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SafeScreen from "../../components/SafeScreen";

export default function ClinicalLocatorScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Clinical Locator</Text>
        <Text style={styles.subtitle}>
          This screen will help users locate clinical support services.
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
