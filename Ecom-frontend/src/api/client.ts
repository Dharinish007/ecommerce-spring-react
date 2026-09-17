import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

// Intercept 401 responses for active sessions (excluding signin and session probe endpoints)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthProbeOrSignin = url.includes("/auth/signin") || url.includes("/auth/user");
      if (!isAuthProbeOrSignin && unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string>;
}

// Centralized error message extractor
export function extractErrorMessage(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred."
): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | string>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (data) {
      if (typeof data === "string") return data;

      // When field validation errors exist, format them clearly
      if (data.validationErrors && Object.keys(data.validationErrors).length > 0) {
        const errorDetails = Object.entries(data.validationErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("; ");
        return data.message ? `${data.message}: ${errorDetails}` : errorDetails;
      }

      if (data.message && data.message.trim() !== "") {
        return data.message;
      }
      if (data.error && data.error.trim() !== "") {
        return data.error;
      }
    }

    // Meaningful status code fallbacks when backend doesn't provide explicit message
    if (status === 400) return "Invalid request. Please check your inputs.";
    if (status === 401) return "Your session has expired or you are not authorized. Please log in.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "The requested resource could not be found.";
    if (status && status >= 500) return "A server error occurred. Please try again later.";

    if (axiosError.message) {
      if (
        axiosError.message.includes("Network Error") ||
        axiosError.code === "ERR_NETWORK" ||
        axiosError.message.includes("net::ERR_CONNECTION_REFUSED")
      ) {
        return "Cannot connect to server. Please check that the Spring Boot backend is running.";
      }
      return axiosError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export default apiClient;
