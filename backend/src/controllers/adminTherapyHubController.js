/**
 * adminTherapyHubController.js
 *
 * Admin CRUD operations for Therapy Hub audio exercises.
 *
 * Routes (all under /api/admin/therapy-audios, protected by authenticate + requireAdmin):
 *   GET    /categories          → distinct list of category strings
 *   GET    /                    → all exercises, grouped by category
 *   POST   /                    → create a new exercise (audio upload via multipart)
 *   PUT    /:id                 → update exercise metadata; optionally replace audio file
 *   DELETE /:id                 → delete exercise + its blob
 */

import { v4 as uuidv4 } from "uuid";
import TherapyHubExercise from "../models/TherapyHubExercise.js";
import {
  uploadAudioBlob,
  deleteBlob,
  buildBlobUrl,
} from "../services/azureBlobService.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a safe file name from the original file name + a UUID suffix.
 * Keeps the extension and replaces problematic characters.
 */
function sanitizeFileName(originalName) {
  const ext = originalName.split(".").pop().toLowerCase();
  const base = originalName
    .replace(/\.[^.]+$/, "")       // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")   // replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "")       // trim leading/trailing dashes
    .slice(0, 60);                  // reasonable length limit
  return `${base}-${uuidv4().slice(0, 8)}.${ext}`;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/therapy-audios/categories
 * Returns a sorted list of distinct category strings from the database.
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await TherapyHubExercise.distinct("category");
    return res.status(200).json({
      success: true,
      categories: categories.sort(),
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/admin/therapy-audios
 * Returns all exercises sorted by displayOrder, grouped by category.
 */
export const getAllAudios = async (req, res) => {
  try {
    const exercises = await TherapyHubExercise.find()
      .sort({ category: 1, displayOrder: 1 })
      .lean();

    // Group by category preserving sort order
    const categoryMap = {};
    for (const ex of exercises) {
      if (!categoryMap[ex.category]) categoryMap[ex.category] = [];
      categoryMap[ex.category].push(ex);
    }

    return res.status(200).json({
      success: true,
      exercises,
      grouped: categoryMap,
    });
  } catch (error) {
    console.error("Error in getAllAudios:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * POST /api/admin/therapy-audios
 * Creates a new exercise.  Audio file is uploaded to Azure Blob Storage.
 *
 * Body (multipart/form-data):
 *   - file            (required) – audio file
 *   - title           (required)
 *   - category        (required)
 *   - description     (optional)
 *   - displayOrder    (optional, numeric)
 *   - recommendedStressLevels (optional, JSON array string OR comma-separated)
 *   - thumbnail       (optional, URL string)
 */
export const createAudio = async (req, res) => {
  try {
    const { title, category, description, displayOrder, recommendedStressLevels, thumbnail } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "category is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Audio file is required" });
    }

    const fileName = sanitizeFileName(req.file.originalname);
    const audioUrl = await uploadAudioBlob(
      category.trim(),
      fileName,
      req.file.buffer,
      req.file.mimetype
    );

    // Parse stress levels — accept JSON array or comma-separated string
    let stressLevels = [];
    if (recommendedStressLevels) {
      try {
        stressLevels = JSON.parse(recommendedStressLevels);
      } catch {
        stressLevels = String(recommendedStressLevels).split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const exercise = new TherapyHubExercise({
      title: title.trim(),
      description: description?.trim() || "",
      category: category.trim(),
      audioUrl,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      recommendedStressLevels: stressLevels,
      thumbnail: thumbnail?.trim() || "",
    });

    await exercise.save();

    return res.status(201).json({
      success: true,
      message: "Audio created successfully",
      exercise,
    });
  } catch (error) {
    console.error("Error in createAudio:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

/**
 * PUT /api/admin/therapy-audios/:id
 * Updates exercise metadata.  If a new audio file is provided, it is uploaded
 * FIRST, then MongoDB is updated, then the old blob is deleted.
 *
 * Body (multipart/form-data):
 *   - file                    (optional) – new audio file to replace existing
 *   - title, description, category, displayOrder, recommendedStressLevels, thumbnail (all optional)
 */
export const updateAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await TherapyHubExercise.findById(id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }

    const {
      title, category, description, displayOrder,
      recommendedStressLevels, thumbnail,
    } = req.body;

    let newAudioUrl = null;
    const oldAudioUrl = exercise.audioUrl;

    // ── Step 1: Upload new blob if a file was provided ────────────────────────
    if (req.file) {
      const fileName = sanitizeFileName(req.file.originalname);
      const targetCategory = (category?.trim() || exercise.category);
      newAudioUrl = await uploadAudioBlob(
        targetCategory,
        fileName,
        req.file.buffer,
        req.file.mimetype
      );
    }

    // ── Step 2: Update MongoDB ────────────────────────────────────────────────
    if (title !== undefined)       exercise.title       = title.trim();
    if (description !== undefined) exercise.description = description.trim();
    if (category !== undefined)    exercise.category    = category.trim();
    if (displayOrder !== undefined) exercise.displayOrder = Number(displayOrder);
    if (thumbnail !== undefined)   exercise.thumbnail   = thumbnail.trim();

    if (recommendedStressLevels !== undefined) {
      try {
        exercise.recommendedStressLevels = JSON.parse(recommendedStressLevels);
      } catch {
        exercise.recommendedStressLevels = String(recommendedStressLevels)
          .split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (newAudioUrl) {
      exercise.audioUrl = newAudioUrl;
    }

    await exercise.save();

    // ── Step 3: Delete old blob (only after successful DB save) ───────────────
    if (newAudioUrl && oldAudioUrl) {
      deleteBlob(oldAudioUrl).catch((err) =>
        console.error("Failed to delete old blob (non-fatal):", err.message)
      );
    }

    return res.status(200).json({
      success: true,
      message: "Audio updated successfully",
      exercise,
    });
  } catch (error) {
    console.error("Error in updateAudio:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

/**
 * DELETE /api/admin/therapy-audios/:id
 * Deletes the MongoDB record and its associated Azure Blob.
 *
 * Safe delete order:
 *   1. Find record
 *   2. Identify blob URL
 *   3. Delete blob (log failure but do not abort)
 *   4. Delete MongoDB record
 */
export const deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await TherapyHubExercise.findById(id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Exercise not found" });
    }

    const audioUrl = exercise.audioUrl;

    // Delete blob first (non-blocking on failure)
    try {
      await deleteBlob(audioUrl);
    } catch (blobErr) {
      console.error("Blob delete error (non-fatal, continuing DB delete):", blobErr.message);
    }

    await TherapyHubExercise.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Audio deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteAudio:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};
