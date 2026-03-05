import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "stretch",
    justifyContent: "flex-start",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
    
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "left",
    marginBottom: 16,
  },
  introContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  introImage: {
    width: "100%",
    height: 200,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionsHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  startButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  progressRow: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: "#dbe9ff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#9fbff5",
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    marginHorizontal: 4,
  },
  navButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  navButtonTextSecondary: {
    color: COLORS.textPrimary,
  },
});

export default styles;