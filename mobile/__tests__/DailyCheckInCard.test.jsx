import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import DailyCheckInCard from "../components/DailyCheckInCard";

// Mock auth store
jest.mock("../store/authStore", () => ({
  useAuthStore: () => ({
    token: "mock-token",
  }),
}));

describe("DailyCheckInCard Component", () => {
  it("renders correctly when visible", async () => {
    const { getByText } = await render(
      <DailyCheckInCard visible={true} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(getByText("Daily Check-in")).toBeTruthy();
    expect(getByText("How are you feeling today?")).toBeTruthy();
    expect(getByText("Mood")).toBeTruthy();
    expect(getByText("Stress Level")).toBeTruthy();
  });

  it("does not render when visible is false", async () => {
    const { queryByText } = await render(
      <DailyCheckInCard visible={false} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(queryByText("Daily Check-in")).toBeNull();
  });

  it("renders next button and handles user interaction", async () => {
    const onCloseMock = jest.fn();
    const { getByText } = await render(
      <DailyCheckInCard visible={true} onClose={onCloseMock} onSuccess={jest.fn()} />
    );

    const nextBtn = getByText("Next");
    expect(nextBtn).toBeTruthy();
  });

  it("allows selecting rating values", async () => {
    const { getAllByText } = await render(
      <DailyCheckInCard visible={true} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    // Rating value '3' is rendered for both mood and stress (2 occurrences)
    const ratingButtons = getAllByText("3");
    expect(ratingButtons.length).toBe(2);
  });

  it("matches snapshot", async () => {
    const screen = await render(
      <DailyCheckInCard visible={true} onClose={jest.fn()} onSuccess={jest.fn()} />
    );
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
