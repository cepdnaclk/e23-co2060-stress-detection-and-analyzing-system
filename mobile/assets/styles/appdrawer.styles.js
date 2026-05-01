import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  drawerStyle: {
    backgroundColor: "transparent",
    width: 330,
  },
  drawerRoot: {
    flex: 1,
    backgroundColor: "#e5f2ff",
    overflow: "hidden",
  },
  drawerBgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerBlob: {
    position: "absolute",
    borderRadius: 999,
  },
  drawerBlobBlue: {
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    backgroundColor: "rgba(113, 194, 255, 0.35)",
  },
  drawerBlobTeal: {
    top: 230,
    left: -90,
    width: 210,
    height: 210,
    backgroundColor: "rgba(129, 226, 219, 0.32)",
  },
  drawerBlobPink: {
    bottom: -80,
    right: -70,
    width: 230,
    height: 230,
    backgroundColor: "rgba(255, 183, 207, 0.3)",
  },
  drawerPanel: {
    flex: 1,
    margin: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#c4def8",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#2a6ca7",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
    overflow: "hidden",
  },
  drawerScrollContent: {
    paddingTop: 18,
    paddingBottom: 24,
  },
  drawerLabel: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "JetBrainsMono-Medium",
    letterSpacing: 0.15,
    marginLeft: -8,
  },
  drawerItem: {
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingVertical: 6,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconBubbleActive: {
    backgroundColor: "#e6f3ff",
    borderColor: "#98c9f6",
  },
  iconBubbleInactive: {
    backgroundColor: "#f2f8ff",
    borderColor: "#d5e8fb",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#e3f2fd",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#bbdefb",
  },
  sideContainer: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  sideContainerRight: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "JetBrainsMono-Medium",
    color: "#0b5ea8",
    letterSpacing: 0.2,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;
