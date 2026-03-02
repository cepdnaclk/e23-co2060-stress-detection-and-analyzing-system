import React from "react";
import { View, Text } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/home.styles";

export default function HomeScreen() {
  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          Welcome to Carewave
        </Text>
      </View>
    </SafeScreen>
  );
}
