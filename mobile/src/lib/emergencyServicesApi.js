/**
 * emergencyServicesApi.js
 *
 * Thin API wrapper for Emergency Mental Health Services.
 * Follows the same pattern as therapyHubAdminApi.js.
 */

import { API_URL } from "../../constants/api";

const BASE = `${API_URL}/emergency-services`;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Safely parse a fetch response as JSON. Returns null on HTML/invalid body. */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Extract a human-readable error from a failed response. */
async function extractError(res, fallback = "Request failed") {
  const data = await safeJson(res);
  if (data?.message) return data.message;
  return `${fallback} (HTTP ${res.status})`;
}

/** Fetch all services — no auth required */
export async function getServices() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(await extractError(res, "Failed to load services"));
  const data = await safeJson(res);
  return data?.services ?? [];
}

/** Create a new service (admin only) */
export async function createService(token, fields) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to create service"));
  return data;
}

/** Update a service (admin only) */
export async function updateService(token, id, fields) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { ...authHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to update service"));
  return data;
}

/** Delete a service (admin only) */
export async function deleteService(token, id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message ?? await extractError(res, "Failed to delete service"));
  return data;
}
