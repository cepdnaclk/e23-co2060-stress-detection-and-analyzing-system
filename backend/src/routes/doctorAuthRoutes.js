import express from "express";

import { loginVolunteerDoctor } from "../controllers/doctorModuleController.js";

const router = express.Router();

router.post("/login", loginVolunteerDoctor);

export default router;
