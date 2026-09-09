const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TOKEN_KEY = "nearby_token";
const USER_KEY = "nearby_user";
const PLACES_CACHE_KEY = "nearby_places_cache";
const SAVED_CACHE_KEY = "nearby_saved_cache";
const PENDING_SYNC_KEY = "nearby_pending_sync";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  // Logging out only clears the local session. It never deletes server-side
  // saved data -- logging back in restores it from the server.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (email, password, name) => request("/api/auth/signup", { method: "POST", body: { email, password, name }, auth: false }),
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/api/auth/me"),
  places: () => request("/api/places", { auth: false }),
  saved: () => request("/api/saved"),
  save: (placeId) => request("/api/saved", { method: "POST", body: { placeId } }),
  unsave: (placeId) => request(`/api/saved/${placeId}`, { method: "DELETE" }),
  friends: () => request("/api/friends"),
  addFriend: (email) => request("/api/friends", { method: "POST", body: { email } }),
  feed: () => request("/api/feed"),
  postUpdate: (message, placeId) => request("/api/feed", { method: "POST", body: { message, placeId } }),
};

// ---------- Local cache helpers (offline-first) ----------

export function cachePlaces(places) {
  localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(places));
}
export function getCachedPlaces() {
  const raw = localStorage.getItem(PLACES_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function cacheSaved(saved) {
  localStorage.setItem(SAVED_CACHE_KEY, JSON.stringify(saved));
}
export function getCachedSaved() {
  const raw = localStorage.getItem(SAVED_CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Pending sync queue: actions taken while offline, flushed when back online.
export function getPendingSync() {
  const raw = localStorage.getItem(PENDING_SYNC_KEY);
  return raw ? JSON.parse(raw) : [];
}
export function setPendingSync(queue) {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(queue));
}
export function queuePendingSync(action) {
  const queue = getPendingSync();
  queue.push(action);
  setPendingSync(queue);
}
export function isPendingSync(placeId) {
  return getPendingSync().some((a) => a.placeId === placeId);
}
