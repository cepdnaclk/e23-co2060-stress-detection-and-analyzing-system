import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../../store/authStore";
import AppDrawer from "./AppDrawer";
import AuthStack from "./AuthStack";
import DoctorDrawer from "./DoctorDrawer";

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, token } = useAuthStore();

  const isSignedIn = !!user && !!token;
  const role = user?.role;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        role === "volunteer_doctor" ? (
          <RootStack.Screen name="App" component={DoctorDrawer} />
        ) : (
          <RootStack.Screen name="App" component={AppDrawer} />
        )
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
}
