import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import scheduleRoutes from "./routes/schedule.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import questionnaireRoutes from "./routes/questionnaireRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import { connectDB } from "./lib/db.js";
import { seedAdminUser } from "./lib/seedAdmin.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.use("/api/auth", authRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await seedAdminUser();
});