import express from "express";
import multer from "multer";
import { getAdminOverview, getAdminUsers, getAdmins, createAdmin, updateAdminStatus } from "../controllers/adminController.js";
import { authenticate, requireAdmin, requireSuperAdmin } from "../middleware/authMiddleware.js";
import {
  getAllAudios,
  getCategories,
  createAudio,
  updateAudio,
  deleteAudio,
} from "../controllers/adminTherapyHubController.js";

const router = express.Router();

// ─── Multer (memory storage – file is forwarded to Azure, not saved locally) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm", "audio/aac", "video/mp4"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  },
});

// ─── Super Admin Routes ─────────────────────────────────────────────────────────
router.get("/admins", authenticate, requireSuperAdmin, getAdmins);
router.post("/admins", authenticate, requireSuperAdmin, createAdmin);
router.patch("/admins/:id/status", authenticate, requireSuperAdmin, updateAdminStatus);

// ─── Existing admin routes ────────────────────────────────────────────────────
router.get("/overview", authenticate, requireAdmin, getAdminOverview);
router.get("/users", authenticate, requireAdmin, getAdminUsers);

// ─── Therapy Hub Management routes ───────────────────────────────────────────
// IMPORTANT: /categories must come before /:id to avoid route conflict
router.get("/therapy-audios/categories", authenticate, requireAdmin, getCategories);
router.get("/therapy-audios",            authenticate, requireAdmin, getAllAudios);
router.post("/therapy-audios",           authenticate, requireAdmin, upload.single("file"), createAudio);
router.put("/therapy-audios/:id",        authenticate, requireAdmin, upload.single("file"), updateAudio);
router.delete("/therapy-audios/:id",     authenticate, requireAdmin, deleteAudio);

export default router;
