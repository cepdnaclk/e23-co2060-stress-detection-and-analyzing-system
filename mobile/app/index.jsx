import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";     // added by dinithi

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>helloooo</Text>
      {/* <Image source={} ></Image> */}

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