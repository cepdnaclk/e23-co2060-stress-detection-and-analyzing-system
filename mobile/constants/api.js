import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiHost() {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostMatch = hostUri.match(/^(?:[a-z]+:\/\/)?([^:/]+)/i);
    if (hostMatch?.[1]) return `http://${hostMatch[1]}:3000/api`;
  }

  const fallback = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${fallback}:3000/api`;
}

export const API_URL = resolveApiHost();

export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
