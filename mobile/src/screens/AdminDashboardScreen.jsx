import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { API_URL } from "../../constants/api";
import DonutChart from "../../components/admin/DonutChart";
import LineTrendChart from "../../components/admin/LineTrendChart";
import SkeletonBlock from "../../components/admin/SkeletonBlock";
import StatCard from "../../components/admin/StatCard";
import { useAuthStore } from "../../store/authStore";

// ─── Theme ───────────────────────────────────────────────────────────────────
const LIGHT = { page:"#eef5fb", card:"#ffffff", text:"#0f2f4c", subText:"#537290", border:"#d6e5f3", accent:"#1f7ed0", search:"#f7fbff", badge:"#eb5a60", success:"#1f9d62", warning:"#d48b2a", danger:"#d64545" };
const DARK  = { page:"#071528", card:"#0d2138", text:"#eaf2ff", subText:"#9db8d5", border:"#25425f", accent:"#5ab0ff", search:"#0f2a44", badge:"#eb5a60", success:"#2dba87", warning:"#d48b2a", danger:"#d64545" };

// ─── Chart colours ────────────────────────────────────────────────────────────
const STRESS_COLORS = { "Normal":"#4caf84","Mild":"#f6b344","Moderate":"#f58a3d","Severe":"#ef5b5b","Extremely Severe":"#8b2d2d" };
const MOOD_COLORS   = { "Happy":"#f7c948","Calm":"#5ec6a8","Neutral":"#6ca0dc","Sad":"#8f7cf0","Stressed":"#ef6b6b","Anxious":"#f2994a" };

// ─── Card metadata ────────────────────────────────────────────────────────────
const CARD_META = {
  "Total Users":                 { icon:"people-outline",        iconColor:"#367de0" },
  "Total DASS-21 Assessments":   { icon:"document-text-outline", iconColor:"#7b6df2" },
  "Assessments Completed Today": { icon:"calendar-outline",      iconColor:"#2dba87" },
  "Total Mood Entries":          { icon:"happy-outline",         iconColor:"#f2a13d" },
  "Therapy Hub Sessions":        { icon:"headset-outline",       iconColor:"#55a4f3" },
  "Clinical Locator Usage":      { icon:"location-outline",      iconColor:"#de5f91" },
};

// ─── Normalise API response ───────────────────────────────────────────────────
function normalizeTrend(points = []) {
  return {
    labels: points.map((p) => p.label),
    values: points.map((p) => Number(p.value || 0)),
  };
}

function normalise(data) {
  if (!data) return null;
  const cards = Array.isArray(data.cards) ? data.cards : [];
  return {
    stats: cards.map((c) => ({
      title: c.title,
      value: Number(c.value || 0),
      delta: Number(c.delta || 0),
      ...(CARD_META[c.title] || { icon:"stats-chart-outline", iconColor:"#367de0" }),
    })),
    stressDistribution: Array.isArray(data.stressDistribution) ? data.stressDistribution : [],
    assessmentTrends: {
      "7d":  normalizeTrend(data?.assessmentTrends?.["7d"]),
      "30d": normalizeTrend(data?.assessmentTrends?.["30d"]),
      "12m": normalizeTrend(data?.assessmentTrends?.["12m"]),
    },
    moods: Array.isArray(data.moodDistribution) ? data.moodDistribution : [],
    userGrowth: {
      today: Number(data?.userGrowth?.today || 0),
      week:  Number(data?.userGrowth?.week  || 0),
      month: Number(data?.userGrowth?.month || 0),
      trend: Array.isArray(data?.userGrowth?.trend) ? data.userGrowth.trend.map((p) => Number(p.value || 0)) : [],
    },
    therapyHub: {
      totalPlayed:           Number(data?.therapyHub?.totalPlayed           || 0),
      mostPlayedCategory:    data?.therapyHub?.mostPlayedCategory            || "No data",
      mostPlayedAudio:       data?.therapyHub?.mostPlayedAudio               || "No data",
      totalListeningSessions:Number(data?.therapyHub?.totalListeningSessions || 0),
    },
    clinicalLocator: {
      totalSearches: Number(data?.clinicalLocator?.totalSearches   || 0),
      today:         Number(data?.clinicalLocator?.searchesToday   || 0),
      week:          Number(data?.clinicalLocator?.searchesThisWeek|| 0),
    },
    recentActivity: Array.isArray(data.recentActivity)
      ? data.recentActivity.map((item) => ({ user: item.user||"Unknown", action: item.action||"Activity", time: item.time||"just now", icon: item.icon||"ellipse-outline" }))
      : [],
    systemStatus: data?.systemStatus || { api:"unknown", database:"unknown", server:"unknown", storage:0 },
    notifications: Number(data?.trends?.totalNotifications || 0),
    trends: data?.trends || {},
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, theme, action }) {
  return (
    <View style={[ss.sCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={ss.sHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[ss.sTitle, { color: theme.text }]}>{title}</Text>
          {subtitle ? <Text style={[ss.sSub, { color: theme.subText }]}>{subtitle}</Text> : null}
        </View>
        {action || null}
      </View>
      {children}
    </View>
  );
}

function EmptyState({ theme, icon = "file-tray-outline", message = "No data yet" }) {
  return (
    <View style={ss.emptyWrap}>
      <View style={[ss.emptyIcon, { backgroundColor: theme.search, borderColor: theme.border }]}>
        <Ionicons name={icon} size={24} color={theme.subText} />
      </View>
      <Text style={[ss.emptyText, { color: theme.subText }]}>{message}</Text>
    </View>
  );
}

function StatusPill({ label, status, theme }) {
  const color = status === "healthy" ? theme.success : status === "warning" ? theme.warning : theme.danger;
  return (
    <View style={ss.statusRow}>
      <Text style={[ss.statusLabel, { color: theme.text }]}>{label}</Text>
      <View style={ss.statusRight}>
        <View style={[ss.statusDot, { backgroundColor: color }]} />
        <Text style={[ss.statusVal, { color: theme.subText }]}>{status}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminDashboardScreen({ navigation }) {
  const scheme   = useColorScheme();
  const { width } = useWindowDimensions();
  const token    = useAuthStore((s) => s.token);

  const [manualDark, setManualDark] = useState(null);
  const [dashboard,  setDashboard]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendRange, setTrendRange] = useState("7d");
  const [search,     setSearch]     = useState("");

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const isDark = manualDark === null ? scheme === "dark" : manualDark;
  const theme  = isDark ? DARK : LIGHT;

  const hPad    = width > 900 ? 24 : 16;
  const cWidth  = Math.min(width - hPad * 2, 1200);
  const nCols   = width >= 1120 ? 3 : width >= 760 ? 2 : 1;
  const cardW   = nCols === 1 ? cWidth : (cWidth - 12 * (nCols - 1)) / nCols;
  const split   = width >= 980;

  const todayLabel = useMemo(() => new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }), []);

  // ── Animations ──
  const runEntrance = useCallback(() => {
    fadeIn.setValue(0); slideUp.setValue(20);
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp]);

  // ── Data fetching ──
  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/admin/overview`, {
        headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      setDashboard(normalise(json));
      runEntrance();
    } catch (err) {
      Alert.alert("Dashboard unavailable", err.message || "Could not load admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, runEntrance]);

  useEffect(() => { load(false); }, [load]);

  // ── Derived data ──
  const stressTotal = (dashboard?.stressDistribution || []).reduce((s, i) => s + i.value, 0);
  const moodTotal   = (dashboard?.moods             || []).reduce((s, i) => s + i.value, 0);
  const trend       = dashboard?.assessmentTrends?.[trendRange] || { labels:[], values:[] };

  const stressChart = (dashboard?.stressDistribution || []).map((e) => ({ ...e, color: STRESS_COLORS[e.label] || "#70a1d7" }));
  const moodChart   = (dashboard?.moods             || []).map((e) => ({ ...e, color: MOOD_COLORS[e.label]   || "#70a1d7" }));

  const filteredActivity = useMemo(() => {
    const list = dashboard?.recentActivity || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((item) => item.user.toLowerCase().includes(q) || item.action.toLowerCase().includes(q));
  }, [dashboard?.recentActivity, search]);

  const onRefresh = useCallback(() => load(true), [load]);

  const triggerAction = useCallback((label) => {
    if (label === "Edit DASS-21 Questions") { navigation?.navigate("Edit Questionnaire"); return; }
    if (label === "View Users") { navigation?.navigate("Admin Users"); return; }
    if (label === "View Analytics") { navigation?.navigate("Admin Analytics"); return; }
    if (label === "Refresh Dashboard") { onRefresh(); return; }
    Alert.alert("Action", `${label} will be available soon.`);
  }, [navigation, onRefresh]);

  const ACTIONS = [
    { label:"Edit DASS-21 Questions", icon:"create-outline" },
    { label:"View Users",             icon:"people-outline" },
    { label:"View Analytics",         icon:"analytics-outline" },
    { label:"Export Reports",         icon:"download-outline" },
    { label:"Refresh Dashboard",      icon:"refresh-outline" },
  ];

  // ── Skeleton set ──
  const Skeleton = () => (
    <View style={{ gap: 14 }}>
      <View style={ss.statsGrid}>{[0,1,2,3,4,5].map((i) => <StatCard key={i} loading isDark={isDark} width={cardW} title="" value="" />)}</View>
      {[1,2,3,4].map((i) => (
        <View key={i} style={[ss.sCard, { backgroundColor: theme.card, borderColor: theme.border, gap: 12 }]}>
          <SkeletonBlock width="55%" height={16} />
          <SkeletonBlock width="100%" height={140} borderRadius={16} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeScreen>
      <ScrollView
        style={[ss.page, { backgroundColor: theme.page }]}
        contentContainerStyle={{ paddingHorizontal: hPad, paddingBottom: 40, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {/* ── Hero header ── */}
        <View style={[ss.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={ss.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={[ss.heroDate,  { color: theme.subText }]}>{todayLabel}</Text>
              <Text style={[ss.heroTitle, { color: theme.text }]}>Admin Dashboard</Text>
              <Text style={[ss.heroSub,   { color: theme.subText }]}>Welcome back. Here is your platform snapshot.</Text>
            </View>
            <View style={ss.heroActions}>
              <Pressable
                onPress={() => setManualDark((p) => p === null ? !isDark : !p)}
                style={({ pressed }) => [ss.iconBtn, { backgroundColor: theme.search, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={18} color={theme.text} />
              </Pressable>
              <Pressable 
                onPress={() => {
                  const count = dashboard?.notifications || 0;
                  if (count > 0) {
                    Alert.alert("Notifications", `You have ${count} new consultation request${count > 1 ? 's' : ''} today.`);
                  } else {
                    Alert.alert("Notifications", "No new notifications at the moment.");
                  }
                }}
                style={({ pressed }) => [ss.iconBtn, { backgroundColor: theme.search, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="notifications-outline" size={18} color={theme.text} />
                {(dashboard?.notifications || 0) > 0 && (
                  <View style={ss.badge}>
                    <Text style={ss.badgeText}>{dashboard.notifications}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          {/* Search bar */}
          <View style={[ss.searchBar, { backgroundColor: theme.search, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={16} color={theme.subText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search users or activity…"
              placeholderTextColor={theme.subText}
              style={[ss.searchInput, { color: theme.text }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={theme.subText} /></Pressable>
            )}
          </View>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <Skeleton />
        ) : (
          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], gap: 14 }}>

            {/* ── Stat cards ── */}
            <View style={ss.statsGrid}>
              {(dashboard?.stats || []).map((card) => (
                <StatCard
                  key={card.title}
                  title={card.title}
                  value={card.value.toLocaleString()}
                  icon={card.icon}
                  iconColor={card.iconColor}
                  delta={card.delta}
                  isDark={isDark}
                  width={cardW}
                />
              ))}
            </View>

            {/* ── Split layout ── */}
            <View style={[ss.split, { flexDirection: split ? "row" : "column" }]}>

              {/* ── Left column ── */}
              <View style={{ flex: 1, gap: 14 }}>

                {/* Stress distribution */}
                <SectionCard title="Stress Level Distribution" subtitle="DASS-21 stress categories" theme={theme}>
                  {stressTotal === 0 ? (
                    <EmptyState theme={theme} icon="pie-chart-outline" message="No stress data available yet" />
                  ) : (
                    <View style={[ss.chartRow, { flexDirection: width > 600 ? "row" : "column" }]}>
                      <DonutChart
                        data={stressChart}
                        size={172}
                        strokeWidth={28}
                        trackColor={isDark ? "#274766" : "#e8eff6"}
                        centerContent={
                          <>
                            <Text style={[ss.centerCount, { color: theme.text }]}>{stressTotal}</Text>
                            <Text style={[ss.centerLabel, { color: theme.subText }]}>Users</Text>
                          </>
                        }
                      />
                      <View style={ss.legend}>
                        {stressChart.map((item) => {
                          const pct = stressTotal ? Math.round((item.value / stressTotal) * 100) : 0;
                          return (
                            <View key={item.label} style={ss.legendItem}>
                              <View style={[ss.legendDot, { backgroundColor: item.color }]} />
                              <Text style={[ss.legendText, { color: theme.text }]}>{item.label}</Text>
                              <Text style={[ss.legendVal,  { color: theme.subText }]}>{item.value} ({pct}%)</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </SectionCard>

                {/* Assessment trends */}
                <SectionCard
                  title="Assessment Trends"
                  subtitle="DASS-21 completions over time"
                  theme={theme}
                  action={
                    <View style={ss.pills}>
                      {[{ k:"7d", l:"7 Days" }, { k:"30d", l:"30 Days" }, { k:"12m", l:"12 Months" }].map((opt) => (
                        <Pressable
                          key={opt.k}
                          onPress={() => setTrendRange(opt.k)}
                          style={({ pressed }) => [ss.pill, {
                            backgroundColor: trendRange === opt.k ? theme.accent : theme.search,
                            borderColor:     trendRange === opt.k ? theme.accent : theme.border,
                            opacity: pressed ? 0.8 : 1,
                          }]}
                        >
                          <Text style={[ss.pillText, { color: trendRange === opt.k ? "#fff" : theme.subText }]}>{opt.l}</Text>
                        </Pressable>
                      ))}
                    </View>
                  }
                >
                  {trend.values.length === 0 ? (
                    <EmptyState theme={theme} icon="analytics-outline" message="No trend data available" />
                  ) : (
                    <>
                      <LineTrendChart
                        values={trend.values}
                        width={Math.max(cWidth - 96, 200)}
                        height={170}
                        lineColor={theme.accent}
                        fillStart={isDark ? "rgba(90,176,255,0.35)" : "rgba(31,126,208,0.32)"}
                        fillEnd={isDark   ? "rgba(90,176,255,0.04)" : "rgba(31,126,208,0.03)"}
                      />
                      <View style={ss.axisRow}>
                        {trend.labels.map((lbl, i) => (
                          <Text key={i} style={[ss.axisLabel, { color: theme.subText }]}>{lbl}</Text>
                        ))}
                      </View>
                    </>
                  )}
                </SectionCard>

                {/* Recent Activity */}
                <SectionCard title="Recent Activity" subtitle="Latest platform events" theme={theme}>
                  {filteredActivity.length === 0 ? (
                    <EmptyState theme={theme} icon="time-outline" message="No matching activity" />
                  ) : (
                    <View style={{ gap: 8 }}>
                      {filteredActivity.map((item, idx) => (
                        <View key={idx} style={ss.timelineRow}>
                          <View style={ss.timelineRail}>
                            <View style={[ss.timelineDot, { backgroundColor: theme.accent }]} />
                            {idx < filteredActivity.length - 1 ? <View style={[ss.timelineLine, { backgroundColor: theme.border }]} /> : null}
                          </View>
                          <View style={ss.timelineContent}>
                            <View style={[ss.timelineIconWrap, { backgroundColor: theme.search }]}>
                              <Ionicons name={item.icon} size={13} color={theme.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[ss.timelineText, { color: theme.text }]}>
                                <Text style={{ fontWeight:"700" }}>{item.user}</Text>{"  "}{item.action}
                              </Text>
                              <Text style={[ss.timelineTime, { color: theme.subText }]}>{item.time}</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </SectionCard>
              </View>

              {/* ── Right column ── */}
              <View style={{ flex: 1, gap: 14 }}>

                {/* Mood analytics */}
                <SectionCard title="Mood Analytics" subtitle="Daily mood tracker distribution" theme={theme}>
                  {moodTotal === 0 ? (
                    <EmptyState theme={theme} icon="happy-outline" message="No mood data available yet" />
                  ) : (
                    <View style={[ss.chartRow, { flexDirection: width > 600 ? "row" : "column" }]}>
                      <DonutChart
                        data={moodChart}
                        size={160}
                        strokeWidth={26}
                        trackColor={isDark ? "#274766" : "#e8eff6"}
                        centerContent={
                          <>
                            <Text style={[ss.centerCount, { color: theme.text }]}>{moodTotal}</Text>
                            <Text style={[ss.centerLabel, { color: theme.subText }]}>Entries</Text>
                          </>
                        }
                      />
                      <View style={ss.legend}>
                        {moodChart.map((item) => (
                          <View key={item.label} style={ss.legendItem}>
                            <View style={[ss.legendDot, { backgroundColor: item.color }]} />
                            <Text style={[ss.legendText, { color: theme.text }]}>{item.label}</Text>
                            <Text style={[ss.legendVal,  { color: theme.subText }]}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </SectionCard>

                {/* User growth */}
                <SectionCard title="User Growth" subtitle="Registration snapshot" theme={theme}>
                  <View style={ss.metricRow}>
                    {[
                      { label:"New Today", val: dashboard?.userGrowth?.today },
                      { label:"This Week", val: dashboard?.userGrowth?.week  },
                      { label:"This Month",val: dashboard?.userGrowth?.month },
                    ].map((m) => (
                      <View key={m.label} style={[ss.metricBox, { backgroundColor: theme.search, borderColor: theme.border }]}>
                        <Text style={[ss.metricVal,   { color: theme.text    }]}>{m.val ?? 0}</Text>
                        <Text style={[ss.metricLabel, { color: theme.subText }]}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                  {(dashboard?.userGrowth?.trend || []).length > 1 && (
                    <LineTrendChart
                      values={dashboard.userGrowth.trend}
                      width={Math.max(cWidth - 96, 200)}
                      height={110}
                      lineColor="#38a873"
                      fillStart="rgba(56,168,115,0.32)"
                      fillEnd="rgba(56,168,115,0.04)"
                      showDots={false}
                    />
                  )}
                </SectionCard>

                {/* Therapy Hub */}
                <SectionCard title="Therapy Hub Analytics" subtitle="Audio content engagement" theme={theme}>
                  <View style={ss.infoList}>
                    {[
                      ["Total Sessions Played",    dashboard?.therapyHub?.totalPlayed],
                      ["Most Played Category",      dashboard?.therapyHub?.mostPlayedCategory],
                      ["Top Routine Summary",       dashboard?.therapyHub?.mostPlayedAudio],
                      ["Total Listening Sessions",  dashboard?.therapyHub?.totalListeningSessions],
                    ].map(([label, val]) => (
                      <View key={label} style={ss.infoRow}>
                        <Text style={[ss.infoLabel, { color: theme.subText }]}>{label}</Text>
                        <Text style={[ss.infoVal,   { color: theme.text, flex: 1, textAlign:"right" }]} numberOfLines={2}>{val ?? "—"}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>

                {/* Clinical Locator */}
                <SectionCard title="Clinical Locator" subtitle="Search behaviour overview" theme={theme}>
                  <View style={ss.infoList}>
                    {[
                      ["Total Searches",   dashboard?.clinicalLocator?.totalSearches],
                      ["Searches Today",   dashboard?.clinicalLocator?.today],
                      ["Searches This Week", dashboard?.clinicalLocator?.week],
                    ].map(([label, val]) => (
                      <View key={label} style={ss.infoRow}>
                        <Text style={[ss.infoLabel, { color: theme.subText }]}>{label}</Text>
                        <Text style={[ss.infoVal,   { color: theme.text }]}>{val ?? "—"}</Text>
                      </View>
                    ))}
                  </View>
                </SectionCard>

                {/* Quick Actions */}
                <SectionCard title="Quick Actions" subtitle="Common admin shortcuts" theme={theme}>
                  <View style={ss.actionsWrap}>
                    {ACTIONS.map((a) => (
                      <Pressable
                        key={a.label}
                        onPress={() => triggerAction(a.label)}
                        style={({ pressed }) => [ss.actionBtn, { backgroundColor: theme.search, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Ionicons name={a.icon} size={15} color={theme.accent} />
                        <Text style={[ss.actionText, { color: theme.text }]}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </SectionCard>

                {/* System Status */}
                <SectionCard title="System Status" subtitle="Operational health" theme={theme}>
                  <StatusPill label="Backend API" status={dashboard?.systemStatus?.api}      theme={theme} />
                  <StatusPill label="Database"    status={dashboard?.systemStatus?.database} theme={theme} />
                  <StatusPill label="Server"      status={dashboard?.systemStatus?.server}   theme={theme} />
                  {/* Storage bar */}
                  <View style={ss.storageWrap}>
                    <View style={ss.statusRow}>
                      <Text style={[ss.statusLabel, { color: theme.text }]}>Storage Usage</Text>
                      <Text style={[ss.statusVal,   { color: theme.subText }]}>{dashboard?.systemStatus?.storage ?? 0}%</Text>
                    </View>
                    <View style={[ss.track, { backgroundColor: theme.search, borderColor: theme.border }]}>
                      <View style={[ss.bar, {
                        width: `${dashboard?.systemStatus?.storage ?? 0}%`,
                        backgroundColor: (dashboard?.systemStatus?.storage ?? 0) < 70 ? theme.success : (dashboard?.systemStatus?.storage ?? 0) < 85 ? theme.warning : theme.danger,
                      }]} />
                    </View>
                  </View>
                </SectionCard>

              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  page:        { flex: 1 },
  hero:        { marginTop: 8, borderRadius: 22, borderWidth: 1, padding: 16, gap: 14, shadowColor:"#0d2b43", shadowOffset:{width:0,height:8}, shadowOpacity:0.08, shadowRadius:18, elevation:2 },
  heroTop:     { flexDirection:"row", justifyContent:"space-between", gap:12 },
  heroDate:    { fontSize:11, fontWeight:"600", marginBottom:3 },
  heroTitle:   { fontSize:28, fontWeight:"800", letterSpacing:0.2 },
  heroSub:     { marginTop:5, fontSize:13, lineHeight:19, maxWidth:480 },
  heroActions: { flexDirection:"row", gap:8, alignItems:"flex-start" },
  iconBtn:     { width:40, height:40, borderRadius:12, borderWidth:1, alignItems:"center", justifyContent:"center", position:"relative" },
  badge:       { position:"absolute", top:-5, right:-5, minWidth:16, height:16, borderRadius:8, backgroundColor:"#eb5a60", alignItems:"center", justifyContent:"center", paddingHorizontal:4 },
  badgeText:   { color:"#fff", fontSize:9, fontWeight:"700" },
  searchBar:   { flexDirection:"row", alignItems:"center", borderWidth:1, borderRadius:14, height:44, paddingHorizontal:12, gap:8 },
  searchInput: { flex:1, fontSize:14, paddingVertical:0 },
  statsGrid:   { flexDirection:"row", flexWrap:"wrap", gap:12 },
  split:       { gap:14 },
  sCard:       { borderWidth:1, borderRadius:20, padding:14, gap:12, shadowColor:"#0d2b43", shadowOffset:{width:0,height:6}, shadowOpacity:0.08, shadowRadius:14, elevation:2 },
  sHeaderRow:  { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", gap:8 },
  sTitle:      { fontSize:17, fontWeight:"700" },
  sSub:        { marginTop:2, fontSize:12 },
  chartRow:    { alignItems:"center", gap:16 },
  legend:      { flex:1, gap:8, minWidth:170 },
  legendItem:  { flexDirection:"row", alignItems:"center", gap:6 },
  legendDot:   { width:9, height:9, borderRadius:5 },
  legendText:  { fontSize:13, fontWeight:"600", flex:1 },
  legendVal:   { fontSize:12, fontWeight:"500" },
  centerCount: { fontSize:24, fontWeight:"800", textAlign:"center" },
  centerLabel: { fontSize:12, fontWeight:"600", textAlign:"center" },
  pills:       { flexDirection:"row", gap:5 },
  pill:        { borderWidth:1, borderRadius:999, paddingHorizontal:9, paddingVertical:4 },
  pillText:    { fontSize:11, fontWeight:"700" },
  axisRow:     { flexDirection:"row", justifyContent:"space-between" },
  axisLabel:   { fontSize:10, fontWeight:"600" },
  timelineRow: { flexDirection:"row", alignItems:"stretch", minHeight:52 },
  timelineRail:{ width:22, alignItems:"center" },
  timelineDot: { width:8, height:8, borderRadius:4, marginTop:7 },
  timelineLine:{ width:2, flex:1, marginTop:4, borderRadius:1 },
  timelineContent:{ flex:1, flexDirection:"row", gap:9, paddingBottom:8 },
  timelineIconWrap:{ width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center", marginTop:1 },
  timelineText:{ fontSize:13, lineHeight:18 },
  timelineTime:{ marginTop:2, fontSize:11, fontWeight:"600" },
  metricRow:   { flexDirection:"row", gap:8 },
  metricBox:   { flex:1, borderWidth:1, borderRadius:12, paddingVertical:10, paddingHorizontal:8, alignItems:"center" },
  metricVal:   { fontSize:20, fontWeight:"800" },
  metricLabel: { marginTop:2, fontSize:11, fontWeight:"600", textAlign:"center" },
  infoList:    { gap:10 },
  infoRow:     { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", gap:8 },
  infoLabel:   { fontSize:13, fontWeight:"600" },
  infoVal:     { fontSize:13, fontWeight:"700" },
  actionsWrap: { flexDirection:"row", flexWrap:"wrap", gap:8 },
  actionBtn:   { flexDirection:"row", alignItems:"center", gap:6, borderWidth:1, borderRadius:12, paddingHorizontal:10, paddingVertical:8 },
  actionText:  { fontSize:12, fontWeight:"600" },
  statusRow:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  statusRight: { flexDirection:"row", alignItems:"center", gap:5 },
  statusLabel: { fontSize:13, fontWeight:"600" },
  statusDot:   { width:8, height:8, borderRadius:4 },
  statusVal:   { fontSize:12, fontWeight:"600", textTransform:"capitalize" },
  storageWrap: { gap:6 },
  track:       { height:9, borderRadius:5, borderWidth:1, overflow:"hidden" },
  bar:         { height:"100%", borderRadius:5 },
  emptyWrap:   { alignItems:"center", justifyContent:"center", gap:8, paddingVertical:18 },
  emptyIcon:   { width:44, height:44, borderRadius:22, borderWidth:1, alignItems:"center", justifyContent:"center" },
  emptyText:   { fontSize:13, fontWeight:"600", textAlign:"center" },
});
