import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  deleteRoutine,
  getRoutineById,
  getRoutines,
  saveRoutine,
  updateRoutine,
} from "../controllers/routineController.js";

const router = express.Router();

router.post("/save", authenticate, saveRoutine);
router.get("/", authenticate, getRoutines);
router.get("/:id", authenticate, getRoutineById);
router.put("/:id", authenticate, updateRoutine);
router.delete("/:id", authenticate, deleteRoutine);

export default router;