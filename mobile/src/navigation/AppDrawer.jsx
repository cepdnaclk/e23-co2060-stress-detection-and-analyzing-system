import React from "react";
import { Pressable, Text, View } from "react-native";
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
import ProfileScreen from "../screens/ProfileScreen";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/appdrawer.styles";

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
        header: ({ navigation, route, options }) => {
          const title = options.title ?? route?.name ?? "";
          const showProfileAction = route?.name === "Home";

          return (
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
            <View style={styles.headerTitleContainer}>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {title}
              </Text>
            </View>
            <View style={styles.sideContainerRight}>
              {showProfileAction ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open profile"
                  onPress={() => navigation.navigate("Profile")}
                  style={styles.headerActionButton}
                >
                  <Ionicons name="person-circle-outline" size={30} color="#1976D2" />
                </Pressable>
              ) : null}
            </View>
          </View>
          );
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerIcon: ({ focused }) => renderDrawerIcon("home-outline", focused),
        }}
      />
      <Drawer.Screen
        name="Questionnaire"
        component={QuestionnaireScreen}
        options={{
          drawerIcon: ({ focused }) => renderDrawerIcon("reader-outline", focused),
        }}
      />
      <Drawer.Screen
        name="Clinical Locator"
        component={ClinicalLocatorScreen}
        options={{
          drawerIcon: ({ focused }) => renderDrawerIcon("location-outline", focused),
        }}
      />
      <Drawer.Screen
        name="Routine Generator"
        component={RoutineGeneratorScreen}
        options={{
          drawerIcon: ({ focused }) => renderDrawerIcon("calendar-clear-outline", focused),
        }}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          drawerIcon: ({ focused }) => renderDrawerIcon("log-out-outline", focused),
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          drawerItemStyle: { display: "none" },
          drawerLabel: () => null,
        }}
      />
    </Drawer.Navigator>
  );
}
