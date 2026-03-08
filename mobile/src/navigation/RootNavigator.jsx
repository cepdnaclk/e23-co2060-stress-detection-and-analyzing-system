import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/authStore";
import AppDrawer from "./AppDrawer";
import AuthStack from "./AuthStack";

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, token } = useAuthStore();

  const isSignedIn = !!user && !!token;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <RootStack.Screen name="App" component={AppDrawer} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
}
