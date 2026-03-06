import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ClinicalLocatorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clinical Locator</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: "#1976D2" },
});