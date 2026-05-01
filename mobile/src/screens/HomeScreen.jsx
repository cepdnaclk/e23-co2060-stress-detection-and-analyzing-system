import React from "react";
import { View, Text, ImageBackground } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import styles from "../../assets/styles/home.styles";

const wallpaper = require("../../assets/images/home-wallpaper-01.jpg")

export default function HomeScreen() {
  return (
    <SafeScreen>
      <ImageBackground source={wallpaper} style={styles.container} resizeMode="cover">
        <View style={styles.wallpaperOverlay}>
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>Welcome to Carewave</Text>
          </View>
        </View>
      </ImageBackground>
    </SafeScreen>
  );
}
