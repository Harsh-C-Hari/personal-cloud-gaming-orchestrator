/**
 * api/client.js
 *
 * Single source of truth for all HTTP communication with the FastAPI host-agent.
 * All functions map 1-to-1 with backend route handlers.
 *
 * Endpoint contracts (from host-agent/api/routes/ and api/models/):
 *
 *   GET  /games/                   → raw game_configs dict keyed by game_id
 *   POST /sessions/start           → StartSessionRequest → SessionStartResponse
 *   GET  /sessions/active          → ActiveSessionsResponse  (no remaining_minutes)
 *   GET  /sessions/:id             → SessionStatusResponse   (has remaining_minutes + warning_sent)
 *   POST /sessions/:id/stop        → SessionStopResponse
 */

// In production point this at the actual host-agent origin.
const BASE_URL = "http://127.0.0.1:8100";

export function getToken() {
  return localStorage.getItem(
    "access_token"
  );
}

export function setToken(
  token,
) {
  localStorage.setItem(
    "access_token",
    token,
  );
}

export function clearToken() {

  localStorage.removeItem(
      "access_token"
  );

  localStorage.removeItem(
      "username"
  );

  localStorage.removeItem(
      "role"
  );
}

export function isLoggedIn() {
  return !!getToken();
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

/**
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method
 * @param {string} path
 * @param {object|undefined} body
 * @returns {Promise<any>}
 * @throws {Error} with `message` set to the backend `detail` string
 */
function formatApiError(data, fallback) {
  if (!data) return fallback;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((err) => {
        const field = Array.isArray(err.loc)
          ? err.loc.join(".")
          : "field";

        return `${field}: ${err.msg}`;
      })
      .join(" ");
  }

  return fallback;
}

async function apiFetch(method, path, body) {

  const token = getToken();

  const headers = {};

  if (body) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers["Authorization"] =
      `Bearer ${token}`;
  }

  const init = {
    method,
    cache: "no-store",
    headers,
    body: body
      ? JSON.stringify(body)
      : undefined,
  };

  const res = await fetch(
    BASE_URL + path,
    {
      ...init,
      cache: "no-store",
    }
  );

  let data = null;

  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {

    if (
        res.status === 401 &&
        path !== "/auth/login"
    ) {
        clearToken();

        window.location.href =
            "/login";
    }

    throw new Error(
      formatApiError(
        data,
        `Request failed with status ${res.status}`
      )
    );
  }

  return data;
}

// ─── Games ────────────────────────────────────────────────────────────────

/**
 * GET /games/
 *
 * Returns the raw game_configs dict from save_manager.
 * Shape: { [game_id: string]: { name, exe_name, exe_path, save_path, process_name } }
 */
export async function fetchGames() {
  return apiFetch("GET", "/games/list_games");
}

export async function reloadGames() {
  return apiFetch("GET", "/games/reload");
}

// ─── Sessions — list ──────────────────────────────────────────────────────

/**
 * GET /sessions/active
 *
 * Returns only the lightweight list — no remaining_minutes here.
 * Shape: { sessions: Array<{ session_id, user_id, game_id, status }> }
 */
export async function fetchActiveSessions() {
  return apiFetch("GET", "/sessions/active");
}

// ─── Sessions — detail ────────────────────────────────────────────────────

/**
 * GET /sessions/:sessionId
 *
 * Full status including remaining_minutes (float | null) and warning_sent (bool).
 * Shape: { session_id, user_id, game_id, status, remaining_minutes, warning_sent }
 *
 * Throws 404 if session has been removed from the in-memory registry
 * (10 s after completed/failed, per session_service.py _cleanup_registry_entry).
 */
export async function fetchSessionStatus(sessionId) {
  return apiFetch("GET", `/sessions/${sessionId}`);
}

// ─── Sessions — lifecycle ─────────────────────────────────────────────────

/**
 * POST /sessions/start
 *
 * Body maps 1-to-1 with StartSessionRequest pydantic model.
 * @param {{
 *   user_id:    string,
 *   game_id:    string,
 *   duration:   number,
 *   warning:    number,
 *   skip_timer: boolean,
 *   load_save:  string | null,
 * }} payload
 * @returns {Promise<{ success: boolean, session_id: string, message: string }>}
 */
export async function startSession(payload) {
  return apiFetch("POST", "/sessions/start", payload);
}

/**
 * POST /sessions/:sessionId/stop
 *
 * IMPORTANT: session_service.stop_session() sets status = "stopped" in the
 * registry but does NOT broadcast a WebSocket event. The frontend must rely
 * on polling (useSessions 5 s interval) to reflect the stopped state.
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function stopSession(sessionId) {
  return apiFetch("POST", `/sessions/${sessionId}/stop`);
}

export async function fetchSaves(
    gameId,
) {
    if (!gameId) {
        return {
            latest_exists: false,
            archives: [],
            backups: [],
        };
    }

    return apiFetch(
        "GET",
        `/saves/${encodeURIComponent(gameId)}`
    );
}

export async function deleteSave(
    gameId,
    saveType,
    saveName,
) {
    return apiFetch(
        "DELETE",
        `/saves/${
            encodeURIComponent(gameId)
        }/${
            encodeURIComponent(saveType)
        }/${
            encodeURIComponent(saveName)
        }`
    );
}

export async function validateGame(
    gameId
) {
    return apiFetch(
        "GET",
        `/games/${encodeURIComponent(gameId)}/validate`
    );
}

export async function fetchHostStatus() {
  return apiFetch(
      "GET",
      "/host/status"
  );
}

export async function fetchHostMetrics() {
  return apiFetch(
      "GET",
      "/host/metrics"
  );
}

export async function fetchSessionHistory(limit = 20) {

    const role =
        localStorage.getItem("role");

    const endpoint =
        role === "admin"
            ? "/sessions/history"
            : "/sessions/my-history";

    return apiFetch(
        "GET",
        `${endpoint}?limit=${limit}`
    );
}

export async function fetchSessionEvents({
    limit = 50,
    sessionId = "",
} = {}) {

    const role =
        localStorage.getItem("role");

    const endpoint =
        role === "admin"
            ? "/sessions/events"
            : "/sessions/my-events";

    const params =
        new URLSearchParams();

    params.set(
        "limit",
        String(limit)
    );

    if (sessionId) {
        params.set(
            "session_id",
            sessionId
        );
    }

    return apiFetch(
        "GET",
        `${endpoint}?${params.toString()}`
    );
}

export async function fetchSessionAnalytics() {

    const role =
        localStorage.getItem("role");

    return apiFetch(
        "GET",
        role === "admin"
            ? "/sessions/analytics"
            : "/sessions/my-analytics"
    );
}

export async function forceUnlockSession() {
  return apiFetch(
    "POST",
    "/sessions/unlock"
  );
}

export async function fetchSessionHealth() {
  return apiFetch(
    "GET",
    "/sessions/health"
  );
}

export async function startSunshine() {
  return apiFetch(
    "POST",
    "/host/sunshine/start"
  );
}

export async function restartSunshine() {
  return apiFetch(
    "POST",
    "/host/sunshine/restart"
  );
}

export async function enableMaintenance() {
  return apiFetch(
    "POST",
    "/host/maintenance/enable"
  );
}

export async function disableMaintenance() {
  return apiFetch(
    "POST",
    "/host/maintenance/disable"
  );
}

export async function revalidateHost() {

  return apiFetch(
    "POST",
    "/host/revalidate"
  );
}

export async function fetchRecoveryEvents(limit = 20) {
  return apiFetch(
    "GET",
    `/host/recovery-events?limit=${limit}`
  );
}

export async function fetchRecoveryStats() {
  return apiFetch(
    "GET",
    "/host/recovery-stats"
  );
}

export async function addGame(game) {
  return apiFetch(
    "POST",
    `/games/`,
    game
  );
}


export async function updateGame(
  gameId,
  game,
) {
  return apiFetch(
    "PUT",
    `/games/${gameId}`,
    game
  );
}


export async function deleteGame(gameId) {
  return apiFetch(
      "DELETE",
      `/games/${gameId}`
  );
}

export async function validateGameConfig(
  request,
) {
  return apiFetch(
      "POST",
      `/games/validate`,
      request
  );
}

export async function selectFile() {

  return apiFetch(
      "GET",
      `/system/select-file`
  );
}


export async function selectFolder() {

  return apiFetch(
      "GET",
      `/system/select-folder`
  );
}

export async function getConfig() {
    return apiFetch(
        "GET",
        "/config/"
    );
}

export async function updateConfig(
    section,
    data,
) {

  return apiFetch(
      "PUT",
      `/config/${section}`,
      data
  );
}

export async function fetchTailscaleStatus() {
  return apiFetch(
      "GET",
      "/host/tailscale/status"
  );
}

export async function getLogs(
    level = null,
    session = null,
    search = null,
) {

    const role =
        localStorage.getItem("role");

    const endpoint =
        role === "admin"
            ? "/admin/logs"
            : "/admin/my-logs";
  
    const params =
        new URLSearchParams();

    if (level) {

        params.append(
            "level",
            level
        );
    }

    if (session) {

        params.append(
            "session",
            session
        );
    }

    if (search) {
        params.append(
            "search",
            search
        );
    }

    return apiFetch(
        "GET",
        `${endpoint}?${params}`
    );
}

export async function getLogSessions() {

    const role =
        localStorage.getItem("role");

    return apiFetch(
        "GET",
        role === "admin"
            ? "/admin/log-sessions"
            : "/admin/my-log-sessions"
    );
}

export function getApiUrl(path) {
    return BASE_URL + path;
}

export async function getSunshineStream() {

    return apiFetch(
        "GET",
        "/host/sunshine/stream"
    );
}

export async function fetchStreamHistory(limit = 20) {
  return apiFetch(
    "GET",
    `/host/sunshine/history?limit=${limit}`
  );
}

export async function closeSunshineStream() {
    return apiFetch(
        "POST",
        "/host/sunshine/close-stream"
    );
}

export async function login(
  username,
  password,
) {
  return apiFetch(
    "POST",
    "/auth/login",
    {
      username,
      password,
    }
  );
}

export async function fetchUsers() {
    return apiFetch(
        "GET",
        "/auth/users"
    );
}

export async function createUser(
    request,
) {
    return apiFetch(
        "POST",
        "/auth/users",
        request,
    );
}

export async function deleteUser(
    username,
) {
    return apiFetch(
        "DELETE",
        `/auth/users/${encodeURIComponent(
            username
        )}`
    );
}

export async function deleteAllUsers() {
    return apiFetch(
        "DELETE",
        "/auth/users"
    );
}

export async function changePassword(
    request,
) {
    return apiFetch(
        "PUT",
        "/auth/change-password",
        request,
    );
}

export async function bootstrapRequired() {
    return apiFetch(
        "GET",
        "/auth/bootstrap-required"
    );
}

export async function bootstrapAdmin(
    username,
    password,
) {
    return apiFetch(
        "POST",
        "/auth/bootstrap-admin",
        {
            username,
            password,
        }
    );
}

export async function restartSession(
    sessionId,
) {
    return apiFetch(
        "POST",
        `/sessions/${sessionId}/restart`
    );
}

export async function fetchUserHostStatus() {
    return apiFetch(
        "GET",
        "/host/user-status"
    );
}