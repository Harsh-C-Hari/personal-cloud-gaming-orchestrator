/**
 * components/StartSessionForm.jsx
 *
 * Controlled form that maps directly to StartSessionRequest (pydantic model):
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
 *
 * Messaging: the old single `formErr` box (which mixed pre-flight field
 * validation, the delete-save result, and the launch API result into one
 * inline message) was removed in favor of toast.warning/toast.error,
 * matching GameManager's convention for the same kind of one-off action
 * feedback. On success, toast.success("Session launched.") now fires
 * alongside — not instead of — the existing inline "Launched: <id>"
 * indicator below, since that indicator does something a toast can't: it
 * stays up for the session's actual lifecycle and shows the session id
 * for reference. `savesErr` / `gameValidationErr` are untouched — they
 * describe the current state of the saves list / game-config check
 * (like SaveBrowser's own error prop), not a one-off event, so they stay
 * inline next to the fields they describe.
 */

import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaGamepad,
  FaClock,
  FaBell,
  FaRocket,
  FaInfoCircle,
} from "react-icons/fa";
import { deleteSave, fetchSaves, startSession, validateGame } from "../api/client.js";
import { SaveBrowser } from "./SaveBrowser.jsx";
import { GameLibrary } from "./GameLibrary.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { useToast } from "./ui/Toast.jsx";
const DEFAULT_FORM = {
  game_id:    "",
  duration:   60,
  warning:    5,
  skip_timer: false,
  save_type: "latest",
  save_name: "",
};

export function StartSessionForm({ games, onLaunched, hostStatus, activeSessions}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting,  setSubmitting] = useState(false);
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
    const gameId = form.game_id;

    if (!gameId) {
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
          gameId,
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
  }, [form.game_id]);

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

  }, [form.game_id]);

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
    const gameId = form.game_id;

    if (!gameId) {
      return;
    }

    const data = await fetchSaves(
      gameId,
    );

    setSaves(data);
  }
  
  async function handleDeleteSave() {
    const gameId = form.game_id;

    if (
      form.save_type === "latest" ||
      !form.save_name.trim()
    ) {
      return;
    }

    const ok = await confirm(
      `Delete ${form.save_type === "archives" ? "archive" : "backup"} "${form.save_name}"?`,
      { danger: true, confirmLabel: "Delete" }
    );

    if (!ok) {
      return;
    }

    setDeletingSave(true);

    try {
      await deleteSave(
        gameId,
        form.save_type,
        form.save_name.trim()
      );

      set("save_name", "");
      await refreshSaves();
      toast.success("Save deleted.");

    } catch (err) {
      toast.error(
        err.message || "Failed to delete save"
      );
    } finally {
      setDeletingSave(false);
    }
  }

  async function handleLaunch() {
    if (submitting) return;

    setSubmitting(true);
    setLaunchedId(null);
    setLaunchedSeen(false);

    try {

      if (!form.game_id) {
        toast.warning("Select a game.");
        return;
      }

      if (gameValidationLoading) {
        toast.warning("Please wait: game config is still being checked.");
        return;
      }

      if (gameValidation && !gameValidation.valid) {
        toast.warning("Cannot launch: selected game config is invalid.");
        return;
      }

      if (!form.skip_timer) {
        const duration = Number(form.duration);
        const warning = Number(form.warning);

        if (!Number.isInteger(duration) || duration < 1) {
          toast.warning("Enter a valid duration in whole minutes.");
          return;
        }

        if (duration > 480) {
          toast.warning("Duration cannot be more than 480 minutes.");
          return;
        }

        if (!Number.isInteger(warning) || warning < 1) {
          toast.warning("Enter a valid warning time in whole minutes.");
          return;
        }

        if (warning > 60) {
          toast.warning("Warning time cannot be more than 60 minutes.");
          return;
        }

        if (warning >= duration) {
          toast.warning("Warning must be less than duration.");
          return;
        }
      }

      const validSaveTypes = new Set([
        "latest",
        "archives",
        "backups",
      ]);

      if (!validSaveTypes.has(form.save_type)) {
        toast.warning("Invalid save type selected.");
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

        toast.warning(
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
      setLastLaunchGameId(form.game_id);
      setLaunchedSeen(false);

      setForm((f) => ({
        ...f,
        save_type: "latest",
        save_name: "",
      }));

      setSaves({
        latest_exists: false,
        archives: [],
        backups: [],
      });

      setSavesErr("");

      toast.success("Session launched.");

      onLaunched();
    } catch (err) {
      const cleanMessage = (err.message || "Failed to launch session.")
        .replace(/^400:\s*/, "")
        .replace(/^HTTP 400\s*/, "");

      toast.error(cleanMessage);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared style primitives ───────────────────────────────────────────

  const palette = {
    bg: "#080a0f",
    card: "rgba(3, 2, 2, 0.55)",
    border: "#1c2130",
    borderStrong: "rgba(148,163,184,0.18)",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    success: "#10d98a",
    warning: "#f5a524",
    danger: "#f43f5e",
    mono: "'JetBrains Mono', monospace",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: "7px",
    color: palette.text,
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const cardSection = {
    padding: "16px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    background: palette.card,
  };

  const validationText = {
    marginTop: "9px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10.5px",
    color: palette.faint,
    fontFamily: palette.mono,
  };

  const validationOk = { ...validationText, color: palette.success };
  const validationBad = { ...validationText, color: palette.danger };

  const focusBorder = (e) => {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
  };
  const blurBorder = (e) => {
    e.target.style.borderColor = palette.border;
    e.target.style.boxShadow = "none";
  };

  function FieldLabel({ icon, children }) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "9.5px",
          color: palette.muted,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontFamily: palette.mono,
          marginBottom: "8px",
        }}
      >
        {icon}
        {children}
      </span>
    );
  }

  function SectionHeading({ children }) {
    return (
      <div
        style={{
          fontSize: "10px",
          color: palette.muted,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: palette.mono,
          marginBottom: "12px",
        }}
      >
        {children}
      </div>
    );
  }

  const launchDisabled =
    submitting || !gamesReady || gameValidationLoading || sessionBlocked;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: "12px",
        background: "rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 20px",
          borderBottom: `1px solid ${palette.border}`,
          background: "rgb(1, 3, 10)",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(56,189,248,0.12)",
            border: "1px solid rgba(56,189,248,0.3)",
            color: palette.accent,
            fontSize: "13px",
          }}
        >
          <FaRocket />
        </div>
        <div>
          <div
            style={{
              fontSize: "13.5px",
              fontWeight: 700,
              color: palette.text,
              fontFamily: "'Rajdhani', sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            Launch a Session
          </div>
          <div style={{ fontSize: "10px", color: palette.faint, fontFamily: palette.mono, marginTop: "1px" }}>
            Pick a game, set your timer, and go
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
        {/* Game */}
        <div style={cardSection}>
          <FieldLabel icon={<FaGamepad size={10} />}>Game</FieldLabel>

          {entries.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "7px",
                background: "rgba(245,165,36,0.08)",
                border: "1px solid rgba(245,165,36,0.3)",
                color: palette.warning,
                fontSize: "11px",
                fontFamily: palette.mono,
              }}
            >
              <FaExclamationTriangle size={11} />
              No games found
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <select
                style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "34px" }}
                value={form.game_id}
                disabled={!gamesReady}
                onChange={(e) => set("game_id", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                <option value="">Select a game to play</option>

                {!gamesReady ? (
                  <option>No games found. Loading...</option>
                ) : (
                  Object.entries(games).map(([id, g]) => (
                    <option key={id} value={id}>
                      {g.name ?? id}
                    </option>
                  ))
                )}
              </select>
              <FaChevronDown
                size={10}
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: palette.muted,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGameDetails(!showGameDetails)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              marginTop: "10px",
              border: `1px solid ${palette.borderStrong}`,
              background: "rgba(0, 0, 0, 0.45)",
              color: palette.dim,
              borderRadius: "7px",
              padding: "7px",
              fontSize: "9.5px",
              fontFamily: palette.mono,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = palette.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = palette.dim;
            }}
          >
            {showGameDetails ? "HIDE GAME LIBRARY" : "BROWSE GAME LIBRARY"}
            <FaChevronDown
              size={9}
              style={{
                transform: showGameDetails ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {showGameDetails && (
            <div style={{ marginTop: "12px" }}>
              <GameLibrary games={games} selectedGameId={form.game_id} onSelectGame={(gameId) => set("game_id", gameId)} />
            </div>
          )}

          {gameValidationLoading && (
            <div style={validationText}>
              <FaInfoCircle size={10} /> Checking game config…
            </div>
          )}

          {gameValidationErr && (
            <div style={validationBad}>
              <FaTimesCircle size={10} /> Game validation unavailable.
            </div>
          )}

          {gameValidation && (
            <div style={gameValidation.valid ? validationOk : validationBad}>
              {gameValidation.valid ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
              {gameValidation.valid ? "Game config ready." : gameValidation.errors.join(" ")}
            </div>
          )}
        </div>

        {/* Duration + Warning */}
        <div style={cardSection}>
          <SectionHeading>Session Timer</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <FieldLabel icon={<FaClock size={9} />}>Duration (min)</FieldLabel>
              <input
                type="number"
                min={1}
                max={480}
                style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
                value={form.duration}
                disabled={form.skip_timer}
                onChange={(e) => set("duration", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
            <div>
              <FieldLabel icon={<FaBell size={9} />}>Warning (min)</FieldLabel>
              <input
                type="number"
                min={1}
                max={60}
                style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
                value={form.warning}
                disabled={form.skip_timer}
                onChange={(e) => set("warning", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
          </div>

          {/* Skip Timer toggle */}
          <div
            role="checkbox"
            aria-checked={form.skip_timer}
            tabIndex={0}
            onClick={() => set("skip_timer", !form.skip_timer)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") set("skip_timer", !form.skip_timer);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
              marginTop: "14px",
              paddingTop: "14px",
              borderTop: `1px solid ${palette.border}`,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "20px",
                borderRadius: "10px",
                background: form.skip_timer ? "rgba(56,189,248,0.15)" : "#111620",
                border: `1px solid ${form.skip_timer ? "rgba(56,189,248,0.5)" : palette.border}`,
                position: "relative",
                transition: "all 0.25s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: form.skip_timer ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: form.skip_timer ? palette.accent : "#2d3748",
                  boxShadow: form.skip_timer ? "0 0 8px rgba(56,189,248,0.6)" : "none",
                  transition: "all 0.25s",
                }}
              />
            </div>
            <span style={{ fontSize: "12px", color: palette.dim, fontFamily: palette.mono }}>
              Skip Timer
            </span>
          </div>
        </div>

        {/* Load Save */}
        <div style={cardSection}>
          <SectionHeading>Save Data</SectionHeading>
          {form.game_id ? (
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
              onNameChange={(value) => set("save_name", value)}
              onDelete={handleDeleteSave}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                border: `1px dashed ${palette.border}`,
                borderRadius: "7px",
                color: palette.muted,
                fontSize: "10.5px",
                fontFamily: palette.mono,
              }}
            >
              <FaInfoCircle size={11} />
              Select a game to load your saves.
            </div>
          )}
        </div>

        {/* Launch success */}
        {launchedId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "11px 14px",
              background: "rgba(16,217,138,0.06)",
              border: "1px solid rgba(16,217,138,0.25)",
              borderRadius: "8px",
              color: palette.success,
              fontSize: "11px",
              fontFamily: palette.mono,
              letterSpacing: "0.03em",
              animation: "card-in 0.2s ease forwards",
            }}
          >
            <FaCheckCircle size={12} style={{ flexShrink: 0 }} />
            Launched: {launchedId}
          </div>
        )}

        {hostStatus &&
          (!hostStatus.sunshine_running ||
            !hostStatus.tailscale_running ||
            hostStatus.sunshine_api_reachable === false ||
            hostStatus.sunshine_apps_count === 0) && (
            <div
              style={{
                padding: "11px 14px",
                borderRadius: "8px",
                background: "rgba(245,165,36,0.06)",
                border: "1px solid rgba(245,165,36,0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {!hostStatus.sunshine_running && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: palette.warning, fontFamily: palette.mono }}>
                  <FaExclamationTriangle size={10} /> Sunshine is not running.
                </div>
              )}
              {!hostStatus.tailscale_running && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: palette.warning, fontFamily: palette.mono }}>
                  <FaExclamationTriangle size={10} /> Tailscale is not running.
                </div>
              )}
              {hostStatus.sunshine_api_reachable === false && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: palette.warning, fontFamily: palette.mono }}>
                  <FaExclamationTriangle size={10} /> Sunshine API is not reachable.
                </div>
              )}
              {hostStatus.sunshine_apps_count === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: palette.warning, fontFamily: palette.mono }}>
                  <FaExclamationTriangle size={10} /> Sunshine has no configured apps.
                </div>
              )}
            </div>
          )}

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={launchDisabled}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            padding: "13px",
            background: submitting
              ? "rgba(56,189,248,0.06)"
              : "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
            border: "1px solid rgba(56,189,248,0.4)",
            borderRadius: "8px",
            color: palette.accent,
            fontSize: "12px",
            fontFamily: palette.mono,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: launchDisabled ? "not-allowed" : "pointer",
            textShadow: "0 0 14px rgba(56,189,248,0.4)",
            transition: "background 0.2s, transform 0.1s",
            opacity: !gamesReady || sessionBlocked ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!launchDisabled) {
              e.currentTarget.style.background =
                "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = submitting
              ? "rgba(56,189,248,0.06)"
              : "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
          }}
        >
          <FaRocket size={12} />
          {submitting ? "Checking / Launching..." : "Launch Session"}
        </button>

        {sessionBlocked && hostStatus?.host_ready_reason != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "10.5px",
              color: palette.warning,
              fontFamily: palette.mono,
            }}
          >
            <FaExclamationTriangle size={10} />
            {hostState === "maintenance"
              ? "Host is in maintenance mode."
              : hostState === "recovery"
              ? "Host is in recovery mode."
              : hostState === "starting"
              ? "Host is still starting."
              : `Host not ready: ${hostStatus?.host_ready_reason ?? "Unknown reason"}`}
          </div>
        )}
      </div>
    </div>
  );
}
