import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import scheduleRoutes from "./routes/schedule.js";
import routineRoutes from "./routes/routineRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import questionnaireRoutes from "./routes/questionnaireRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminDoctorRoutes from "./routes/adminDoctorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import moodHistoryRoutes from "./routes/moodHistoryRoutes.js";
import journeyRoutes from "./routes/journeyRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import doctorAuthRoutes from "./routes/doctorAuthRoutes.js";
import therapyHubRoutes from "./routes/therapyHubRoutes.js";

import { connectDB } from "./lib/db.js";
import { seedAdminUser } from "./lib/seedAdmin.js";
import { seedTherapyHubExercises } from "./lib/seedTherapyHub.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Static file hosting for uploaded files (e.g. audio files)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/routine", routineRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mood-history", moodHistoryRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor-auth", doctorAuthRoutes);
app.use("/api/therapy-hub", therapyHubRoutes);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await seedAdminUser();
    await seedTherapyHubExercises();
});