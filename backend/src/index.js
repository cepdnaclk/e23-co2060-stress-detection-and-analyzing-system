import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";

import { connectDB } from "./lib/db.js";
import scheduleRoutes from "./routes/schedule.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});