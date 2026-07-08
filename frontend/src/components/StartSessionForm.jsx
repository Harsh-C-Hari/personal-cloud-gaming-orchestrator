/**
 * components/StartSessionForm.jsx
 *
 * Controlled form that maps directly to StartSessionRequest (pydantic model):
 *   user_id    : str           (required)
 *   game_id    : str           (required — chosen from GET /games/)
 *   duration   : int = 60
 *   warning    : int = 5
 *   load_save  : str | None    (optional archive path)
 *   skip_timer : bool = False
 *
 * Games are loaded once on mount from GET /games/.
 * The response is the raw game_configs dict, NOT a typed list.
 * Shape: { [game_id]: { name, exe_name, exe_path, save_path, process_name } }
 *
 * @param {{ onLaunched: () => void }} props
 *   onLaunched — called after a successful POST /sessions/start so
 *               Dashboard can trigger an immediate re-fetch.
 */

import { useEffect, useState } from "react";
import { deleteSave, fetchSaves, startSession, validateGame } from "../api/client.js";
import { SaveBrowser } from "./SaveBrowser.jsx";
import { GameLibrary } from "./GameLibrary.jsx";
const DEFAULT_FORM = {
  user_id:    "",
  game_id:    "",
  duration:   60,
  warning:    5,
  skip_timer: false,
  save_type: "latest",
  save_name: "",
};

export function StartSessionForm({ games, onLaunched, hostStatus, activeSessions}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [debouncedUserId, setDebouncedUserId] = useState("");
  const [submitting,  setSubmitting] = useState(false);
  const [formErr,     setFormErr]    = useState(null);
  const [launchedId,  setLaunchedId] = useState(null);
  const [launchedSeen, setLaunchedSeen] = useState(false);
  const [lastLaunchUserId, setLastLaunchUserId] = useState("");
  const [lastLaunchGameId, setLastLaunchGameId] = useState("");
  const [saves, setSaves] = useState({
    latest_exists: false,
    archives: [],
    backups: [],
  });
  const [savesLoading, setSavesLoading] = useState(false);
  const [savesErr, setSavesErr] = useState("");
  const [deletingSave, setDeletingSave] = useState(false);
  const [gameValidation, setGameValidation] = useState(null);
  const [gameValidationLoading, setGameValidationLoading] = useState(false);
  const [gameValidationErr, setGameValidationErr] = useState("");
  const [showGameDetails, setShowGameDetails] = useState(false);
  const gamesReady = Object.keys(games).length > 0;
  // ── Load game list ────────────────────────────────────────────────────

  const entries = Object.entries(games || {});

  useEffect(() => {
    if (
      formErr === "Cannot launch: Sunshine is not running." &&
      hostStatus?.sunshine_running
    ) {
      setFormErr(null);
    }
  }, [formErr, hostStatus?.sunshine_running]);
  

  useEffect(() => {

      const timer =
          setTimeout(() => {

              setDebouncedUserId(
                  form.user_id.trim()
              );

          }, 400);

      return () =>
          clearTimeout(timer);

  }, [form.user_id]);
  
  useEffect(() => {
    const userId = debouncedUserId;
    const gameId = form.game_id;

    if (!userId || !gameId) {
      setSaves({
        latest_exists: false,
        archives: [],
        backups: [],
      });
      setSavesErr("");
      return;
    }

    let cancelled = false;

    async function loadSaves() {
      setSavesLoading(true);
      setSavesErr("");

      try {
        const data = await fetchSaves(
          userId,
          gameId
        );

        if (!cancelled) {
          setSaves(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSavesErr(
            err.message || "Failed to load saves"
          );
        }
      } finally {
        if (!cancelled) {
          setSavesLoading(false);
        }
      }
    }


    loadSaves();

    return () => {
      cancelled = true;
    };
  }, [debouncedUserId, form.game_id]);

  useEffect(() => {
    if (!form.game_id) {
      setGameValidation(null);
      setGameValidationErr("");
      return;
    }

    let cancelled = false;

    async function runValidation() {
      setGameValidationLoading(true);
      setGameValidationErr("");

      try {
        const data = await validateGame(
          form.game_id
        );

        if (!cancelled) {
          setGameValidation(data);
        }
      } catch (err) {
        if (!cancelled) {
          setGameValidation(null);
          setGameValidationErr(
            err.message || "Failed to validate game"
          );
        }
      } finally {
        if (!cancelled) {
          setGameValidationLoading(false);
        }
      }
    }

    runValidation();

    return () => {
      cancelled = true;
    };
  }, [form.game_id]);

  useEffect(() => {
    if (!launchedId || !activeSessions) return;

    const stillActive = activeSessions.some(
      (session) => session.session_id === launchedId
    );

    if (stillActive) {
      setLaunchedSeen(true);
      return;
    }

    if (launchedSeen && !stillActive) {
      setLaunchedId(null);
      setLaunchedSeen(false);
      setLastLaunchUserId("");
      setLastLaunchGameId("");
    }
  }, [activeSessions, launchedId, launchedSeen]);

  useEffect(() => {
    if (
      !lastLaunchUserId ||
      !lastLaunchGameId ||
      !activeSessions
    ) {
      return;
    }

    const hasCleaningOrCompleted = activeSessions.some(
      (session) =>
        session.session_id === launchedId &&
        ["cleaning", "completed"].includes(session.status)
    );

    if (!hasCleaningOrCompleted) {
      return;
    }

    fetchSaves(
      lastLaunchUserId,
      lastLaunchGameId
    )
      .then(setSaves)
      .catch(() => {});
  }, [
    activeSessions,
    launchedId,
    lastLaunchUserId,
    lastLaunchGameId,
  ]);

  useEffect(() => {

      setSaves({
          latest_exists: false,
          archives: [],
          backups: [],
      });

      setSavesErr("");

  }, [form.user_id, form.game_id]);

  useEffect(() => {

      if (
          form.save_type === "archives" &&
          saves.archives.length === 0
      ) {
          set("save_type", "latest");
      }

      if (
          form.save_type === "backups" &&
          saves.backups.length === 0
      ) {
          set("save_type", "latest");
      }

  }, [saves]);

  // ── Field helpers ─────────────────────────────────────────────────────

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const hostState =
    hostStatus?.host_state;

  const sessionBlocked =
    !hostStatus?.host_ready ||
    hostState === "maintenance" ||
    hostState === "recovery" ||
    hostState === "starting";

  // ── Submit ────────────────────────────────────────────────────────────

  async function refreshSaves() {
    const userId = form.user_id.trim();
    const gameId = form.game_id;

    if (!userId || !gameId) {
      return;
    }

    const data = await fetchSaves(
      userId,
      gameId
    );

    setSaves(data);
  }
  
  async function handleDeleteSave() {
    const userId = form.user_id.trim();
    const gameId = form.game_id;

    if (
      form.save_type === "latest" ||
      !form.save_name.trim()
    ) {
      return;
    }

    const ok = window.confirm(
      `Delete ${form.save_type === "archives" ? "archive" : "backup"} "${form.save_name}"?`
    );

    if (!ok) {
      return;
    }

    setDeletingSave(true);
    setFormErr("");

    try {
      await deleteSave(
        userId,
        gameId,
        form.save_type,
        form.save_name.trim()
      );

      set("save_name", "");
      await refreshSaves();
      setFormErr(null);

    } catch (err) {
      setFormErr(
        err.message || "Failed to delete save"
      );
    } finally {
      setDeletingSave(false);
    }
  }

  async function handleLaunch() {
    if (submitting) return;

    setSubmitting(true);
    setFormErr(null);
    setLaunchedId(null);
    setLaunchedSeen(false);

    try {
      if (!form.user_id.trim()) {
        setFormErr("User ID is required.");
        return;
      }

      if (!form.game_id) {
        setFormErr("Select a game.");
        return;
      }

      if (gameValidationLoading) {
        setFormErr("Please wait: game config is still being checked.");
        return;
      }

      if (gameValidation && !gameValidation.valid) {
        setFormErr("Cannot launch: selected game config is invalid.");
        return;
      }

      if (!form.skip_timer) {
        const duration = Number(form.duration);
        const warning = Number(form.warning);

        if (!Number.isInteger(duration) || duration < 1) {
          setFormErr("Enter a valid duration in whole minutes.");
          return;
        }

        if (duration > 480) {
          setFormErr("Duration cannot be more than 480 minutes.");
          return;
        }

        if (!Number.isInteger(warning) || warning < 1) {
          setFormErr("Enter a valid warning time in whole minutes.");
          return;
        }

        if (warning > 60) {
          setFormErr("Warning time cannot be more than 60 minutes.");
          return;
        }

        if (warning >= duration) {
          setFormErr("Warning must be less than duration.");
          return;
        }
      }

      const validSaveTypes = new Set([
        "latest",
        "archives",
        "backups",
      ]);

      if (!validSaveTypes.has(form.save_type)) {
        setFormErr("Invalid save type selected.");
        return;
      }
      
      if (
        form.save_type !== "latest" &&
        !form.save_name.trim()
      ) {
        const saveLabel =
          form.save_type === "archives"
            ? "an archive"
            : "a backup";

        setFormErr(
          `Please select ${saveLabel} save.`
        );
        return;
      }

      const duration = form.skip_timer
        ? 0
        : Number(form.duration);

      const warning = form.skip_timer
        ? 0
        : Number(form.warning);
      
      const payload = {
        user_id: form.user_id.trim(),
        game_id: form.game_id,
        duration: duration,
        warning: warning,
        skip_timer: form.skip_timer,
        load_save_type: form.save_type,
        load_save_name:
          form.save_type === "latest"
            ? null
            : form.save_name.trim(),
      };
      
      const res = await startSession(payload);
      
      setLaunchedId(res.session_id);
      setLastLaunchUserId(form.user_id.trim());
      setLastLaunchGameId(form.game_id);
      setLaunchedSeen(false);

      setForm((f) => ({
        ...f,
        user_id: "",
        save_type: "latest",
        save_name: "",
      }));

      setSaves({
        latest_exists: false,
        archives: [],
        backups: [],
      });

      setSavesErr("");

      onLaunched();
    } catch (err) {
      const cleanMessage = (err.message || "Failed to launch session.")
        .replace(/^400:\s*/, "")
        .replace(/^HTTP 400\s*/, "");

      setFormErr(cleanMessage);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared style primitives ───────────────────────────────────────────

  const inputStyle = {
    width:        "100%",
    padding:      "9px 12px",
    background:   "#080a0f",
    border:       "1px solid #1c2130",
    borderRadius: "5px",
    color:        "#e2e8f0",
    fontSize:     "13px",
    fontFamily:   "inherit",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 0.2s",
  };

  const hostWarningBox = {
    marginTop: "10px",
    fontSize: "10px",
    color: "#f59e0b",
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.5,
  };

  const validationText = {
    marginTop: "8px",
    fontSize: "10px",
    color: "#475569",
    fontFamily: "'JetBrains Mono', monospace",
  };

  const validationOk = {
    ...validationText,
    color: "#10d98a",
  };

  const validationBad = {
    ...validationText,
    color: "#f43f5e",
  };

  const focusBorder  = (e) => { e.target.style.borderColor = "rgba(56,189,248,0.45)"; };
  const blurBorder   = (e) => { e.target.style.borderColor = "#1c2130"; };

  function FieldLabel({ children }) {
    return (
      <span style={{
        display:       "block",
        fontSize:      "9.5px",
        color:         "#475569",
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        fontFamily:    "'JetBrains Mono', monospace",
        marginBottom:  "7px",
      }}>
        {children}
      </span>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      {/* User ID */}
      <div>
        <FieldLabel>User ID</FieldLabel>
        <input
          style={inputStyle}
          value={form.user_id}
          placeholder="user_id"
          onChange={(e) => set("user_id", e.target.value)}
          onFocus={focusBorder}
          onBlur={blurBorder}
        />
      </div>

      {/* Game */}
      <div>
        <FieldLabel>Game</FieldLabel>
        
          <>
            {entries.length == 0 
              ? <span style={{
                  width: "100%",
                  marginTop: "8px",
                  background: "rgba(2,6,23,0.45)",
                  color: "#ef880a",
                  padding: "6px",
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                }}>No games found</span>
              : (
                <select
                  style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
                  value={form.game_id}
                  disabled={!gamesReady}
                  onChange={(e) => set("game_id", e.target.value)}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                >
                  <option value="">
                    Select a game to play
                  </option>
                  
                  {!gamesReady
                    ? <option>No games found. Loading...</option>
                    : Object.entries(games).map(([id, g]) => (
                        <option key={id} value={id}>
                          {g.name ?? id}
                        </option>
                      ))
                  }
                </select>
            )}

            <button
              type="button"
              onClick={() =>
                setShowGameDetails(
                  !showGameDetails
                )
              }
              style={{
                width: "100%",
                marginTop: "8px",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(2,6,23,0.45)",
                color: "#94a3b8",
                borderRadius: "6px",
                padding: "6px",
                fontSize: "9px",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                e.currentTarget.style.background =
                  "rgba(56, 191, 248, 0.08)"
              }

              onMouseLeave={(e) =>
                e.currentTarget.style.background =
                  "rgba(56, 191, 248, 0)"
              }
            >
              {
                showGameDetails
                  ? "HIDE DETAILS"
                  : "SHOW DETAILS"
              }
            </button>
            
            { showGameDetails && (
              <div style={{ marginTop: "10px" }}>
                <GameLibrary
                  games={games}
                  selectedGameId={form.game_id}
                  onSelectGame={(gameId) =>
                    set("game_id", gameId)
                  }
                />
              </div>
            )}
          </>

        {gameValidationLoading && (
          <div style={validationText}>
            Checking game config…
          </div>
        )}

        {gameValidationErr && (
          <div style={validationBad}>
            Game validation unavailable.
          </div>
        )}

        {gameValidation && (
          <div
            style={
              gameValidation.valid
                ? validationOk
                : validationBad
            }
          >
            {gameValidation.valid
              ? "Game config ready."
              : gameValidation.errors.join(" ")}
          </div>
        )}
      </div>

      {/* Duration + Warning */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <FieldLabel>Duration (min)</FieldLabel>
          <input
            type="number"
            min={1} max={480}
            style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
            value={form.duration}
            disabled={form.skip_timer}
            onChange={(e) => set("duration", e.target.value)}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
        <div>
          <FieldLabel>Warning (min)</FieldLabel>
          <input
            type="number"
            min={1} max={60}
            style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
            value={form.warning}
            disabled={form.skip_timer}
            onChange={(e) => set("warning", e.target.value)}
            onFocus={focusBorder}
            onBlur={blurBorder}
          />
        </div>
      </div>

      {/* Load Save */}
      {debouncedUserId && form.game_id ? (
      <SaveBrowser
        type={form.save_type}
        name={form.save_name}
        saves={saves}
        loading={savesLoading}
        error={savesErr}
        deleting={deletingSave}
        onTypeChange={(value) => {
          set("save_type", value);
          set("save_name", "");
        }}
        onNameChange={(value) =>
          set("save_name", value)
        }
        onDelete={handleDeleteSave}
      />
    ) : (
      <div
        style={{
          padding: "10px",
          border: "1px dashed #1c2130",
          borderRadius: "6px",
          color: "#475569",
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Enter user ID and select game to load saves.
      </div>
    )}

      {/* Skip Timer toggle */}
      <div
        role="checkbox"
        aria-checked={form.skip_timer}
        tabIndex={0}
        onClick={() => set("skip_timer", !form.skip_timer)}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") set("skip_timer", !form.skip_timer); }}
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none", padding: "4px 0" }}
      >
        {/* Track */}
        <div style={{
          width: "36px", height: "20px",
          borderRadius: "10px",
          background:   form.skip_timer ? "rgba(56,189,248,0.15)" : "#111620",
          border:       `1px solid ${form.skip_timer ? "rgba(56,189,248,0.5)" : "#1c2130"}`,
          position: "relative",
          transition: "all 0.25s",
          flexShrink: 0,
        }}>
          {/* Thumb */}
          <div style={{
            position: "absolute",
            top: "2px",
            left: form.skip_timer ? "16px" : "2px",
            width: "14px", height: "14px",
            borderRadius: "50%",
            background: form.skip_timer ? "#38bdf8" : "#2d3748",
            boxShadow: form.skip_timer ? "0 0 8px rgba(56,189,248,0.6)" : "none",
            transition: "all 0.25s",
          }} />
        </div>
        <span style={{ fontSize: "12px", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
          Skip Timer
        </span>
      </div>

      {/* Form error */}
      {formErr && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(244,63,94,0.07)",
          border: "1px solid rgba(244,63,94,0.3)",
          borderRadius: "5px",
          color: "#f43f5e",
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ✕ {formErr}
        </div>
      )}

      {/* Launch success */}
      {launchedId && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(16,217,138,0.06)",
          border: "1px solid rgba(16,217,138,0.25)",
          borderRadius: "5px",
          color: "#10d98a",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.03em",
          animation: "card-in 0.2s ease forwards",
        }}>
          ✓ launched: {launchedId}
        </div>
      )}

      {hostStatus && (
        <div style={hostWarningBox}>
          {!hostStatus.sunshine_running && (
            <div>Warning: Sunshine is not running.</div>
          )}

          {!hostStatus.tailscale_running && (
            <div>Warning: Tailscale is not running.</div>
          )}

          {hostStatus.sunshine_api_reachable === false && (
            <div>Warning: Sunshine API is not reachable.</div>
          )}

          {hostStatus.sunshine_apps_count === 0 && (
            <div>Warning: Sunshine has no configured apps.</div>
          )}
        </div>
      )}
      
      {/* Launch button */}
      <button
        onClick={handleLaunch}
        disabled={
          submitting ||
          !gamesReady ||
          gameValidationLoading ||
          sessionBlocked
        }
        style={{
          padding:       "12px",
          background:    submitting ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.1)",
          border:        "1px solid rgba(56,189,248,0.38)",
          borderRadius:  "5px",
          color:         "#38bdf8",
          fontSize:      "11px",
          fontFamily:    "'JetBrains Mono', monospace",
          fontWeight:    700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor:
            submitting ||
            !gamesReady ||
            gameValidationLoading ||
            sessionBlocked
              ? "not-allowed"
              : "pointer",
          textShadow:    "0 0 14px rgba(56,189,248,0.4)",
          transition:    "background 0.2s",
          opacity:
            (
              !gamesReady ||
              sessionBlocked
            )
              ? 0.5
              : 1,
        }}
        onMouseEnter={(e) => { if (!submitting && gamesReady) e.currentTarget.style.background = "rgba(56,189,248,0.16)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = submitting ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.1)"; }}
      >
        {submitting ? "Checking / Launching..." : "Launch Session"}
      </button>

      {sessionBlocked && 
        hostStatus?.host_ready_reason != null && (
        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            color: "#facc15",
            fontFamily:
              "'JetBrains Mono', monospace",
          }}
        >
          {
            hostState === "maintenance"
              ? "Host is in maintenance mode."
              : hostState === "recovery"
              ? "Host is in recovery mode."
              : hostState === "starting"
              ? "Host is still starting."
              : `Host not ready: ${
                  hostStatus?.host_ready_reason ??
                  "Unknown reason"
                }`
          }
        </div>
      )}
    </div>
  );
}
