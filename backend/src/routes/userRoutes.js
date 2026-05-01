import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getMe, updateMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);

export default router;
