/**
 * therapyHubAdminApi.js
 *
 * Thin API wrapper for the Admin Therapy Hub Management screen.
 * All requests include the Bearer token and hit /api/admin/therapy-audios/*.
 */

import { API_URL } from "../../constants/api";

const BASE = `${API_URL}/admin/therapy-audios`;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Safely parses a fetch response as JSON.
 * Returns null if the body is not valid JSON (e.g. HTML error page from a proxy).
 */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extracts a human-readable error message from a failed response.
 * Handles both JSON and HTML bodies gracefully.
 */
async function extractError(res, fallback = "Request failed") {
  const data = await safeJson(res);
  if (data?.message) return data.message;
  // If the response was HTML or unparseable, give a clear diagnostic message
  return `${fallback} (HTTP ${res.status} — the backend may not be deployed yet or a network error occurred)`;
}

/** Fetch all exercises (includes `grouped` map) */
export async function getAudios(token) {
  const res = await fetch(BASE, { headers: authHeader(token) });
  if (!res.ok) throw new Error(await extractError(res, "Failed to load audios"));
  const data = await safeJson(res);
  return data ?? { exercises: [], grouped: {} };
}

/** Fetch distinct categories */
export async function getCategories(token) {
  const res = await fetch(`${BASE}/categories`, { headers: authHeader(token) });
  if (!res.ok) throw new Error(await extractError(res, "Failed to load categories"));
  const data = await safeJson(res);
  return data?.categories ?? [];
}

/**
 * Create a new exercise.
 * @param {string} token
 * @param {object} fields  – { title, category, description, displayOrder, recommendedStressLevels, thumbnail }
 * @param {object|null} fileAsset – expo-document-picker asset { uri, name, mimeType }
 */
export async function createAudio(token, fields, fileAsset) {
  const form = buildFormData(fields, fileAsset);
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeader(token),
    body: form,
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to create audio"));
  return data;
}

/**
 * Update an exercise.
 * @param {string} token
 * @param {string} id
 * @param {object} fields
 * @param {object|null} fileAsset – if provided, replaces the existing audio file
 */
export async function updateAudio(token, id, fields, fileAsset) {
  const form = buildFormData(fields, fileAsset);
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: authHeader(token),
    body: form,
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to update audio"));
  return data;
}

/** Delete an exercise by id */
export async function deleteAudio(token, id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to delete audio"));
  return data;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function buildFormData(fields, fileAsset) {
  const form = new FormData();

  if (fields.title !== undefined)        form.append("title",       fields.title);
  if (fields.category !== undefined)     form.append("category",    fields.category);
  if (fields.description !== undefined)  form.append("description", fields.description);
  if (fields.displayOrder !== undefined) form.append("displayOrder", String(fields.displayOrder));
  if (fields.thumbnail !== undefined)    form.append("thumbnail",   fields.thumbnail);
  if (fields.recommendedStressLevels !== undefined) {
    form.append("recommendedStressLevels", JSON.stringify(fields.recommendedStressLevels));
  }

  if (fileAsset) {
    form.append("file", {
      uri: fileAsset.uri,
      name: fileAsset.name ?? "audio.mp3",
      type: fileAsset.mimeType ?? "audio/mpeg",
    });
  }

  return form;
}
