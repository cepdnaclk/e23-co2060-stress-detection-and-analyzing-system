import express from "express";
import { calculateQuestionnaireScore } from "../controllers/questionnaireController.js";

const router = express.Router();

// Questionnaire scoring route
router.post("/score", calculateQuestionnaireScore);

export default router;
