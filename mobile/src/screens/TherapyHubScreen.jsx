import React from "react";
import { View } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/therapy_hub.styles";

export default function TherapyHubScreen() {
  return (
    <SafeScreen>
      <View style={styles.container} />
    </SafeScreen>
  );
}