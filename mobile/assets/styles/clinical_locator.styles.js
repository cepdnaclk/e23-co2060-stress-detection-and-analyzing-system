import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },
  errorText: {
    fontSize: 15,
    color: "#D32F2F",
    textAlign: "center",
  },
  detailCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 8,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  detailAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  detailMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryActionText: {
    color: COLORS.textPrimary,
  },
});

export default styles;