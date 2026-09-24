import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dailyCheckInRoutes from "../../src/routes/dailyCheckInRoutes.js";
import User from "../../src/models/User.js";
import { connect, closeDatabase, clearDatabase } from "../setup/dbSetup.js";

// Increase Jest timeout for MongoDB binary downloads on first run
jest.setTimeout(60000);

// Ensure a JWT secret exists for tests
process.env.JWT_SECRET = "test-jwt-secret";

// Set up a mock Express app
const app = express();
app.use(express.json());
app.use("/api/checkins", dailyCheckInRoutes);

// Test variables
let token;
let testUserId;

beforeAll(async () => {
  await connect();
});

beforeEach(async () => {
  // Create a mock user
  const user = new User({
    username: "testuser",
    age: 22,
    gender: "male",
    password: "password123",
    role: "user",
  });
  await user.save();
  testUserId = user._id;

  // Generate a valid token for the test user
  token = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("Daily Check-in API Integration", () => {
  describe("POST /api/checkins", () => {
    it("should create a new check-in and return a risk score", async () => {
      const response = await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 3,
          mood: 3,
          sleepHours: 8,
          sleepQuality: 5,
          workloadHours: 6,
          physicalActivityMinutes: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Check-in successful");
      expect(response.body.riskScore).toBeDefined();
    });

    it("should prevent duplicate submissions on the same day", async () => {
      // First submission
      await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 3,
          mood: 3,
          sleepHours: 8,
          sleepQuality: 5,
          workloadHours: 6,
          physicalActivityMinutes: 30,
        });

      // Second submission
      const response = await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 4,
          mood: 2,
          sleepHours: 5,
          sleepQuality: 2,
          workloadHours: 8,
          physicalActivityMinutes: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Check-in already submitted for today.");
    });
  });

  describe("GET /api/checkins/today", () => {
    it("should return submitted: false if no check-in exists today", async () => {
      const response = await request(app)
        .get("/api/checkins/today")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.submitted).toBe(false);
    });

    it("should return submitted: true if a check-in exists today", async () => {
      // Create a check-in first
      await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 3,
          mood: 3,
          sleepHours: 8,
          sleepQuality: 5,
          workloadHours: 6,
          physicalActivityMinutes: 30,
        });

      const response = await request(app)
        .get("/api/checkins/today")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.submitted).toBe(true);
    });

    it("should return 401 if authorization token is missing", async () => {
      const response = await request(app).get("/api/checkins/today");
      expect(response.status).toBe(401);
    });

    it("should return 401 if authorization token is invalid", async () => {
      const response = await request(app)
        .get("/api/checkins/today")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });

    it("should return 400 if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 3,
        });

      expect(response.status).toBe(400);
    });

    it("should trigger recommendations when high stress is reported", async () => {
      const response = await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 5,
          mood: 1,
          sleepHours: 4,
          sleepQuality: 1,
          workloadHours: 10,
          physicalActivityMinutes: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.riskScore).toBeGreaterThanOrEqual(50);
      expect(response.body.recommendation).toBeDefined();
      expect(response.body.recommendation.title).toBeDefined();
    });
  });

  describe("GET /api/checkins/history", () => {
    it("should return check-in history for the past 14 days", async () => {
      // Create a check-in
      await request(app)
        .post("/api/checkins")
        .set("Authorization", `Bearer ${token}`)
        .send({
          stressLevel: 2,
          mood: 4,
          sleepHours: 7,
          sleepQuality: 4,
          workloadHours: 5,
          physicalActivityMinutes: 45,
        });

      const response = await request(app)
        .get("/api/checkins/history")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].riskScore).toBeDefined();
    });

    it("should return empty history array if no check-ins exist", async () => {
      const response = await request(app)
        .get("/api/checkins/history")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
