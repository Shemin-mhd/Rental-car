/**
 * api.ts - A Fetch-based API utility with automatic token refreshing
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  // 🛡️ Pre-parse check for JSON protocol
  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/json") && response.status !== 204) {
    console.error(`[API] Protocol Mismatch: Expected JSON, got ${contentType} at ${url}`);
  }

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

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      handleSessionExpired();
      return false;
    }

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

  // Clean path from quotes and whitespace
  let cleanPath = String(path).trim().replace(/^["'](.+)["']$/, '$1');

  if (cleanPath.startsWith("http")) {
    return cleanPath;
  }

  // Handle local absolute paths (shouldn't happen but keep for stability)
  if (cleanPath.includes(":\\") || cleanPath.startsWith("/")) {
    // If it's a full path, we can't do much, but let's try to extract filename or ignore it
    if (cleanPath.includes("\\")) {
      const parts = cleanPath.split(/[\\/]/);
      cleanPath = parts[parts.length - 1];
    } else if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.slice(1);
    }
  }

  // Derive Base URL from API_URL by removing /api suffix (handles trailing slash too)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const BASE_URL = API_URL.replace(/\/api\/?$/, "");

  // If path already starts with uploads/, don't prepend it again
  if (cleanPath.startsWith("uploads/")) {
    return `${BASE_URL}/${cleanPath}`;
  }

  return `${BASE_URL}/uploads/${cleanPath}`;
}

function handleSessionExpired() {
  logoutUser();
  if (typeof window !== "undefined") {
    window.location.href = "/login?session=expired";
  }
}
