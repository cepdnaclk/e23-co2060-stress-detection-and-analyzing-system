import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SkeletonBlock from "./SkeletonBlock";

const LIGHT = { card: "#ffffff", text: "#0f2f4c", subText: "#537290", border: "#d6e5f3" };
const DARK  = { card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5", border: "#25425f" };

/**
 * Stat card showing an icon, title, value, and optional delta indicator.
 */
export default function StatCard({ title, value, icon, iconColor, delta, loading, isDark, width }) {
  const theme = isDark ? DARK : LIGHT;

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, width }]}>
        <SkeletonBlock width={40} height={40} borderRadius={12} />
        <SkeletonBlock width="72%" height={13} style={{ marginTop: 10 }} />
        <SkeletonBlock width="55%" height={24} style={{ marginTop: 6 }} />
      </View>
    );
  }

  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const deltaColor = isPositive ? "#2dba87" : isNegative ? "#ef5b5b" : theme.subText;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, width }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + "28" }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: theme.subText }]} numberOfLines={2}>{title}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      {delta !== 0 && delta !== undefined && (
        <View style={styles.deltaRow}>
          <Ionicons
            name={isPositive ? "trending-up-outline" : "trending-down-outline"}
            size={13}
            color={deltaColor}
          />
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {" "}{Math.abs(delta)} this month
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    shadowColor: "#0d2b43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deltaText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
