/**
 * azureBlobService.js
 *
 * All Azure Blob Storage operations for therapy-hub audio files.
 *
 * Environment variables required:
 *   AZURE_STORAGE_CONNECTION_STRING  – full connection string from Azure Portal
 *   AZURE_STORAGE_CONTAINER_NAME     – container name (default: "audio")
 */

import { BlobServiceClient } from "@azure/storage-blob";

const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "audio";

/**
 * Returns a BlobServiceClient.  Throws clearly if credentials are missing.
 */
function getServiceClient() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not set in environment variables."
    );
  }
  return BlobServiceClient.fromConnectionString(connStr);
}

/**
 * Derives the blob name from an Azure Blob URL.
 *
 * E.g.
 *   "https://carewave12345.blob.core.windows.net/audio/relaxation/1-brief-mindfulness.mp3"
 *   → "relaxation/1-brief-mindfulness.mp3"
 *
 * Returns null when the URL does not belong to Azure Blob Storage.
 */
export function blobNameFromUrl(audioUrl) {
  if (!audioUrl) return null;
  try {
    const url = new URL(audioUrl);
    // pathname looks like: /audio/relaxation/filename.mp3
    const parts = url.pathname.split("/").filter(Boolean);
    // parts[0] is the container name, the rest is the blob name
    if (parts.length < 2) return null;
    return parts.slice(1).join("/");
  } catch {
    return null;
  }
}

/**
 * Constructs the public Azure Blob URL for a given category + file name.
 *
 * For SAS-less public containers the URL is deterministic.
 */
export function buildBlobUrl(category, fileName) {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set.");
  }
  // Parse account name from connection string
  const accountMatch = connStr.match(/AccountName=([^;]+)/i);
  if (!accountMatch) {
    throw new Error("Cannot parse AccountName from AZURE_STORAGE_CONNECTION_STRING.");
  }
  const account = accountMatch[1];
  const safeCat  = category.toLowerCase().replace(/\s+/g, "-");
  return `https://${account}.blob.core.windows.net/${CONTAINER_NAME}/${safeCat}/${fileName}`;
}

/**
 * Uploads an audio file Buffer to Azure Blob Storage.
 *
 * @param {string} category   – display category string (will be lowercased/slugified for the path)
 * @param {string} fileName   – sanitised file name (e.g. "calm-piano.mp3")
 * @param {Buffer} buffer     – file content
 * @param {string} mimeType   – MIME type (e.g. "audio/mpeg")
 * @returns {Promise<string>} – the public URL of the uploaded blob
 */
export async function uploadAudioBlob(category, fileName, buffer, mimeType) {
  const client    = getServiceClient();
  const container = client.getContainerClient(CONTAINER_NAME);

  // Slugify category for the path: "Calm Music" → "calm-music"
  const safeCat  = category.toLowerCase().replace(/\s+/g, "-");
  const blobName = `${safeCat}/${fileName}`;

  const blockBlob = container.getBlockBlobClient(blobName);

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType || "audio/mpeg" },
  });

  return blockBlob.url;
}

/**
 * Deletes a blob identified by its full Azure Blob URL.
 * Resolves quietly when the blob does not exist (idempotent).
 *
 * @param {string} audioUrl – the blob's public URL
 * @returns {Promise<void>}
 */
export async function deleteBlob(audioUrl) {
  const blobName = blobNameFromUrl(audioUrl);
  if (!blobName) {
    console.warn("deleteBlob: could not derive blob name from URL:", audioUrl);
    return;
  }

  const client    = getServiceClient();
  const container = client.getContainerClient(CONTAINER_NAME);
  const blockBlob = container.getBlockBlobClient(blobName);

  try {
    await blockBlob.deleteIfExists();
  } catch (err) {
    // Log but do not rethrow — a missing blob should not abort the DB operation
    console.error("deleteBlob error (non-fatal):", err.message);
  }
}
