import axios from "axios";

// Base URL can be configured per environment; falls back to a relative "/api"
// path so the same static build can be pointed at different backends.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the auth token (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.sessionStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Centralize 401 handling so components don't each need to check for it.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.sessionStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
