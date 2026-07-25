/**
 * dashboard/useSessionShell.js
 *
 * Session + WebSocket + event-log wiring shared by both AdminDashboard and
 * UserDashboard. This is the same logic that used to live inline in
 * pages/Dashboard.jsx (wsEvents state/localStorage, loadSessionEvents,
 * handleWsEvent, useSessions, useWebSocket, active/finished session
 * splitting, alert building) — moved here unchanged so it isn't duplicated
 * across the two role-specific dashboards.
 *
 * No hook internals (useSessions, useWebSocket), API calls, or business
 * logic were modified — only relocated out of the page component.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchSessionEvents } from "../api/client.js";
import { useSessions } from "../hooks/useSessions.js";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { buildAlerts } from "./utils/alerts.js";

const WS_EVENTS_STORAGE_KEY = "pcgo_ws_events";

// The event feed is no longer clamped to a fixed count — it shows the full
// history of the *most recent* session instead (start → restart → stop →
// cleanup). This is just a generous safety ceiling so one abnormally long
// session can't fetch an unbounded payload; it is not a "last N" limit.
const SESSION_EVENTS_FETCH_LIMIT = 500;

/** Split a Date into separately-styleable date/time strings for the log. */
function splitTimestamp(date) {
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: date.toLocaleTimeString(),
  };
}

/**
 * @param {{
 *   hostStatus?: object,
 *   hostMetrics?: object,
 *   onTerminalEvent?: () => void   // called on session completed/failed
 * }} options
 */
export function useSessionShell({ hostStatus, hostMetrics, onTerminalEvent } = {}) {
  const [wsEvents, setWsEvents] = useState(() => {
    try {
      const raw = localStorage.getItem(WS_EVENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Which session the currently displayed feed belongs to — lets the feed
  // reset cleanly when a brand-new session starts instead of trailing off
  // an older, unrelated session's events.
  const latestSessionIdRef = useRef(wsEvents[0]?.session_id ?? null);

  const loadSessionEvents = useCallback(async () => {
    try {
      // Step 1: find the single most recent event to know which session
      // is "last".
      const latest = await fetchSessionEvents({ limit: 1 });
      const latestEvent = latest.events?.[0];

      if (!latestEvent) {
        setWsEvents([]);
        latestSessionIdRef.current = null;
        return;
      }

      // Step 2: pull every event belonging to that session — not capped
      // to a small fixed number.
      const data = await fetchSessionEvents({
        limit: SESSION_EVENTS_FETCH_LIMIT,
        sessionId: latestEvent.session_id,
      });

      latestSessionIdRef.current = latestEvent.session_id;

      setWsEvents(
        (data.events || []).map((event) => {
          const { date, time } = splitTimestamp(new Date(event.time * 1000));
          return {
            type: "session_status",
            session_id: event.session_id,
            user_id: event.user_id,
            game_id: event.game_id,
            status: event.status,
            message: event.message,
            ts: time,
            date,
          };
        })
      );
    } catch {
      // Keep local/current events if backend event fetch fails
    }
  }, []);

  const handleWsEvent = useCallback(
    (event) => {
      const { date, time } = splitTimestamp(new Date());

      const isNewSession = Boolean(event.session_id) && event.session_id !== latestSessionIdRef.current;
      if (event.session_id) {
        latestSessionIdRef.current = event.session_id;
      }

      setWsEvents((prev) => [
        {
          type: event.type || "session_status",
          session_id: event.session_id,
          user_id: event.user_id,
          game_id: event.game_id,
          status: event.status,
          message: event.message || event.status,
          ts: time,
          date,
        },
        // A new session starts its own feed rather than trailing onto
        // whatever the previous (now unrelated) session left behind.
        ...(isNewSession ? [] : prev),
      ]);

      if (event.status === "completed" || event.status === "failed") {
        setHistoryRefreshKey((v) => v + 1);
        onTerminalEvent?.();
        loadSessionEvents();
      }
    },
    [loadSessionEvents, onTerminalEvent]
  );

  const { sessions, loading, refresh, applyWsEvent } = useSessions({
    onWsEvent: handleWsEvent,
  });

  const { connected } = useWebSocket(applyWsEvent);

  // Keep in sync with SessionCard's own ACTIVE_STATUSES definition: a
  // session is still "active" while it's starting, running, stopping, or
  // cleaning up — only completed/failed/stopped sessions count as finished.
  const ACTIVE_SESSION_STATUSES = new Set(["starting", "running", "stopping", "cleaning"]);

  const activeSessions = sessions.filter((s) => ACTIVE_SESSION_STATUSES.has(s.status));
  const finishedSessions = sessions.filter((s) => !ACTIVE_SESSION_STATUSES.has(s.status));

  const activeAlerts = buildAlerts(hostStatus, hostMetrics);

  useEffect(() => {
    localStorage.setItem(WS_EVENTS_STORAGE_KEY, JSON.stringify(wsEvents));
  }, [wsEvents]);

  useEffect(() => {
    loadSessionEvents();
  }, [loadSessionEvents]);

  return {
    wsEvents,
    connected,
    sessions,
    activeSessions,
    finishedSessions,
    loading,
    refresh,
    activeAlerts,
    historyRefreshKey,
  };
}
