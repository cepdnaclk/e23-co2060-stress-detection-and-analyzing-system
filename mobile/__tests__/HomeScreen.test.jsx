import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HomeScreen from "../src/screens/HomeScreen";

// Mock React Navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Auth Store
jest.mock("../store/authStore", () => {
  const store = {
    user: { username: "Alex", role: "user" },
    token: "mock-token",
  };
  const useAuthStore = (selector) => {
    if (typeof selector === "function") {
      return selector(store);
    }
    return store;
  };
  useAuthStore.getState = () => store;
  return { useAuthStore };
});

describe("HomeScreen Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-24T18:00:00.000Z"));
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ submitted: true, notifications: [] }),
      })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders welcome header and user greeting", async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Welcome back, Alex")).toBeTruthy();
    expect(getByText("Take a moment for yourself today.")).toBeTruthy();
  });

  it("renders all four Quick Action cards", async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText("Quick Actions")).toBeTruthy();
    expect(getByText("DASS-21 Assessment")).toBeTruthy();
    expect(getByText("Routine Generator")).toBeTruthy();
    expect(getByText("Therapy Hub")).toBeTruthy();
    expect(getByText("Clinical Locator")).toBeTruthy();
  });

  it("navigates to Questionnaire when DASS-21 card is tapped", async () => {
    const { getByText } = await render(<HomeScreen />);

    const dassCard = getByText("DASS-21 Assessment");
    fireEvent.press(dassCard);

    expect(mockNavigate).toHaveBeenCalledWith("Questionnaire");
  });

  it("matches snapshot", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
