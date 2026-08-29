/**
 * qa/fixtures/mock-data.js
 *
 * VALIDATION-ONLY. Not imported by any production code path.
 *
 * Provides representative backend response payloads for every endpoint
 * the frontend calls (see src/api/client.js for the authoritative list
 * of routes/shapes — these fixtures were hand-built by reading that file,
 * not guessed).
 *
 * Each exported builder takes a `state` and returns the JSON body the
 * matching endpoint should respond with for that state. States are:
 *
 *   normal    — typical populated data, nothing alarming
 *   empty     — zero records (first-run / freshly cleared)
 *   error     — this endpoint should fail (harness returns HTTP 500)
 *   attention — a warning/degraded condition is present
 *   active    — something is actively running (session live, stream live)
 *   long      — many records, to check overflow/scroll/density
 *
 * Not every endpoint has a meaningful variant for every state — where a
 * state doesn't apply, the builder just returns the `normal` shape. This
 * is intentional (see qa/README.md "Which states apply to which page").
 */

const NOW = Date.parse("2026-08-16T15:00:00Z");
const iso = (offsetMs) => new Date(NOW + offsetMs).toISOString();
// Several endpoints (sessionHistory's started_at/ended_at/game_ended_at/
// last_restart_time, streamHistory's started_at, sessionEvents' time) are
// read by their components as Unix seconds (`new Date(x * 1000)`), not ISO
// strings — unixSec() is the seconds-based counterpart to iso() for those.
const unixSec = (offsetMs) => Math.floor((NOW + offsetMs) / 1000);

// ── /host/status ────────────────────────────────────────────────────────
// Shape verified against host-agent/api/routes/host.py get_host_status()
// AND cross-checked against every `status.<field>` accessor actually used
// in HostStatusPanel.jsx + dashboard/utils/alerts.js. This is intentionally
// a FLAT object — earlier draft fixtures nested sunshine/tailscale/system
// under sub-objects, which does not match the real backend and produced
// false "Sunshine Offline"/"Tailscale Offline" alerts in early QA renders
// (see .ai/DECISIONS.md D-007). Do not re-nest without re-checking host.py.
export function hostStatus(state) {
  const base = {
    startup_completed: true,
    startup_issues: [],
    last_validation: iso(-4 * 3600_000),
    host_ready: true,
    host_ready_reason: "Ready",
    maintenance_mode: false,
    recovery_required: false,
    recovery_reason: null,
    host_state: "running",
    sunshine_running: true,
    sunshine_can_stop: false,
    sunshine_api_reachable: true,
    sunshine_apps_count: 3,
    sunshine_client_count: 1,
    sunshine_error: null,
    tailscale_running: true,
    gpu_available: true,
    disk_free_gb: 412.6,
    active_session_count: 0,
  };
  if (state === "attention") {
    return { ...base, host_ready: false, host_ready_reason: "Host health critical" };
  }
  if (state === "active") {
    return { ...base, active_session_count: 1, sunshine_can_stop: true, sunshine_client_count: 1 };
  }
  return base;
}

// ── /host/metrics ───────────────────────────────────────────────────────
// Shape verified against host_agent/host_monitor.py get_metrics() AND every
// `metrics.<field>` accessor used in HostStatusPanel.jsx.
export function hostMetrics(state) {
  const base = {
    hostname: "LAPTOP-RDCFAJT3",
    os: "Windows",
    os_version: "Windows 11",
    machine_type: "Laptop",
    uptime_hours: 186.5,
    health: "healthy",
    cpu_name: "AMD Ryzen 7 5800H",
    cpu_percent: 18,
    cpu_cores: 8,
    ram_percent: 34,
    ram_total_gb: 16,
    ram_available_gb: 10.5,
    disk_name: "NVMe SSD",
    disk_percent: 52,
    disk_free_gb: 412.6,
    integrated_gpu: "AMD Radeon Graphics",
    dedicated_gpu: "NVIDIA GeForce RTX 3060",
    gpu_class: "Gaming",
    gpu_vendor: "NVIDIA",
    gpu_percent: 12,
    gpu_memory_percent: 22,
    gpu_temp: 54,
  };
  if (state === "attention") {
    return { ...base, health: "warning", cpu_percent: 94, ram_percent: 91, gpu_percent: 88, gpu_temp: 79 };
  }
  if (state === "active") {
    return { ...base, cpu_percent: 61, ram_percent: 54, gpu_percent: 70, gpu_temp: 66 };
  }
  return base;
}

// ── /games/list_games, /games/user_games ────────────────────────────────
export function games(state) {
  if (state === "empty") return {};
  const base = {
    re9: { name: "Resident Evil Requiem", exe_name: "re9.exe", process_name: "re9.exe" },
    notepad_test: { name: "Notepad Test Game", exe_name: "notepad.exe", process_name: "notepad.exe" },
    froza_horizon_6: { name: "Froza Horizon 6", exe_name: "forzahorizon6.exe", process_name: "forzahorizon6.exe" },
  };
  if (state === "long") {
    const many = { ...base };
    const names = ["Elden Ring", "Baldur's Gate 3", "Cyberpunk 2077", "Hades II", "Hollow Knight",
      "Sea of Thieves", "Death Stranding", "Control", "Returnal", "Alan Wake 2", "Diablo IV", "Starfield"];
    names.forEach((n, i) => {
      const id = `g_${i}_${n.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      many[id] = { name: n, exe_name: `${id}.exe`, process_name: `${id}.exe` };
    });
    return many;
  }
  return base;
}

// ── /sessions/active ─────────────────────────────────────────────────────
export function activeSessions(state) {
  if (state === "active") {
    return {
      sessions: [
        { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "running",
          remaining_minutes: 42, warning_sent: false, fetchedAt: NOW },
      ],
    };
  }
  return { sessions: [] };
}

// ── /sessions/history, /sessions/my-history ──────────────────────────────
// Shape verified against every `item.<field>` accessor actually used in
// SessionHistory.jsx (re-derived from the component source for P7-T08):
// wrapper key is `history` (not `sessions`), the played-time field is
// `played_seconds` (not `duration_seconds` — `duration_seconds` isn't read
// anywhere in this component), and `started_at`/`ended_at`/`game_ended_at`/
// `last_restart_time` are all Unix-seconds timestamps consumed via
// `formatDate()`'s `new Date(timestamp * 1000)` (an ISO string here
// produces "Invalid Date", the same failure mode CURRENT_TASK.md flagged
// for streamHistory()'s started_at). Also added the previously-missing
// `error`, `integrity_verified`, `restart_count`, and `restore_verified`
// fields the detail-expansion view reads.
export function sessionHistory(state) {
  if (state === "empty") return { history: [] };
  const one = {
    session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "completed",
    error: null, played_seconds: 27,
    started_at: unixSec(-27_000), ended_at: unixSec(0), game_ended_at: unixSec(-2_000),
    integrity_verified: true, restart_count: 0, restore_verified: true,
    last_restart_time: null,
  };
  if (state === "long") {
    const rows = [];
    const games = ["notepad_test", "re9", "froza_horizon_6"];
    const users = ["tony", "harsh", "admin", "nishant"];
    const statuses = ["completed", "completed", "completed", "failed", "stopped"];
    for (let i = 0; i < 60; i++) {
      const status = statuses[i % statuses.length];
      const recovered = i % 9 === 0;
      rows.push({
        session_id: `s${1000 + i}`,
        user_id: users[i % users.length],
        game_id: games[i % games.length],
        status: recovered ? "failed" : status,
        error: recovered ? "Recovered after backend restart" : status === "failed" ? "Process exited unexpectedly" : null,
        played_seconds: 60 + (i % 5) * 45,
        started_at: unixSec(-i * 3_600_000),
        ended_at: unixSec(-i * 3_600_000 + 90_000),
        game_ended_at: unixSec(-i * 3_600_000 + 88_000),
        integrity_verified: i % 4 !== 0,
        restart_count: recovered ? 1 : 0,
        restore_verified: status !== "failed",
        last_restart_time: recovered ? unixSec(-i * 3_600_000 + 5_000) : null,
      });
    }
    return { history: rows };
  }
  return { history: [one] };
}

// ── /sessions/events, /sessions/my-events ────────────────────────────────
export function sessionEvents(state) {
  if (state === "empty") return { events: [] };
  const base = [
    { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "completed", time: (NOW - 0) / 1000, message: "Session completed" },
    { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "cleaning", time: (NOW - 12_000) / 1000, message: "Cleaning up" },
    { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "stopping", time: (NOW - 16_000) / 1000, message: "Stopping" },
    { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "running", time: (NOW - 27_000) / 1000, message: "Running" },
    { session_id: "4d2c5243", user_id: "tony", game_id: "notepad_test", status: "starting", time: (NOW - 27_000) / 1000, message: "Starting" },
  ];
  return { events: base };
}

// ── /sessions/analytics ───────────────────────────────────────────────────
export function sessionAnalytics(state) {
  if (state === "empty") {
    return {
      total_sessions: 0, total_duration_seconds: 0, successful: 0, failed: 0, recovered: 0,
      success_rate: 0, avg_playtime_seconds: 0, by_user: [], by_game: [], by_user_game: [],
    };
  }
  return {
    total_sessions: 221, total_duration_seconds: 24480, successful: 199, failed: 22, recovered: 28,
    success_rate: 90.05, avg_playtime_seconds: 110,
    by_user: [
      { user_id: "tony", count: 182, total_seconds: 20880, avg_seconds: 114 },
      { user_id: "harsh", count: 15, total_seconds: 1249, avg_seconds: 83 },
      { user_id: "admin", count: 21, total_seconds: 1229, avg_seconds: 58 },
    ],
    by_game: [
      { game_id: "notepad_test", count: 140, total_seconds: 16380, avg_seconds: 117 },
      { game_id: "gow_ragnarok", count: 78, total_seconds: 7080, avg_seconds: 90 },
      { game_id: "froza_horizon_6", count: 1, total_seconds: 816, avg_seconds: 816 },
    ],
    by_user_game: [
      { user_id: "tony", game_id: "notepad_test", count: 110, total_seconds: 14100, avg_seconds: 129 },
    ],
  };
}

// ── /sessions/health ───────────────────────────────────────────────────
export function sessionHealth(state) {
  if (state === "active") return { locked: true, session_id: "4d2c5243" };
  return { locked: false };
}

// ── /host/recovery-events ────────────────────────────────────────────────
// Shape verified against recovery_event_manager.py + the exact
// `event.<field>` accessors used in RecoveryEvents.jsx (event, details,
// time) — NOT type/outcome/message/timestamp as an earlier draft assumed.
export function recoveryEvents(state) {
  if (state === "empty") return { count: 0, events: [] };
  const one = { service: "tailscale", event: "recovered", details: null, time: (NOW - 3_600_000) / 1000 };
  if (state === "long") {
    const rows = [];
    const eventNames = ["recovered", "recovery_started_service", "recovery_started_ipn", "detected_nostate", "restart_success", "restart_failed"];
    for (let i = 0; i < 40; i++) {
      const service = i % 3 === 0 ? "sunshine" : "tailscale";
      const evt = service === "sunshine" ? (i % 7 === 0 ? "restart_failed" : "restart_success") : eventNames[i % eventNames.length];
      rows.push({ service, event: evt, details: null, time: (NOW - i * 1_800_000) / 1000 });
    }
    return { count: rows.length, events: rows };
  }
  return { count: 1, events: [one] };
}

// ── /host/recovery-stats ────────────────────────────────────────────────
// Shape verified against recovery_event_manager.py get_recovery_stats()
// AND every `recoveryStats?.<field>` accessor in RecoveryStats.jsx.
// NOTE: real field is "sunshine_restarts", not "sunshine_recoveries" —
// an earlier draft fixture used the wrong name (see .ai/DECISIONS.md D-007).
export function recoveryStats(state) {
  const base = {
    sunshine_restarts: 24,
    sunshine_failures: 3,
    tailscale_recoveries: 47,
    tailscale_failures: 0,
    tailscale_service_recoveries: 30,
    tailscale_ipn_recoveries: 12,
    tailscale_up_recoveries: 5,
    tailscale_nostate: 0,
    tailscale_stopped: 0,
    tailscale_service_stopped: 0,
    tailscale_ipn_missing: 0,
  };
  if (state === "attention") {
    return { ...base, sunshine_failures: 9, tailscale_failures: 6, tailscale_nostate: 4, tailscale_stopped: 2 };
  }
  return base;
}

// ── /auth/users ────────────────────────────────────────────────────────
export function users(state) {
  if (state === "empty") return { users: [] };
  const base = [
    { id: 1, username: "admin", role: "admin", created_at: iso(-200 * 86_400_000) },
    { id: 2, username: "tony", role: "user", created_at: iso(-120 * 86_400_000) },
    { id: 3, username: "harsh", role: "user", created_at: iso(-90 * 86_400_000) },
  ];
  if (state === "long") {
    const many = [...base];
    for (let i = 0; i < 25; i++) {
      many.push({ id: 10 + i, username: `player_${i}`, role: "user", created_at: iso(-i * 5 * 86_400_000) });
    }
    return { users: many };
  }
  return { users: base };
}

// ── /config/ ──────────────────────────────────────────────────────────
// Shape verified against every `config.<section>.<field>.value` /
// `getValue()`/`updateValue()`/`requiresRestartChanged()` accessor in
// SettingsPanel.jsx (re-derived field-by-field from the component source
// for P7-T08, not just the earlier flat draft). Every field is wrapped as
// `{ value, requires_restart? }` — `requires_restart: true` only on the
// fields `requiresRestartChanged()` actually checks (host_agent.environment/
// debug, storage.backup_retention/archive_retention/enable_archives/
// enable_integrity_hashing, logging.console_logging); every other field
// carries `requires_restart: false` since the component reads it
// optionally (`current?.requires_restart`) and this keeps the shape
// uniform. NOTE: `metadata` is its own top-level section (not nested
// under `host_agent`) — SettingsPanel.jsx reads `config.metadata.lock_file`
// directly, confirmed against the component's "Metadata" SettingsGroup.
export function config() {
  return {
    sunshine: {
      api_url: { value: "https://localhost:47990", requires_restart: false },
      username: { value: "streamadmin", requires_restart: false },
      password: { value: "changeme123", requires_restart: false },
      path: { value: "E:/Stream/Sunshine/Sunshine.exe", requires_restart: false },
      verify_ssl: { value: true, requires_restart: false },
      close_stream_on_game_exit: { value: true, requires_restart: false },
    },
    tailscale: {
      ipn_path: { value: "C:/Program Files/Tailscale/tailscaled.exe", requires_restart: false },
    },
    storage: {
      backup_retention: { value: 5, requires_restart: true },
      archive_retention: { value: 10, requires_restart: true },
      enable_archives: { value: true, requires_restart: true },
      enable_integrity_hashing: { value: true, requires_restart: true },
      saves_root: { value: "D:/PCGO/saves", requires_restart: false },
      temp_root: { value: "D:/PCGO/backup", requires_restart: false },
      games_config_path: { value: "D:/PCGO/config/games.json", requires_restart: false },
    },
    session: {
      max_concurrent_sessions: { value: 2, requires_restart: false },
      default_session_minutes: { value: 120, requires_restart: false },
      warning_before_minutes: { value: 10, requires_restart: false },
      auto_cleanup: { value: true, requires_restart: false },
      force_cleanup_timeout: { value: 30, requires_restart: false },
    },
    logging: {
      log_level: { value: "INFO", requires_restart: false },
      console_logging: { value: true, requires_restart: true },
    },
    host_agent: {
      host_name: { value: "LAPTOP-RDCFAJT3", requires_restart: false },
      environment: { value: "production", requires_restart: true },
      debug: { value: false, requires_restart: true },
    },
    metadata: {
      lock_file: { value: "D:/PCGO/config/.metadata.lock", requires_restart: false },
    },
  };
}

// ── /host/tailscale/status ────────────────────────────────────────────
export function tailscaleStatus(state) {
  if (state === "attention") return { connected: false, error: "Tailscale daemon unreachable" };
  return { connected: true };
}

// ── /admin/logs, /admin/my-logs ──────────────────────────────────────
// Shape verified against LogPanel.jsx's real read pattern: `data.logs`
// (not `data.entries`) is consumed as a flat array of pre-formatted
// **strings** — `getLogMeta()` does `log.includes("[ERROR]")` and the
// search highlighter does `log.split(...)` directly on each entry, so
// rows must be strings containing a bracketed level tag, not
// `{timestamp, level, message}` objects (an object row would render as
// "[object Object]" and never match any `getLogMeta()` branch). Also
// fixed the level tag itself: `getLogMeta()` checks for the literal
// substring `"[WARNING]"`, but the earlier object-row draft used the
// level `"WARN"`, which would never have matched even after the
// object→string fix. `data.warnings`/`data.errors` (read by LogPanel.jsx
// for its two count tiles) were also missing entirely — added, derived
// from the actual generated rows so the counts are always accurate.
export function logs(state) {
  if (state === "empty") return { logs: [], warnings: 0, errors: 0 };
  const levels = ["INFO", "INFO", "WARNING", "ERROR", "INFO"];
  const messages = [
    "Session 4d2c5243 started for user tony",
    "Sunshine health check passed",
    "Host CPU usage above 80% for 30s",
    "Tailscale connection dropped, retrying",
    "Recovery routine completed successfully",
  ];
  const count = state === "long" ? 200 : 8;
  const rows = [];
  for (let i = 0; i < count; i++) {
    const level = levels[i % levels.length];
    const sessionTag = i % 3 === 0 ? " session=4d2c5243" : "";
    const message = state === "long" && i % 11 === 0
      ? messages[i % messages.length] + " " + "— extended diagnostic payload with additional context that runs quite long to test wrapping behavior in the log table cell."
      : messages[i % messages.length];
    rows.push(`${iso(-i * 60_000)} [${level}] ${message}${sessionTag}`);
  }
  const warnings = rows.filter((row) => row.includes("[WARNING]")).length;
  const errors = rows.filter((row) => row.includes("[ERROR]")).length;
  return { logs: rows, warnings, errors };
}

export function logSessions() {
  return { sessions: ["4d2c5243", "9a1b7f10", "e33cc902"] };
}

// ── /host/sunshine/stream ────────────────────────────────────────────
export function sunshineStream(state) {
  if (state === "active") {
    return { active: true, client: "Living Room PC", started_at: iso(-1_800_000) };
  }
  return { active: false };
}

// ── /host/sunshine/history ───────────────────────────────────────────
// Shape verified against every `stream.<field>` accessor in
// SunshineStreamHistory.jsx: it reads `app_name` (falls back to
// "Unknown"), `started_at` as **Unix seconds** (`new Date(stream.started_at
// * 1000)` — an ISO string here produces "Invalid Date"), `width`/`height`/
// `fps`/`hdr` (rendered as "--"/"SDR" fallbacks when absent), and
// `duration_seconds` via `formatDuration()` (kept unchanged — this field
// name was already correct). `client`/`ended_at` are not read anywhere in
// this component and have been dropped.
export function streamHistory(state) {
  if (state === "empty") return { streams: [] };
  return {
    streams: [
      { app_name: "Resident Evil Requiem", started_at: unixSec(-3_600_000), duration_seconds: 600, width: 1920, height: 1080, fps: 60, hdr: true },
      { app_name: "Froza Horizon 6", started_at: unixSec(-90_000_000), duration_seconds: 600, width: 2560, height: 1440, fps: 60, hdr: false },
    ],
  };
}

// ── /host/sunshine/clients ───────────────────────────────────────────
export function sunshineClients(state) {
  if (state === "empty") return { reachable: true, clients: [] };
  return {
    reachable: true,
    clients: [
      { name: "Living Room PC", uuid: "b3e1-aaaa-bbbb-cccc" },
      { name: "Bedroom Steam Deck", uuid: "c4f2-dddd-eeee-ffff" },
    ],
  };
}

// ── /host/user-status (user-role Home) ───────────────────────────────
export function userHostStatus(state) {
  if (state === "attention") {
    return { ready: true, alerts: [{ level: "warning", message: "High CPU or RAM usage." }] };
  }
  return { ready: true, alerts: [] };
}
