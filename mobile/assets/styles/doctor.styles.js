import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const doctorStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    minWidth: 140,
  },
  statCard: {
    flex: 1,
    minWidth: 138,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textDark,
  },
  multiLineInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e8f1ff",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  chipSuccess: {
    backgroundColor: "#e5f7ec",
  },
  chipWarning: {
    backgroundColor: "#fff3d9",
  },
  chipDanger: {
    backgroundColor: "#fde8e8",
  },
  chipTextSuccess: {
    color: "#216b3f",
  },
  chipTextWarning: {
    color: "#8a5a00",
  },
  chipTextDanger: {
    color: "#a23636",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#dfeeff",
  },
  avatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  listGap: {
    gap: 12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  filterInput: {
    minWidth: 120,
    flex: 1,
  },
  starRow: {
    flexDirection: "row",
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
});

export default doctorStyles;
