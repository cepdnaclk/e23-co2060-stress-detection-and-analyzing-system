import { create } from "zustand";
import { API_URL } from "../constants/api";

const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  register: async (username, age, gender, password) => {
    set({ isLoading: true });
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          age,
          gender,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      // Do not persist auth; keep it in memory only
      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.name === "AbortError"
          ? "Request timed out. Check backend server and API URL."
          : error.message;

      set({ isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });

    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      // Do not persist auth; keep it in memory only
      set({ token: data.token, user: data.user, isLoading: false });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.name === "AbortError"
          ? "Request timed out. Check backend server and API URL."
          : error.message;

      set({ isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  checkAuth: async () => {
    // No persisted auth; always start logged out
    set({ user: null, token: null });
  },

  logout: async () => {
    // Clear in-memory auth state only
    set({ token: null, user: null });
  },
}));
