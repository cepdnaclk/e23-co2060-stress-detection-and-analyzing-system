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
  callout: {
    width: 200,
    padding: 8,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#555",
  },
  calloutLink: {
    fontSize: 11,
    color: "#1976D2",
    marginTop: 6,
    fontWeight: "600",
  },
});

export default styles;