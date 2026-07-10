import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, useColorScheme, useWindowDimensions } from "react-native";
import SafeScreen from "../../components/SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import DonutChart from "../../components/admin/DonutChart";
import LineTrendChart from "../../components/admin/LineTrendChart";

const LIGHT = { page: "#eef5fb", card: "#ffffff", text: "#0f2f4c", subText: "#537290", border: "#d6e5f3", accent: "#1f7ed0" };
const DARK  = { page: "#071528", card: "#0d2138", text: "#eaf2ff", subText: "#9db8d5", border: "#25425f", accent: "#5ab0ff" };

const STRESS_COLORS = { "Normal":"#4caf84","Mild":"#f6b344","Moderate":"#f58a3d","Severe":"#ef5b5b","Extremely Severe":"#8b2d2d" };
const MOOD_COLORS   = { "Happy":"#f7c948","Calm":"#5ec6a8","Neutral":"#6ca0dc","Sad":"#8f7cf0","Stressed":"#ef6b6b","Anxious":"#f2994a" };

function normalizeTrend(points = []) {
  return { labels: points.map(p => p.label), values: points.map(p => Number(p.value || 0)) };
}

export default function AdminAnalyticsScreen() {
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = scheme === "dark";
  const theme = isDark ? DARK : LIGHT;
  const token = useAuthStore((s) => s.token);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/overview`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to fetch analytics");
      setData(json);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const stressDistribution = data?.stressDistribution || [];
  const stressTotal = stressDistribution.reduce((s, i) => s + i.value, 0);
  const stressChart = stressDistribution.map(e => ({ ...e, color: STRESS_COLORS[e.label] || "#70a1d7" }));

  const moodDistribution = data?.moodDistribution || [];
  const moodTotal = moodDistribution.reduce((s, i) => s + i.value, 0);
  const moodChart = moodDistribution.map(e => ({ ...e, color: MOOD_COLORS[e.label] || "#70a1d7" }));

  const trend30d = data?.assessmentTrends?.["30d"] ? normalizeTrend(data.assessmentTrends["30d"]) : { labels: [], values: [] };

  const cWidth = Math.min(width - 32, 1200);
  const split = width >= 900;

  const ChartCard = ({ title, subtitle, children }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]}>{subtitle}</Text>
      <View style={{ marginTop: 16 }}>{children}</View>
    </View>
  );

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: theme.page }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Platform Analytics</Text>
          <Text style={[styles.headerSub, { color: theme.subText }]}>Comprehensive data overview</Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={[styles.split, { flexDirection: split ? "row" : "column" }]}>
              
              <View style={styles.col}>
                <ChartCard title="Stress Level Distribution" subtitle="All time DASS-21 results">
                  {stressTotal === 0 ? <Text style={{color:theme.subText, textAlign:'center'}}>No data</Text> : (
                    <View style={styles.chartRow}>
                      <DonutChart data={stressChart} size={180} strokeWidth={30} trackColor={isDark ? "#274766" : "#e8eff6"} centerContent={
                        <><Text style={[styles.centerVal, {color:theme.text}]}>{stressTotal}</Text><Text style={[styles.centerLbl, {color:theme.subText}]}>Users</Text></>
                      }/>
                      <View style={styles.legend}>
                        {stressChart.map(item => (
                          <View key={item.label} style={styles.legendItem}>
                            <View style={[styles.legendDot, {backgroundColor:item.color}]} />
                            <Text style={[styles.legendText, {color:theme.text}]}>{item.label}</Text>
                            <Text style={[styles.legendVal, {color:theme.subText}]}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ChartCard>

                <ChartCard title="Assessment Trends" subtitle="DASS-21 completions (30 days)">
                  {trend30d.values.length === 0 ? <Text style={{color:theme.subText, textAlign:'center'}}>No data</Text> : (
                    <View>
                      <LineTrendChart values={trend30d.values} width={Math.max(cWidth - 64, 200)} height={200} lineColor={theme.accent} fillStart={theme.accent+"55"} fillEnd={theme.accent+"05"} />
                    </View>
                  )}
                </ChartCard>
              </View>

              <View style={styles.col}>
                <ChartCard title="Mood Analytics" subtitle="Daily mood tracker distribution">
                  {moodTotal === 0 ? <Text style={{color:theme.subText, textAlign:'center'}}>No data</Text> : (
                    <View style={styles.chartRow}>
                      <DonutChart data={moodChart} size={180} strokeWidth={30} trackColor={isDark ? "#274766" : "#e8eff6"} centerContent={
                        <><Text style={[styles.centerVal, {color:theme.text}]}>{moodTotal}</Text><Text style={[styles.centerLbl, {color:theme.subText}]}>Entries</Text></>
                      }/>
                      <View style={styles.legend}>
                        {moodChart.map(item => (
                          <View key={item.label} style={styles.legendItem}>
                            <View style={[styles.legendDot, {backgroundColor:item.color}]} />
                            <Text style={[styles.legendText, {color:theme.text}]}>{item.label}</Text>
                            <Text style={[styles.legendVal, {color:theme.subText}]}>{item.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </ChartCard>

                <ChartCard title="System & Usage Trends" subtitle="Overview of platform engagement">
                  <View style={{ gap: 12 }}>
                    {[
                      { l: "Most Common Stress", v: data?.trends?.mostCommonStress },
                      { l: "Most Common Mood", v: data?.trends?.mostCommonMood },
                      { l: "Therapy Hub Sessions", v: data?.therapyHub?.totalPlayed },
                      { l: "Clinical Locator Searches", v: data?.clinicalLocator?.totalSearches },
                      { l: "Total Registered Users", v: data?.cards?.find(c=>c.title==="Total Users")?.value },
                    ].map(it => (
                      <View key={it.l} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.subText }}>{it.l}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, textTransform: "capitalize" }}>{it.v ?? "—"}</Text>
                      </View>
                    ))}
                  </View>
                </ChartCard>
              </View>

            </View>
          </ScrollView>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  headerSub: { fontSize: 14, marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  split: { gap: 16 },
  col: { flex: 1, gap: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  chartRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 24 },
  legend: { flex: 1, minWidth: 150, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { flex: 1, fontSize: 13, fontWeight: "600" },
  legendVal: { fontSize: 13, fontWeight: "700" },
  centerVal: { fontSize: 24, fontWeight: "800" },
  centerLbl: { fontSize: 12, fontWeight: "600" }
});
