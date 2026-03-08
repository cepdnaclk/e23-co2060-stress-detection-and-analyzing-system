import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";     

export default function Index() {
  return (
    <View style={styles.container}>

      <Link href= "/(auth)/signup">Signup </Link>
      <Link href= "/(auth)">Login Page </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
  title: {
    color: "blue"
  },
});