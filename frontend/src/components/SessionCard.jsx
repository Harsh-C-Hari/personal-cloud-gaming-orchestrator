/**
 * components/SessionCard.jsx
 *
 * Renders a single enriched session entry.
 * Receives the full session object (from useSessions) and an onRefresh
 * callback to trigger an immediate re-fetch after a stop action.
 *
 * Stop flow:
 *   POST /sessions/:id/stop → sets status = "stopped" in registry (no WS)
 *   → calls onRefresh so useSessions re-fetches within 600 ms
 *   → polling loop will reflect "stopped" within 5 s worst case
 */

import { useEffect, useState } from "react";
import {
    stopSession,
    restartSession,
} from "../api/client.js";
import { LiveCountdown } from "./LiveCountdown.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { Card, Button } from "./ui/primitives.jsx";
import { colors, fonts, radius, surface, typeScale } from "../dashboard/theme.js";

/** Convert snake_case game_id → "Title Case" for display */
function formatGameLabel(gameId = "") {
  return gameId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPlayedTime(seconds) {
  if (seconds == null) {
    return "--";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
}

const ACTIVE_STATUSES = new Set(["starting", "running", "stopping", "cleaning"]);

// Clean fit: 9.5px/700/0.13em/uppercase/mono is, within rounding, the
// same uppercase-mono-eyebrow pattern as typeScale.meta
// (10px/700/0.12em/uppercase/mono) — unlike the judgment-call values
// further down in this file, there's no font-family/weight/transform
// mismatch here, just a negligible 0.5px/0.01em rounding difference.
// Adopted directly, same standard as P4-T01's LoadingState 13px→13.5px.
const microLabel = {
  ...typeScale.meta,
  color: colors.inkFaint,
};

/**
 * @param {{
 *   session   : object   enriched session from useSessions
 *   onRefresh : () => void
 * }} props
 */
export function SessionCard({ session, onRefresh }) {
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState(null);

  const isActive = ACTIVE_STATUSES.has(session.status);

  const [nowSeconds, setNowSeconds] = useState(
    Date.now() / 1000
  );

  const [
      restarting,
      setRestarting,
  ] = useState(false);

  const [
      restartError,
      setRestartError,
  ] = useState(null);

  const restartButtonText =
      session.restart_in_progress
          ? "RESTARTING..."
          : session.restart_cooldown_remaining > 0
              ? `WAIT ${session.restart_cooldown_remaining}s`
              : restarting
                  ? "RESTARTING..."
                  : "RESTART GAME"

  async function handleStop() {
    if (!isActive || stopping) return;
    setStopping(true);
    setStopError(null);
    try {
      await stopSession(session.session_id);
      // No WS broadcast for "stopped" — trigger an early re-fetch
      setTimeout(onRefresh, 400);
    } catch (err) {
      setStopError(err.message);
    } finally {
      setStopping(false);
    }
  }

  async function handleRestart() {

      if (
          !isActive ||
          restarting
      ) {
          return;
      }

      setRestarting(true);

      setRestartError(null);

      try {

          await restartSession(
              session.session_id
          );

          setTimeout(
              onRefresh,
              500,
          );

      } catch (err) {

          setRestartError(
              err.message
          );

      } finally {

          setRestarting(false);

      }
  }

  useEffect(() => {
    if (
      !["starting", "running", "stopping"].includes(session.status)
    ) {
      return;
    }

    const id = setInterval(() => {
      setNowSeconds(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(id);
  }, [session.status]);

  const livePlayedSeconds =
    session.started_at && ["starting", "running", "stopping"].includes(session.status)
      ? nowSeconds - session.started_at
      : session.played_seconds;

  const restartDisabled =
      restarting ||
      stopping ||
      session.status === "stopping" ||
      session.status === "cleaning" ||
      session.restart_in_progress ||
      session.status !== "running" ||
      session.restart_cooldown_remaining > 0;

  const restartActive = session.status === "running" && !restartDisabled;

  const stopDisabled =
      stopping ||
      restarting ||
      session.status === "stopping" ||
      session.status === "cleaning";

  return (
    <Card
      style={{
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        border: `1.5px solid ${isActive ? colors.accentGreen : colors.border}`,
        // P6-T06 motion audit: real `transition:`, but 150ms doesn't exactly
        // match any `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms,
        // pill: 180ms cubic-bezier). Left as the original literal.
        transition: "border-color 150ms ease",
        // P6-T06 motion audit: keyframe-based `animation:` (non-convertible,
        // same as primitives.jsx's Spinner / LoadingState.jsx's pulse
        // precedent). This exact string also appears character-for-character
        // in EventLog.jsx (P6-T05) — expected, not a sign either file was
        // audited incorrectly; each file gets its own documentation. Even
        // setting the keyframe issue aside, 180ms's plain `ease` does not
        // match motion.pill's cubic-bezier(0.4,0,0.2,1) — a duration-only
        // coincidence, the same trap P6-T04/P6-T05 both correctly caught.
        // Left as the original literal.
        animation: "card-in 180ms ease forwards",
      }}
    >
      {/* Row 1 — Game name + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          {/* Card title -> typeScale.subheading. Documented, not silent:
              this is a real (small) elevation, not a pure value alias —
              the prior literal was 15px/700, subheading is 17px/600.
              fontWeight kept at 700 (subheading's default is 600) to
              preserve the heading's boldness/character, same override
              pattern P4-T01 used for SectionCard's title. The 15->17px
              size step is taken deliberately: this is the card's primary
              heading, and 17px is the same "card title" step P4-T01
              already established for SectionCard — aligning them is the
              point of this token pass, not a side effect of it. */}
          <div style={{ ...typeScale.subheading, fontWeight: 700, color: colors.ink, marginBottom: "3px" }}>
            {formatGameLabel(session.game_id)}
          </div>
          {/* Judgment call: this is a live user identifier, not a
              caption — typeScale.meta would force uppercase + bold,
              which would be a real (and potentially confusing, for a
              case-sensitive id) content change, not a style alias. Left
              as a literal value. */}
          <div style={{ fontSize: "11px", color: colors.inkFaint, fontFamily: fonts.mono }}>
            {session.user_id}
          </div>
        </div>
        <StatusBadge
          status={
              session.restart_in_progress
                  ? "restarting"
                  : session.status
          }
        />
      </div>

      {/* Row 2 — Countdown block */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-end",
          padding:        "12px 14px",
          background:     surface.l1,
          borderRadius:   `${radius.md}px`,
          border:         `1.5px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={microLabel}>
            {session.skip_timer ? "NO TIMER" : "REMAINING"}
          </span>

          <LiveCountdown
            remainingMinutes={
              session.remaining_minutes
            }

            fetchedAt={
              session.fetchedAt ??
              Date.now()
            }

            skipTimer={
              session.skip_timer
            }

            status={
              session.status
            }
          />

          {livePlayedSeconds != null && (
            // Judgment call (grouped with the error/warning captions
            // below): 10px/mono matches typeScale.meta's size, but meta
            // is 700-weight + forced uppercase. This text isn't bold by
            // design, and forcing uppercase would corrupt the dynamic
            // "played" value's unit suffix (e.g. "2m 34s" -> "2M 34S"),
            // a real content change, not a style alias. Left literal.
            <div
              style={{
                marginTop: "6px",
                fontSize: "10px",
                color: colors.inkDim,
                fontFamily: fonts.mono,
                letterSpacing: "0.08em",
              }}
            >
              PLAYED: {formatPlayedTime(livePlayedSeconds)}
            </div>
          )}

          {session.status === "failed" && session.error && (
            // Judgment call (same group): dynamic, arbitrary-case error
            // text from the backend — forcing typeScale.meta's uppercase
            // would garble a real error message, and the un-bold weight
            // here is intentional (this is inline status text, not a
            // label). Left literal.
            <span
              style={{
                fontSize: "9px",
                color: colors.danger,
                letterSpacing: "0.08em",
                fontFamily: fonts.mono,
                marginTop: "2px",
              }}
            >
              {session.error}
            </span>
          )}

          {session.warning_sent && (
            // Judgment call (same group): content happens to already be
            // static/uppercase, but forcing typeScale.meta's 700 weight
            // would be a real boldness increase with no accompanying
            // layout reason — same non-bold-by-design reasoning as the
            // two captions above. Left literal.
            <span
              style={{
                fontSize:      "9px",
                color:         colors.warning,
                letterSpacing: "0.1em",
                fontFamily:    fonts.mono,
                marginTop:     "2px",
              }}
            >
              ⚠ WARNING SENT
            </span>
          )}
        </div>

        {/* Session ID */}
        <div style={{ textAlign: "right" }}>
          <div style={{ ...microLabel, marginBottom: "5px" }}>
            SESSION ID
          </div>
          {/* Same judgment call as the user_id caption above: a raw
              identifier, not a caption — forcing typeScale.meta's
              uppercase/bold would be a content change, not a style
              alias. Left literal. */}
          <code style={{ fontSize: "11px", color: colors.inkFaint, fontFamily: fonts.mono, letterSpacing: "0.06em" }}>
            {session.session_id}
          </code>
        </div>
      </div>

      {/* Row 3 — Stop / Cleanup status */}
      {!["completed", "failed", "stopped"].includes(session.status) && (
        <div>
          {stopError && (
            // Judgment call (same group as the PLAYED/error/warning
            // captions above): dynamic backend error text, not bold by
            // design — forcing typeScale.meta here would both bold it
            // and (via textTransform) risk garbling arbitrary-case
            // server error strings. Left literal.
            <div style={{ marginBottom: "8px", fontSize: "11px", color: colors.danger, fontFamily: fonts.mono }}>
              ✕ {stopError}
            </div>
          )}

          {
              restartError && (
                  // Same judgment call as stopError above.
                  <div
                      style={{
                          marginBottom: "8px",
                          fontSize: "11px",
                          color: colors.warning,
                          fontFamily: fonts.mono,
                      }}
                  >
                      ⚠ {restartError}
                  </div>
              )
          }

          {session.status === "cleaning" ? (
            // Judgment call (same group): static/already-uppercase
            // text, close to typeScale.meta in size/letterSpacing, but
            // not bold by design — this reads as inline status text,
            // not a label, so the un-bold weight is intentional. Left
            // literal rather than forced into meta's 700 weight.
            <div style={{ fontSize: "10px", color: colors.inkDim, fontFamily: fonts.mono, textAlign: "center", letterSpacing: "0.13em" }}>
              CLEANING SAVES…
            </div>
          ) : (
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                }}
            >
                {/* Judgment call, both buttons: 10px/mono is close to
                    typeScale.meta in size, but meta wasn't adopted here
                    for two reasons — (1) meta's forced uppercase would
                    corrupt the dynamic cooldown label's unit suffix
                    (e.g. "WAIT 5s" -> "WAIT 5S"), a real content change;
                    (2) meta's 700 weight would decouple these buttons'
                    boldness from every other Button in the app, which
                    all default to the primitive's own 650 (see
                    ui/primitives.jsx) — matching the shared Button
                    baseline is more consistent here than matching the
                    label scale. Left literal. */}
                <Button
                    variant="secondary"
                    onClick={handleRestart}
                    disabled={restartDisabled}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "9px",
                        fontFamily: fonts.mono,
                        fontSize: "10px",
                        letterSpacing: "0.13em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        borderColor: restartActive ? colors.warning : colors.border,
                        color: restartActive ? colors.warning : colors.inkFaint,
                    }}
                >
                  {restartButtonText}
                </Button>

                <Button
                    variant="danger"
                    onClick={handleStop}
                    disabled={stopDisabled}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "9px",
                        fontFamily: fonts.mono,
                        fontSize: "10px",
                        letterSpacing: "0.13em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {
                        stopping ||
                        session.status === "stopping"
                            ? "STOPPING..."
                            : "STOP SESSION"
                    }
                </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
