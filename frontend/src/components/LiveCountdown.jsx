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
 * @param {{
 *   remainingMinutes : number | null   null when skip_timer = true
 *   fetchedAt        : number          Date.now() at fetch time
 *   skipTimer        : boolean
 *   warningMins      : number          default 5, matches config.json default
 * }} props
 */

import { useEffect, useState } from "react";

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
        fontFamily:    "'JetBrains Mono', monospace",
        fontSize:      "26px",
        fontWeight:    700,
        color:         isWarn ? "#f59e0b" : "#e2e8f0",
        textShadow:    isWarn
          ? "0 0 20px rgba(245,158,11,0.6)"
          : "0 0 12px rgba(226,232,240,0.1)",
        letterSpacing: "0.04em",
        lineHeight:    1,
        transition:    "color 0.4s ease, text-shadow 0.4s ease",
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

        : display
      }
    </span>
  );
}
