import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createDrawerNavigator,
  DrawerToggleButton,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import QuestionnaireScreen from "../screens/QuestionnaireScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ClinicalLocatorScreen from "../screens/ClinicalLocatorScreen";
import RoutineGeneratorScreen from "../screens/RoutineGeneratorScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import { useAuthStore } from "../../store/authStore";

const Drawer = createDrawerNavigator();

function renderDrawerIcon(iconName, focused) {
  return (
    <View style={[styles.iconBubble, focused ? styles.iconBubbleActive : styles.iconBubbleInactive]}>
      <Ionicons name={iconName} size={20} color={focused ? "#0b5ea8" : "#5f7f9c"} />
    </View>
  );
}

function CustomDrawerContent(props) {
  return (
    <View style={styles.drawerRoot}>
      <View pointerEvents="none" style={styles.drawerBgLayer}>
        <View style={[styles.drawerBlob, styles.drawerBlobBlue]} />
        <View style={[styles.drawerBlob, styles.drawerBlobTeal]} />
        <View style={[styles.drawerBlob, styles.drawerBlobPink]} />
      </View>

      <View style={styles.drawerPanel}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.drawerScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      </View>
    </View>
  );
}

export default function AppDrawer() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        drawerType: "front",
        drawerStyle: styles.drawerStyle,
        drawerActiveTintColor: "#0b5ea8",
        drawerInactiveTintColor: "#4a667f",
        drawerActiveBackgroundColor: "#d9ecff",
        drawerLabelStyle: styles.drawerLabel,
        drawerItemStyle: styles.drawerItem,
        header: () => (
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
            <View style={styles.spacer} />
          </View>
        ),
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Questionnaire" component={QuestionnaireScreen} />
      <Drawer.Screen name="Clinical Locator" component={ClinicalLocatorScreen} />
      <Drawer.Screen name="Routine Generator" component={RoutineGeneratorScreen} />
      {user?.role === "admin" ? (
        <Drawer.Screen name="Admin" component={AdminDashboardScreen} />
      ) : null}
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerStyle: {
    backgroundColor: "transparent",
    width: 330,
  },
  drawerRoot: {
    flex: 1,
    backgroundColor: "#e5f2ff",
    overflow: "hidden",
  },
  drawerBgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerBlob: {
    position: "absolute",
    borderRadius: 999,
  },
  drawerBlobBlue: {
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: "rgba(113, 194, 255, 0.35)",
  },
  drawerBlobTeal: {
    top: 230,
    left: -90,
    width: 210,
    height: 210,
    backgroundColor: "rgba(129, 226, 219, 0.32)",
  },
  drawerBlobPink: {
    bottom: -80,
    right: -70,
    width: 230,
    height: 230,
    backgroundColor: "rgba(255, 183, 207, 0.3)",
  },
  drawerPanel: {
    flex: 1,
    margin: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#c4def8",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#2a6ca7",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
    overflow: "hidden",
  },
  drawerScrollContent: {
    paddingTop: 18,
    paddingBottom: 24,
  },
  drawerLabel: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    letterSpacing: 0.15,
    marginLeft: -8,
  },
  drawerItem: {
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingVertical: 6,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconBubbleActive: {
    backgroundColor: "#e6f3ff",
    borderColor: "#98c9f6",
  },
  iconBubbleInactive: {
    backgroundColor: "#f2f8ff",
    borderColor: "#d5e8fb",
  },
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
  spacer: {
    flex: 1,
  },
});
