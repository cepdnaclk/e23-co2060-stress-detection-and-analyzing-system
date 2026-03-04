import { View, StyleSheet } from "react-native";
import COLORS from "../constants/colors";

export default function SafeScreen({ children }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
