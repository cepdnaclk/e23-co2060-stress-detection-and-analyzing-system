import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

/**
 * Animated shimmer skeleton placeholder block.
 * Usage: <SkeletonBlock width={120} height={16} borderRadius={8} />
 */
export default function SkeletonBlock({ width = "100%", height = 16, borderRadius = 8, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: "#9cb8d4" },
});
