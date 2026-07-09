import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#c62828",
    textAlign: "center",
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 110, // Extra padding to clear the bottom floating player
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 8,
  },
  card: {
    width: 250,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  activeCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImageContainer: {
    width: "100%",
    height: 130,
    position: "relative",
    backgroundColor: "#e3f2fd",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    height: 32, // Fits exactly 2 lines
  },
  badgesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  playerBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  progressBarBackground: {
    width: "100%",
    height: 3,
    backgroundColor: "#e0e0e0",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  playerThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  playerThumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  playerCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  playerControlBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
  },
});

export default styles;