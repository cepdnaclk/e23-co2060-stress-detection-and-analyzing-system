import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/logout.styles";

export default function LogoutScreen() {
  const navigation = useNavigation();
  const { logout } = useAuthStore();
  const buttonPulse = useRef(new Animated.Value(1)).current;
  const shineX = useRef(new Animated.Value(-220)).current;
  const blobOneFloat = useRef(new Animated.Value(0)).current;
  const blobTwoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.04,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const shineLoop = Animated.loop(
      Animated.timing(shineX, {
        toValue: 260,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const blobOneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobOneFloat, {
          toValue: -12,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobOneFloat, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const blobTwoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blobTwoFloat, {
          toValue: 10,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobTwoFloat, {
          toValue: -6,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    shineLoop.start();
    blobOneLoop.start();
    blobTwoLoop.start();

    return () => {
      pulseLoop.stop();
      shineLoop.stop();
      blobOneLoop.stop();
      blobTwoLoop.stop();
      shineX.setValue(-220);
    };
  }, [blobOneFloat, blobTwoFloat, buttonPulse, shineX]);

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={styles.backdropLayerA} />
        <View style={styles.backdropLayerB} />
        <Animated.View
          style={[
            styles.backdropBlob,
            styles.backdropBlobPink,
            { transform: [{ translateY: blobOneFloat }] },
          ]}
        />
        <Animated.View
          style={[
            styles.backdropBlob,
            styles.backdropBlobTeal,
            { transform: [{ translateY: blobTwoFloat }] },
          ]}
        />
        <View style={[styles.spark, styles.sparkOne]} />
        <View style={[styles.spark, styles.sparkTwo]} />
        <View style={[styles.spark, styles.sparkThree]} />
        <View style={[styles.bubble, styles.bubbleTopRight]} />
        <View style={[styles.bubble, styles.bubbleTopLeft]} />
        <View style={[styles.bubble, styles.bubbleBottomLeft]} />
        <View style={[styles.bubble, styles.bubbleBottomRight]} />
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="log-out-outline" size={34} color="#1976D2" />
        </View>

        <Text style={styles.kicker}>Session ending</Text>

        <Animated.View style={[styles.buttonOuter, { transform: [{ scale: buttonPulse }] }]}>
          <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.9}>
            <Animated.View
              pointerEvents="none"
              style={[styles.buttonShine, { transform: [{ translateX: shineX }, { rotate: "18deg" }] }]}
            />
            <Ionicons name="power" size={22} color="#ffffff" />
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}


