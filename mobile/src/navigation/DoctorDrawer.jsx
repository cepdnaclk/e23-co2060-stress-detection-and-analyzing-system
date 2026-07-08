import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createDrawerNavigator,
  DrawerToggleButton,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

import styles from "../../assets/styles/appdrawer.styles";
import DoctorDashboardScreen from "../screens/DoctorDashboardScreen";
import PendingRequestsScreen from "../screens/PendingRequestsScreen";
import CurrentPatientsScreen from "../screens/CurrentPatientsScreen";
import CompletedConsultationsScreen from "../screens/CompletedConsultationsScreen";
import DoctorReviewsScreen from "../screens/DoctorReviewsScreen";
import DoctorProfileSettingsScreen from "../screens/DoctorProfileSettingsScreen";
import AvailabilityScreen from "../screens/AvailabilityScreen";
import LogoutScreen from "../screens/LogoutScreen";

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

export default function DoctorDrawer() {
  const insets = useSafeAreaInsets();

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        drawerType: "front",
        drawerStyle: styles.drawerStyle,
        drawerActiveTintColor: "#0b5ea8",
        drawerInactiveTintColor: "#4a667f",
        drawerActiveBackgroundColor: "#d9ecff",
        drawerLabelStyle: styles.drawerLabel,
        drawerItemStyle: styles.drawerItem,
        header: ({ navigation, route, options }) => {
          const title = options.title ?? route?.name ?? "";

          return (
            <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
              <View style={styles.sideContainer}>
                <DrawerToggleButton tintColor="#1976D2" pressColor="rgba(0,0,0,0.1)" />
              </View>
              <View style={styles.headerTitleContainer}>
                <Text numberOfLines={1} style={styles.headerTitle}>
                  {title}
                </Text>
              </View>
              <View style={styles.sideContainerRight} />
            </View>
          );
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DoctorDashboardScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("speedometer-outline", focused) }}
      />
      <Drawer.Screen
        name="Pending Requests"
        component={PendingRequestsScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("mail-unread-outline", focused) }}
      />
      <Drawer.Screen
        name="Current Patients"
        component={CurrentPatientsScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("people-outline", focused) }}
      />
      <Drawer.Screen
        name="Completed Consultations"
        component={CompletedConsultationsScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("checkmark-done-outline", focused) }}
      />
      <Drawer.Screen
        name="Reviews"
        component={DoctorReviewsScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("star-outline", focused) }}
      />
      <Drawer.Screen
        name="Profile"
        component={DoctorProfileSettingsScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("person-outline", focused) }}
      />
      <Drawer.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("pulse-outline", focused) }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ drawerIcon: ({ focused }) => renderDrawerIcon("log-out-outline", focused) }}
      />
    </Drawer.Navigator>
  );
}
