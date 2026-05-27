import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(null);
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/v1/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
          const next = encodeURIComponent(window.location.pathname);
          window.location.href = `/auth/login?next=${next}`;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getApiErrorData(error: unknown): unknown {
  if (axios.isAxiosError(error)) {
    return error.response?.data;
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const data = getApiErrorData(error);
  if (!isRecord(data)) return fallback;

  const directMessage = data.message;
  if (typeof directMessage === "string") return directMessage;

  const errorBody = data.error;
  if (isRecord(errorBody) && typeof errorBody.message === "string") {
    return errorBody.message;
  }

  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  const data = getApiErrorData(error);
  if (!isRecord(data)) return {};

  const errorBody = data.error;
  if (isRecord(errorBody) && isRecord(errorBody.details)) {
    return fieldErrorsFromRecord(errorBody.details);
  }

  return fieldErrorsFromRecord(data);
}

function fieldErrorsFromRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string[]] => {
      const [, value] = entry;
      return Array.isArray(value) && value.every((item) => typeof item === "string");
    })
  );
}
