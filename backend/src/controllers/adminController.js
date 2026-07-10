import User from "../models/User.js";
import QuestionnaireResult from "../models/QuestionnaireResult.js";
import MoodHistory from "../models/MoodHistory.js";
import Routine from "../models/Routine.js";
import ConsultationRequest from "../models/ConsultationRequest.js";

const SEVERITY_ORDER = ["normal", "mild", "moderate", "severe", "extremely_severe"];
const MOOD_PALETTE   = ["Happy", "Calm", "Neutral", "Sad", "Stressed", "Anxious"];

const startOfDay = (d = new Date()) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const startOfWeek = (d = new Date()) => { const r = startOfDay(d); const day = r.getDay(); r.setDate(r.getDate() - day + (day === 0 ? -6 : 1)); return r; };
const startOfMonth = (d = new Date()) => { const r = new Date(d); r.setHours(0,0,0,0); r.setDate(1); return r; };
const startOfYear = (d = new Date()) => { const r = new Date(d); r.setHours(0,0,0,0); r.setMonth(0,1); return r; };
const addDays   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };

const dayKey   = (d) => new Intl.DateTimeFormat("en-CA", { year:"numeric", month:"2-digit", day:"2-digit" }).format(d);
const monthKey = (d) => new Intl.DateTimeFormat("en-CA", { year:"numeric", month:"2-digit" }).format(d);

const buildSeries = (range) => {
  const now = new Date();
  if (range === "12m") {
    const base = startOfMonth(addMonths(now, -11));
    return Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(base, i);
      return { key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }) };
    });
  }
  const days = range === "30d" ? 30 : 7;
  const base = addDays(startOfDay(now), -(days - 1));
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(base, i);
    return { key: dayKey(d), label: d.toLocaleDateString("en-US", days === 7 ? { weekday:"short" } : { month:"short", day:"numeric" }) };
  });
};

const countByKey = (docs, getKey) => {
  const map = new Map();
  for (const doc of docs) { const k = getKey(doc); if (k) map.set(k, (map.get(k) || 0) + 1); }
  return map;
};
const mapToSeries = (series, countsMap) => series.map(({ label, key }) => ({ label, value: countsMap.get(key) || 0 }));
const topEntry = (map) => { let top = null, best = -1; for (const [k, v] of map.entries()) if (v > best) { top = k; best = v; } return top; };

const relativeTime = (ts) => {
  if (!ts) return "just now";
  const diffMs = new Date(ts).getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60000);
  if (Math.abs(diffMins) < 1) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
  const diffHrs = Math.round(diffMins / 60);
  if (Math.abs(diffHrs) < 24) return rtf.format(diffHrs, "hour");
  return rtf.format(Math.round(diffHrs / 24), "day");
};

export const getAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const sDay = startOfDay(now), sWeek = startOfWeek(now), sMonth = startOfMonth(now), sYear = startOfYear(now);

    const [
      totalUsers, totalAssessments, assessmentsToday, totalMoodEntries, totalRoutines, totalLocatorUsage,
      totalCompletedConsultations, totalDoctors, totalNotifications,
      newUsersToday, newUsersWeek, newUsersMonth, locatorToday, locatorWeek,
      questionnaireRecent, moodRecent, routineRecent, requestRecent, userRecent,
      stressResults, moodResults, routineResults, requestResults, userResults,
    ] = await Promise.all([
      User.countDocuments(),
      QuestionnaireResult.countDocuments(),
      QuestionnaireResult.countDocuments({ recordedAt: { $gte: sDay } }),
      MoodHistory.countDocuments(),
      Routine.countDocuments(),
      ConsultationRequest.countDocuments(),
      ConsultationRequest.countDocuments({ status: "Completed" }),
      User.countDocuments({ role: "volunteer_doctor" }),
      ConsultationRequest.countDocuments({ requestedAt: { $gte: sDay } }),
      User.countDocuments({ createdAt: { $gte: sDay } }),
      User.countDocuments({ createdAt: { $gte: sWeek } }),
      User.countDocuments({ createdAt: { $gte: sMonth } }),
      ConsultationRequest.countDocuments({ requestedAt: { $gte: sDay } }),
      ConsultationRequest.countDocuments({ requestedAt: { $gte: sWeek } }),
      QuestionnaireResult.find({}).sort({ recordedAt:-1, createdAt:-1 }).limit(12).populate("userId","username").select("userId stressSeverity recordedAt createdAt").lean(),
      MoodHistory.find({}).sort({ createdAt:-1 }).limit(12).populate("user","username").select("user mood createdAt").lean(),
      Routine.find({}).sort({ createdAt:-1 }).limit(12).populate("user","username").select("user title createdAt").lean(),
      ConsultationRequest.find({}).sort({ requestedAt:-1, createdAt:-1 }).limit(16).populate("userId","username").select("userId status requestedAt createdAt").lean(),
      User.find({}).sort({ createdAt:-1 }).limit(16).select("username createdAt").lean(),
      QuestionnaireResult.find({ recordedAt: { $gte: sYear } }).select("stressSeverity recordedAt createdAt").lean(),
      MoodHistory.find({ createdAt: { $gte: sYear } }).select("mood createdAt").lean(),
      Routine.find({ createdAt: { $gte: sYear } }).select("title summary createdAt").lean(),
      ConsultationRequest.find({ requestedAt: { $gte: sYear } }).select("status requestedAt createdAt").lean(),
      User.find({ createdAt: { $gte: sYear } }).select("createdAt").lean(),
    ]);

    const stressCounts = countByKey(stressResults, (e) => String(e.stressSeverity || "").toLowerCase());
    const stressDistribution = SEVERITY_ORDER.map((sev) => ({
      label: sev.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase()),
      value: stressCounts.get(sev) || 0,
    }));

    const moodCounts = countByKey(moodResults, (e) => String(e.mood || "").trim().toLowerCase());
    const moodDistribution = MOOD_PALETTE.map((mood) => ({ label: mood, value: moodCounts.get(mood.toLowerCase()) || 0 }));

    const aKeyDay = (e) => dayKey(new Date(e.recordedAt || e.createdAt));
    const aKeyMon = (e) => monthKey(new Date(e.recordedAt || e.createdAt));
    const assessmentTrends = {
      "7d":  mapToSeries(buildSeries("7d"),  countByKey(stressResults, aKeyDay)),
      "30d": mapToSeries(buildSeries("30d"), countByKey(stressResults, aKeyDay)),
      "12m": mapToSeries(buildSeries("12m"), countByKey(stressResults, aKeyMon)),
    };

    const userGrowthTrend = mapToSeries(buildSeries("7d"), countByKey(userResults, (e) => dayKey(new Date(e.createdAt))));
    const routineTitleCounts   = countByKey(routineResults, (e) => String(e.title || "Routine").trim());
    const routineSummaryCounts = countByKey(routineResults, (e) => String(e.summary || e.title || "No data").trim());
    const requestStatusCounts  = countByKey(requestResults, (e) => String(e.status || "Pending").trim());

    const recentActivity = [
      ...userRecent.map((e) => ({ user: e.username||"Unknown", activity:"New user registered", timestamp: e.createdAt, icon:"person-add-outline" })),
      ...questionnaireRecent.map((e) => ({ user: e.userId?.username||"Unknown", activity:`DASS-21 completed (${String(e.stressSeverity||"normal").replace(/_/g," ")})`, timestamp: e.recordedAt||e.createdAt, icon:"checkbox-outline" })),
      ...moodRecent.map((e) => ({ user: e.user?.username||"Unknown", activity:`Mood recorded: ${e.mood}`, timestamp: e.createdAt, icon:"happy-outline" })),
      ...routineRecent.map((e) => ({ user: e.user?.username||"Unknown", activity:`Therapy routine: ${e.title||"Routine"}`, timestamp: e.createdAt, icon:"play-circle-outline" })),
      ...requestRecent.map((e) => ({ user: e.userId?.username||"Unknown", activity:`Clinical locator request ${String(e.status||"submitted").toLowerCase()}`, timestamp: e.requestedAt||e.createdAt, icon:"location-outline" })),
    ]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 14)
      .map((item) => ({ user: item.user, action: item.activity, time: relativeTime(item.timestamp), icon: item.icon }));

    res.status(200).json({
      cards: [
        { title:"Total Users",                 value: totalUsers,        delta: newUsersMonth },
        { title:"Total DASS-21 Assessments",   value: totalAssessments,  delta: assessmentsToday },
        { title:"Assessments Completed Today", value: assessmentsToday,  delta: 0 },
        { title:"Total Mood Entries",          value: totalMoodEntries,  delta: 0 },
        { title:"Therapy Hub Sessions",        value: totalRoutines,     delta: 0 },
        { title:"Clinical Locator Usage",      value: totalLocatorUsage, delta: 0 },
      ],
      stressDistribution,
      assessmentTrends,
      moodDistribution,
      userGrowth: { today: newUsersToday, week: newUsersWeek, month: newUsersMonth, trend: userGrowthTrend },
      therapyHub: { totalPlayed: totalRoutines, mostPlayedCategory: topEntry(routineTitleCounts)||"No data", mostPlayedAudio: topEntry(routineSummaryCounts)||"No data", totalListeningSessions: totalRoutines },
      clinicalLocator: { totalSearches: totalLocatorUsage, searchesToday: locatorToday, searchesThisWeek: locatorWeek, topStatus: topEntry(requestStatusCounts)||"Pending" },
      recentActivity,
      systemStatus: { api:"healthy", database:"healthy", server:"healthy", storage:0 },
      trends: { mostCommonMood: topEntry(moodCounts)||"No data", mostCommonStress: topEntry(stressCounts)||"No data", completedConsultations: totalCompletedConsultations, totalDoctors, totalNotifications },
    });
  } catch (error) {
    console.error("Error in getAdminOverview:", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      age: user.age,
      gender: user.gender,
      createdAt: user.createdAt,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};
