import { StyleSheet } from "react-native";

const WTS = StyleSheet.create({
  // ── Section wrapper ────────────────────────────────────────────────────────
  sectionWrapper: {
    marginTop: 4,
    gap: 14,
  },
  sectionHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionHeadEmoji: {
    fontSize: 20,
  },
  sectionHeadTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0b3a5a",
    letterSpacing: -0.3,
  },
  sectionHeadSub: {
    fontSize: 13,
    color: "#5d7994",
    marginTop: 2,
  },

  // ── Today's Progress Card ──────────────────────────────────────────────────
  progressCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#cce1f6",
    shadowColor: "#2a6ca7",
    shadowOpacity: 0.13,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 14,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b3a5a",
    marginBottom: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#d8ecff",
  },
  progressRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  progressIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRowEmoji: {
    fontSize: 18,
  },
  progressRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f4666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Timeline ───────────────────────────────────────────────────────────────
  timelineContainer: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#d7e7f7",
    shadowColor: "#2a6ca7",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  timelineSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b3a5a",
    marginBottom: 14,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateGroupLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1976D2",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  railWrap: {
    width: 22,
    alignItems: "center",
    position: "relative",
  },
  railLine: {
    position: "absolute",
    top: 20,
    bottom: -10,
    width: 2,
    borderRadius: 99,
    backgroundColor: "#d8e9f8",
  },
  railDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#f0f7ff",
    marginTop: 3,
    zIndex: 2,
  },
  activityCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#d8e9f8",
    gap: 4,
  },
  activityCardCompleted: {
    backgroundColor: "#f0faf5",
    borderColor: "#b2dfcf",
  },
  activityCardInProgress: {
    backgroundColor: "#fffbf0",
    borderColor: "#f0d9a0",
  },
  activityCardWarning: {
    backgroundColor: "#fff5f5",
    borderColor: "#f0c8c8",
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f4666",
  },
  activityMeta: {
    fontSize: 12,
    color: "#5d7994",
    lineHeight: 17,
  },
  activityMetaHighlight: {
    fontWeight: "700",
    color: "#1976D2",
  },
  activityTime: {
    fontSize: 11,
    color: "#8ab0c8",
    marginTop: 2,
  },
  resumeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#e3f2fd",
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1565c0",
  },

  // ── Loading / Empty / Error ────────────────────────────────────────────────
  centeredBox: {
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "#d7e7f7",
    shadowColor: "#2a6ca7",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  centeredEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  centeredTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b3a5a",
    marginBottom: 6,
    textAlign: "center",
  },
  centeredText: {
    fontSize: 13,
    color: "#5d7994",
    textAlign: "center",
    lineHeight: 20,
  },
  startBtn: {
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: "#1976D2",
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default WTS;
