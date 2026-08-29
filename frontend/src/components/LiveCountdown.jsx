/**
 * components/LiveCountdown.jsx
 *
 * Displays a real-time countdown that interpolates locally between polls.
 *
 * Why interpolation instead of polling each second?
 *   GET /sessions/:id costs a backend call and is already polled every 5 s
 *   by useSessions. Instead, we record the timestamp when remaining_minutes
 *   was fetched (fetchedAt) and tick every second:
 *
 *     current = remainingMinutes - (Date.now() - fetchedAt) / 60_000
 *
 *   This gives smooth second-level precision without extra requests.
 *
 * Warning state activates when ≤ warningMins remain.
 * Mirrors the backend warning_before_minutes logic in session_service.py.
 *
 * Presentation-only change for the redesign: the glow `textShadow` on both
 * the normal and warning states was removed (DESIGN_SYSTEM.md explicitly
 * bans glow/text-shadow effects) and the hard-coded hex colors were swapped
 * for `colors.ink` / `colors.warning` tokens. Logic, props, and timing are
 * untouched.
 *
 * @param {{
 *   remainingMinutes : number | null   null when skip_timer = true
 *   fetchedAt        : number          Date.now() at fetch time
 *   skipTimer        : boolean
 *   warningMins      : number          default 5, matches config.json default
 * }} props
 */

import { useEffect, useState } from "react";
import { colors, fonts } from "../dashboard/theme.js";

/** Format minutes (float) → "MM:SS" */
function formatTime(mins) {
  const totalSecs = Math.max(0, Math.floor(mins * 60));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LiveCountdown({
  remainingMinutes,
  fetchedAt,
  skipTimer = false,
  warningMins = 5,
  status,
}) {
  const [display, setDisplay] = useState("--:--");
  const [isWarn,  setIsWarn]  = useState(false);

  useEffect(() => {

    // Session already ended
    if (
      status === "completed" ||
      status === "failed" ||
      status === "stopped"
    ) {

      setIsWarn(false);

      return;
    }

    // Unlimited session
    if (
      skipTimer ||
      remainingMinutes == null
    ) {

      setDisplay("∞");
      setIsWarn(false);

      return;
    }

    function tick() {

      const elapsedMins =
        (Date.now() - fetchedAt)
        / 60_000;

      const current =
        remainingMinutes
        - elapsedMins;

      setDisplay(
        formatTime(current)
      );

      setIsWarn(
        current > 0 &&
        current <= warningMins
      );
    }

    tick();

    const id = setInterval(
      tick,
      1_000
    );

    return () =>
      clearInterval(id);

  }, [
    remainingMinutes,
    fetchedAt,
    skipTimer,
    warningMins,
    status,
  ]);

  return (
    <span
      style={{
        fontFamily:    fonts.mono,
        fontSize:      "26px",
        fontWeight:    700,
        color:         isWarn ? colors.warning : colors.ink,
        letterSpacing: "0.04em",
        lineHeight:    1,
        // P6-T05 motion audit: real `transition:`, but 400ms doesn't exactly
        // match any `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms,
        // pill: 180ms cubic-bezier). Left as the original literal; no
        // conversion.
        transition:    "color 0.4s ease",
      }}
    >
      {
        status === "completed"
          ? "COMPLETED"

        : status === "failed"
          ? "FAILED"

        : status === "stopped"
          ? "STOPPED"

        : status === "stopping"
          ? "STOPPING"

        : status === "cleaning"
          ? "CLEANING"

        : status === "restarted"
          ? "RESTARTED"

        : display
      }
    </span>
  );
}
