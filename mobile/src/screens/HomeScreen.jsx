import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import SafeScreen from "../../components/SafeScreen";
import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/home.styles";

const QUICK_ACTIONS = [
  {
    title: "DASS-21 Assessment",
    description: "Check in with your stress, anxiety, and mood.",
    icon: "clipboard-outline",
    route: "Questionnaire",
    background: "#eef6ff",
    glow: "rgba(25, 118, 210, 0.14)",
    iconBackground: "rgba(25, 118, 210, 0.12)",
    iconColor: "#1976D2",
  },
  {
    title: "Routine Generator",
    description: "Build a calmer, more balanced day.",
    icon: "calendar-outline",
    route: "Routine Generator",
    background: "#f0fbf7",
    glow: "rgba(73, 177, 140, 0.14)",
    iconBackground: "rgba(73, 177, 140, 0.12)",
    iconColor: "#2c8d6f",
  },
  {
    title: "Therapy Hub",
    description: "Explore support tools and wellness resources.",
    icon: "heart-outline",
    route: "Therapy Hub",
    background: "#fff6ee",
    glow: "rgba(232, 147, 74, 0.14)",
    iconBackground: "rgba(232, 147, 74, 0.14)",
    iconColor: "#d96c18",
  },
  {
    title: "Clinical Locator",
    description: "Find nearby care and support when needed.",
    icon: "location-outline",
    route: "Clinical Locator",
    background: "#f7f1ff",
    glow: "rgba(143, 101, 235, 0.14)",
    iconBackground: "rgba(143, 101, 235, 0.12)",
    iconColor: "#7d59de",
  },
];

const WELLNESS_TIPS = [
  {
    tip: "Drink enough water today.",
    icon: "water-outline",
    accent: "#4aa3df",
    softBackground: "#ecf7ff",
  },
  {
    tip: "Take a five-minute breathing break.",
    icon: "leaf-outline",
    accent: "#2f9e88",
    softBackground: "#eefaf6",
  },
  {
    tip: "Stretch your body after sitting for long periods.",
    icon: "body-outline",
    accent: "#e08b3f",
    softBackground: "#fff5ea",
  },
  {
    tip: "Spend a few minutes away from your screen.",
    icon: "sparkles-outline",
    accent: "#8b6bd6",
    softBackground: "#f5f0ff",
  },
  {
    tip: "Practice gratitude by writing down one positive thing today.",
    icon: "sunny-outline",
    accent: "#d97a63",
    softBackground: "#fff3ef",
  },
];

const MOTIVATIONAL_QUOTES = [
  {
    quote: "Progress, not perfection.",
    source: "Wellness reminder",
  },
  {
    quote: "Small steps every day lead to big changes.",
    source: "Daily encouragement",
  },
  {
    quote: "Your mental health is just as important as your physical health.",
    source: "Self-care truth",
  },
  {
    quote: "Rest is productive too.",
    source: "Gentle balance",
  },
  {
    quote: "Healing happens one calm moment at a time.",
    source: "Quiet growth",
  },
];

function getGreeting(hour) {
  if (hour < 12) return "Good Morning ☀️";
  if (hour < 17) return "Good Afternoon 🌤️";
  return "Good Evening 🌙";
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickDailyItem(items, dateKey, offset = 0) {
  if (!items.length) return null;
  const index = hashString(`${dateKey}:${offset}`) % items.length;
  return items[index];
}

function SectionHeading({ eyebrow, title, hint }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <View style={styles.sectionHeadingCopy}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function QuickActionCard({ item, onPress, width }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          width,
          backgroundColor: item.background,
        },
        pressed ? styles.actionCardPressed : null,
      ]}
    >
      <View pointerEvents="none" style={[styles.actionGlow, { backgroundColor: item.glow }]} />
      <View style={[styles.actionIconWrap, { backgroundColor: item.iconBackground }]}>
        <Ionicons name={item.icon} size={24} color={item.iconColor} />
      </View>
      <Text style={styles.actionTitle}>{item.title}</Text>
      <Text style={styles.actionDescription}>{item.description}</Text>
      <View style={styles.actionFooter}>
        <Text style={styles.actionCta}>Open</Text>
        <Ionicons name="arrow-forward" size={16} color={item.iconColor} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);
  const dateKey = useMemo(() => getLocalDateKey(new Date()), []);
  const dailyTip = useMemo(() => pickDailyItem(WELLNESS_TIPS, dateKey, 1), [dateKey]);
  const dailyQuote = useMemo(() => pickDailyItem(MOTIVATIONAL_QUOTES, dateKey, 7), [dateKey]);
  const displayName = user?.username || user?.name || "friend";

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentLift = useRef(new Animated.Value(18)).current;
  const iconBobble = useRef(new Animated.Value(0)).current;
  const tipAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentLift, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const bobbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconBobble, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconBobble, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    bobbleLoop.start();

    return () => {
      bobbleLoop.stop();
    };
  }, [contentLift, contentOpacity, iconBobble]);

  useEffect(() => {
    tipAnim.setValue(0);
    Animated.timing(tipAnim, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dailyTip, tipAnim]);

  useEffect(() => {
    quoteAnim.setValue(0);
    Animated.timing(quoteAnim, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dailyQuote, quoteAnim]);

  const quickActionWidth = Math.max((width - 40 - 14) / 2, 150);

  const tipTranslateY = tipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const quoteTranslateY = quoteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const iconTranslateY = iconBobble.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const iconRotate = iconBobble.interpolate({
    inputRange: [0, 1],
    outputRange: ["-4deg", "4deg"],
  });

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <View style={[styles.backgroundOrb, styles.backgroundOrbOne]} />
          <View style={[styles.backgroundOrb, styles.backgroundOrbTwo]} />
          <View style={[styles.backgroundOrb, styles.backgroundOrbThree]} />
        </View>

        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentLift }],
            },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Welcome back, {displayName}</Text>
            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroSubtitle}>Take a moment for yourself today.</Text>
            <Text style={styles.heroBody}>
              A calmer day can begin with one mindful action.
            </Text>
          </View>

          <Animated.View
            style={[
              styles.heroIconWrap,
              {
                transform: [{ translateY: iconTranslateY }, { rotate: iconRotate }],
              },
            ]}
          >
            <View style={styles.heroIconShell}>
              <Ionicons name="leaf-outline" size={34} color="#1976D2" />
            </View>
          </Animated.View>
        </Animated.View>

        <View style={styles.sectionBlock}>
          <SectionHeading eyebrow="Explore" title="Quick Actions" hint="Tap to continue" />
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((item) => (
              <QuickActionCard
                key={item.route}
                item={item}
                width={quickActionWidth}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>
        </View>

        <Animated.View
          style={[
            styles.tipCard,
            {
              opacity: tipAnim,
              transform: [{ translateY: tipTranslateY }],
              backgroundColor: dailyTip?.softBackground ?? "#ecf7ff",
            },
          ]}
        >
          <View style={[styles.tipIconWrap, { backgroundColor: `${dailyTip?.accent ?? "#1976D2"}18` }]}>
            <Ionicons name={dailyTip?.icon ?? "leaf-outline"} size={24} color={dailyTip?.accent ?? "#1976D2"} />
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardKicker}>Today&apos;s Wellness Tip</Text>
            <Text style={styles.tipText}>{dailyTip?.tip}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.quoteCard,
            {
              opacity: quoteAnim,
              transform: [{ translateY: quoteTranslateY }],
            },
          ]}
        >
          <View style={styles.quoteMarksRow}>
            <Ionicons name="open-outline" size={20} color="#6f86a8" />
            <Ionicons name="close-outline" size={20} color="#6f86a8" />
          </View>
          <Text style={styles.quoteText}>{dailyQuote?.quote}</Text>
          <Text style={styles.quoteSource}>{dailyQuote?.source}</Text>
        </Animated.View>
      </ScrollView>
    </SafeScreen>
  );
}