// src/services/authService.js
// Centralises all auth API calls and token management for the frontend

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Token helpers ────────────────────────────────────────
export const getAccessToken  = () => sessionStorage.getItem("accessToken");
export const setAccessToken  = (t) => sessionStorage.setItem("accessToken", t);
export const clearAccessToken = () => sessionStorage.removeItem("accessToken");

export const getUser  = () => {
  const raw = sessionStorage.getItem("user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const setUser  = (u) => sessionStorage.setItem("user", JSON.stringify(u));
export const clearUser = () => sessionStorage.removeItem("user");

// ── Generic fetch wrapper ────────────────────────────────
async function apiCall(path, options = {}) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",           // send httpOnly cookie (refreshToken)
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  // Auto-refresh if access token expired
  if (res.status === 401 && data.code === "TOKEN_EXPIRED") {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry original request once with new token
      return apiCall(path, options);
    } else {
      clearAccessToken();
      clearUser();
      window.location.href = "/";
      return null;
    }
  }

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    throw err;
  }

  return data;
}

// ── Auth calls ───────────────────────────────────────────
export const login = async (username, password) => {
  const data = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAccessToken(data.accessToken);
  setUser(data.user);
  return data;
};

export const logout = async () => {
  try {
    await apiCall("/auth/logout", { method: "POST" });
  } catch (_) { /* ignore */ }
  clearAccessToken();
  clearUser();
};

export const refreshTokens = async () => {
  try {
    const data = await fetch(`${BASE}/auth/refresh`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({}),
    }).then((r) => r.json());

    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const getMe = () => apiCall("/auth/me");

export const updateWallet = (walletAddress) =>
  apiCall("/users/me/wallet", {
    method: "PATCH",
    body:   JSON.stringify({ walletAddress }),
  });

export const changePassword = (currentPassword, newPassword) =>
  apiCall("/users/me/password", {
    method: "PATCH",
    body:   JSON.stringify({ currentPassword, newPassword }),
  });

// Admin only
export const getAllUsers = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiCall(`/users${qs ? `?${qs}` : ""}`);
};

export const deleteUserById = (id) =>
  apiCall(`/users/${id}`, { method: "DELETE" });

export const updateUserById = (id, body) =>
  apiCall(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) });