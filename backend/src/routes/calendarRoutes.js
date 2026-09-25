import express from "express";
import { generateAuthUrlController, callback, getStatus, createEvent, updateEvent, deleteEvent } from "../controllers/calendarController.js";
import { authenticate } from "../middleware/authMiddleware.js"; 

const router = express.Router();

/**
 * Calendar Routes
 */
// Generate auth URL
router.get("/auth", authenticate, generateAuthUrlController);

// Google OAuth callback
router.get("/callback", callback);

// Get Google Calendar connection status
router.get("/status", authenticate, getStatus);

// Create, Update, Delete events
router.post("/events", authenticate, createEvent);
router.put("/events", authenticate, updateEvent);
router.delete("/events/:eventId", authenticate, deleteEvent);

export default router;
