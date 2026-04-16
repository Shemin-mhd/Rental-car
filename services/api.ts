/**
 * api.ts - A Fetch-based API utility with automatic token refreshing
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://rental-car-backend-7np6.onrender.com/api";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  let accessToken = localStorage.getItem("accessToken");

  // Create headers with Authorization if token exists
  const headers: Record<string, string> = {
    ...options.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, { ...options, headers });

  // Handle Token Refreshing on 401
  if (response.status === 401) {
    const refreshTokenResult = await refreshTokens();

    if (refreshTokenResult) {
      // Retry with new token
      accessToken = localStorage.getItem("accessToken");
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      };

      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
}

/**
 * Clear storage and log out
 */
export function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Handle Token Refresh logic
 */
async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    handleSessionExpired();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });

    const data = await res.json();

    if (res.ok && data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      return true;
    } else {
      handleSessionExpired();
      return false;
    }
  } catch (error) {
    console.error("Token refresh failed", error);
    handleSessionExpired();
    return false;
  }
}

/**
 * Handle Session Expired
 */
/**
 * Get full image URL
 */
export function getImageUrl(path: string | undefined | null): string {
  const LUXURY_PLACEHOLDER = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000";
  
  if (!path || path === "" || path === "null" || path === "undefined") {
    return LUXURY_PLACEHOLDER;
  }
  
  if (path.startsWith("http")) {
    return path;
  }

  // Use the IP address from .env.local
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rental-car-backend-7np6.onrender.com/api";
  return `${BASE_URL}/uploads/${path}`;
}

function handleSessionExpired() {
  logoutUser();
  if (typeof window !== "undefined") {
    window.location.href = "/login?session=expired";
  }
}
