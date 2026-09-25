/**
 * EmergencyServicesScreen.jsx
 *
 * User-facing Emergency Mental Health Services page.
 * Fetches services dynamically from GET /api/emergency-services.
 * Supports call-to-dial via Linking.openURL("tel:...").
 *
 * Follows the same theme, SafeScreen, BubbleBackground and styling
 * conventions as TherapyHubScreen.jsx.
 */

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import SafeScreen from "../../components/SafeScreen";
import BubbleBackground from "../../components/BubbleBackground";
import { getServices } from "../lib/emergencyServicesApi";

// ─── Theme (matches CareWave blue palette — red kept only for call/badge) ─────
const LIGHT = {
  page: "#eef5fb",
  card: "#ffffff",
  cardFirst: "#f0f7ff",
  text: "#0f2f4c",
  subText: "#537290",
  border: "#d6e5f3",
  accent: "#1f7ed0",       // blue — general UI accent
  accentSoft: "#e3f2fd",
  phone: "#429a8a",        // calm pastel teal for call button
  phoneBg: "#eef9f6",
  badge: "#50ad9c",        // calm pastel teal for primary helpline badge
  badgeText: "#ffffff",
  headerBg: "#0b5ea8",     // matches AppDrawer header blue
  headerText: "#ffffff",
  retryBg: "#1f7ed0",
  retryText: "#ffffff",
  iconBg: "#e3f2fd",
  danger: "#d64545",
};
const DARK = {
  page: "#071528",
  card: "#0d2138",
  cardFirst: "#0f2a44",
  text: "#eaf2ff",
  subText: "#9db8d5",
  border: "#25425f",
  accent: "#5ab0ff",
  accentSoft: "#0f2a44",
  phone: "#6bd1be",        // calm pastel teal for call button
  phoneBg: "#13372f",
  badge: "#5fbfac",        // calm pastel teal for primary helpline badge
  badgeText: "#ffffff",
  headerBg: "#0a2a50",
  headerText: "#eaf2ff",
  retryBg: "#5ab0ff",
  retryText: "#071528",
  iconBg: "#0f2a44",
  danger: "#d64545",
};

// ─── Helper: normalise a contact string for tel: ──────────────────────────────
// Strips em-dash/en-dash range suffixes (e.g. "011 257 8234–7" → "011 257 82347")
// and removes non-numeric characters except leading +.
function normalisePhone(contact) {
  // Remove range suffix: anything after an en/em dash
  const withoutRange = contact.replace(/[\u2013\u2014].*$/, "");
  // Keep digits and leading +
  return withoutRange.replace(/[^\d+]/g, "");
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────
function ServiceCard({ service, isFirst, theme }) {
  const cardBg = isFirst ? theme.cardFirst : theme.card;

  const handleCall = async () => {
    const dialNumber = normalisePhone(service.contact);
    if (!dialNumber) {
      Alert.alert("Cannot dial", "This contact cannot be dialled directly.");
      return;
    }
    const url = `tel:${dialNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Dialler not available", `Please dial ${service.contact} manually.`);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: isFirst ? theme.phone : theme.border,
          borderWidth: isFirst ? 1.5 : 1,
        },
      ]}
    >
      {/* Primary badge for first item (data-driven — not hardcoded by name) */}
      {isFirst && (
        <View style={[styles.badgeRow]}>
          <View style={[styles.badge, { backgroundColor: theme.badge }]}>
            <Ionicons name="star" size={10} color={theme.badgeText} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: theme.badgeText }]}>
              Primary Helpline
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.serviceName, { color: theme.text }]}>{service.serviceName}</Text>

      {/* Contact row — red tint to signal emergency call action */}
      <Pressable
        onPress={handleCall}
        accessibilityRole="button"
        accessibilityLabel={`Call ${service.contact}`}
        style={({ pressed }) => [
          styles.contactRow,
          { backgroundColor: pressed ? theme.accentSoft : 'transparent' },
        ]}
      >
        <View style={[styles.phoneIconWrap, { backgroundColor: theme.phone }]}>
          <Ionicons name="call" size={16} color="#fff" />
        </View>
        <Text style={[styles.contactText, { color: theme.phone }]}>{service.contact}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.phone} style={{ marginLeft: "auto" }} />
      </Pressable>

      <Text style={[styles.description, { color: theme.subText }]}>{service.description}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmergencyServicesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? DARK : LIGHT;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  return (
    <SafeScreen>
      <BubbleBackground />
      <ScrollView
        style={[styles.scroll, { backgroundColor: "transparent" }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchServices(true)} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <Ionicons name="alert-circle" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>
            Emergency Mental Health Services
          </Text>
          <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.88)" }]}>
            If you or someone you know is experiencing a mental-health crisis, these services can provide support and assistance.
          </Text>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.stateText, { color: theme.subText }]}>
              Loading services…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centred}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.subText} />
            <Text style={[styles.stateText, { color: theme.subText }]}>
              Unable to load emergency mental-health services. Please try again.
            </Text>
            <Pressable
              onPress={() => fetchServices()}
              style={[styles.retryBtn, { backgroundColor: theme.retryBg }]}
            >
              <Text style={[styles.retryText, { color: theme.retryText }]}>Retry</Text>
            </Pressable>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.centred}>
            <Ionicons name="information-circle-outline" size={48} color={theme.subText} />
            <Text style={[styles.stateText, { color: theme.subText }]}>
              No emergency mental-health services are currently available.
            </Text>
          </View>
        ) : (
          services.map((svc, index) => (
            <ServiceCard
              key={svc._id}
              service={svc}
              isFirst={index === 0}
              theme={theme}
            />
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgeRow: { marginBottom: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    lineHeight: 22,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  phoneIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
  },

  centred: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 4,
  },
  retryText: { fontSize: 14, fontWeight: "700" },
});
