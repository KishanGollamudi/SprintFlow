// ─────────────────────────────────────────────────────────────
// src/services/api.js
// Axios instance with:
//   - Base URL from env variable
//   - JWT Bearer token on every request
//   - Automatic token refresh on 401
//   - Consistent error unwrapping
// ─────────────────────────────────────────────────────────────

import axios from "axios";

// In dev the Vite proxy forwards /api → http://localhost:8080, so use a
// relative base. In production set VITE_API_BASE_URL to the full origin
// (e.g. https://api.example.com/api) — do NOT include a trailing /api when
// the env var already contains it.
// In development use the Vite dev server proxy (relative `/api`) to avoid CORS.
// In production use the configured `VITE_API_BASE_URL` if provided.
const BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request interceptor — attach access token ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handle 401 & refresh token ─────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token),
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data, // unwrap { success, data, message }
  async (error) => {
    const original = error.config;

    // Network errors or cancelled requests have no config — bail out early
    if (!original) {
      return Promise.reject(new Error(error.message || "Network error"));
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Strip trailing /api from base URL to avoid double /api/api/auth/refresh
        const rawBase = import.meta.env.DEV
          ? ""
          : (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/i, "");
        const res = await axios.post(`${rawBase}/api/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const newToken = res.data?.data?.accessToken ?? res.data?.accessToken;
        if (!newToken) throw new Error("Refresh response missing accessToken");
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Unwrap backend error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export default api;
