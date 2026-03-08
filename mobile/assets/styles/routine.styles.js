import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEDF2",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  cardBackground: {
    width: "96%",
    maxWidth: 960,
    aspectRatio: 964 / 741,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: {
    borderRadius: 26,
  },
  overlayLayer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  input: {
    position: "absolute",
    left: "11.2%",
    top: "32.2%",
    width: "76%",
    height: "33%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#346EAF",
    fontFamily: "JetBrainsMono-Medium",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(130, 176, 229, 0.65)",
  },
  enterButton: {
    position: "absolute",
    left: "22%",
    top: "71%",
    width: "56%",
    height: "12.5%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(67, 160, 246, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(204, 228, 252, 0.95)",
  },
  enterButtonDisabled: {
    opacity: 0.75,
  },
  enterButtonText: {
    color: "#EDF6FF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "JetBrainsMono-Medium",
    textShadowColor: "rgba(39, 91, 155, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default styles;