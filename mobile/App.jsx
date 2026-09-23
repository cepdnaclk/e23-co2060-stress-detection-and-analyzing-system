import { useEffect } from "react";
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";

import SafeScreen from "./components/SafeScreen";
import { useAuthStore } from "./store/authStore";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  const { checkAuth } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    "JetBrainsMono-Medium": require("./assets/fonts/JetBrainsMono-Medium.ttf"),
    "SpaceMono-Regular": require("./assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    checkAuth();

    return () => clearTimeout(timer);
  }, [checkAuth]);

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

registerRootComponent(App);