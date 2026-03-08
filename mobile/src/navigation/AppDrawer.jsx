import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createDrawerNavigator, DrawerToggleButton } from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import QuestionnaireScreen from "../screens/QuestionnaireScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ClinicalLocatorScreen from "../screens/ClinicalLocatorScreen";
import RoutineGeneratorScreen from "../screens/RoutineGeneratorScreen";

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <View
            style={[
              styles.headerContainer,
              { paddingTop: insets.top },
            ]}
          >
            <View style={styles.sideContainer}>
              <DrawerToggleButton
                tintColor="#1976D2"
                pressColor="rgba(0,0,0,0.1)"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {options.title !== undefined ? options.title : route.name}
              </Text>
            </View>
            <View style={styles.sideContainer} />
          </View>
        ),
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <Drawer.Screen name="Clinical Locator" component={ClinicalLocatorScreen} />
      <Drawer.Screen name="Routine Generator" component={RoutineGeneratorScreen} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#e3f2fd",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#bbdefb",
  },
  sideContainer: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1976D2",
  },
});
