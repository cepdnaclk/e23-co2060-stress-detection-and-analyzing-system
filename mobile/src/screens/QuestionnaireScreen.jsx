import React from "react";
import { View, Text } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/question.styles";

export default function QuestionnaireScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>DASS-21</Text>
        <Text style={styles.subtitle}>
          Please go through the following questions and select the option that best describes how you have been feeling over the past week.
        </Text>
      </View>
    </SafeScreen>
  );
}


