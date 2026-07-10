import { SplashScreen } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

import RootNavigator from "../src/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
    "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) {
        console.warn("Font loading error:", fontError);
      }
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    checkAuth();

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <RootNavigator />
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
