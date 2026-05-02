import express from "express";
import {
	calculateQuestionnaireScore,
	getQuestionnaireQuestions,
	updateQuestionnaireQuestions,
} from "../controllers/questionnaireController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Questionnaire scoring route
router.post("/score", calculateQuestionnaireScore);

// Questionnaire questions
router.get("/questions", getQuestionnaireQuestions);
router.put("/questions", authenticate, requireAdmin, updateQuestionnaireQuestions);

export default router;
