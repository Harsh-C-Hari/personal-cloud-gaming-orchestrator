/**
 * hooks/useSessions.js
 *
 * Owns all session data: fetching, enrichment, and WS-driven live updates.
 *
 * Two-layer update strategy:
 *
 *   1. Polling (5 s)
 *      GET /sessions/active → GET /sessions/:id for each entry.
 *      Catches: "stopped" state (stop_session has NO WS broadcast),
 *               sessions that expired and left the registry.
 *
 *   2. WebSocket (instant)
 *      On "status_update" → optimistically update local status immediately,
 *      then re-fetch after 600 ms to sync remaining_minutes and warning_sent.
 *
 * Enriched session shape:
 *   {
 *     session_id        : string
 *     user_id           : string
 *     game_id           : string
 *     status            : "starting" | "running" | "completed" | "failed" | "stopped"
 *     remaining_minutes : number | null   (null when skip_timer = true)
 *     warning_sent      : boolean
 *     fetchedAt         : number          (Date.now() at time of detail fetch)
 *                                          used by LiveCountdown for interpolation
 *   }
 *
 * Usage:
 *   const { sessions, loading, refresh } = useSessions({ onWsEvent });
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchActiveSessions, fetchSessionStatus } from "../api/client.js";

const POLL_INTERVAL_MS       = 5_000;
const WS_REFETCH_DELAY_MS    = 600;

/**
 * @param {{ onWsEvent?: (event: object) => void }} options
 */
export function useSessions({ onWsEvent } = {}) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Stable ref for the refetch so WS handler can call it
  const refetchRef = useRef(null);

  // ── Core fetch ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const { sessions: list } = await fetchActiveSessions();

      const fetchedAt = Date.now();

      // Enrich each session with remaining_minutes + warning_sent.
      // allSettled: a 404 on one session (removed from registry after
      // completed/failed + 10 s grace) must not kill the whole list.
      const details = await Promise.allSettled(
        list.map((s) => fetchSessionStatus(s.session_id)),
      );

      const enriched = list.map((s, i) => {
        const extra =
          details[i].status === "fulfilled" ? details[i].value : {};
        return { ...s, ...extra, fetchedAt };
      });

      setSessions(enriched);
    } catch {
      // Network down — preserve previous state, do not crash
    } finally {
      setLoading(false);
    }
  }, []);

  // Expose refetch via ref so WS handler closure stays stable
  refetchRef.current = fetchAll;

  // ── Initial load + polling ──────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  // ── WebSocket-driven update ─────────────────────────────────────────────

  /**
   * Call this from Dashboard whenever a WS "status_update" arrives.
   * Applies an optimistic local update immediately, then re-fetches
   * after WS_REFETCH_DELAY_MS to sync remaining_minutes.
   *
   * @param {{ type: string, session_id: string, status: string }} event
   */
  const applyWsEvent = useCallback((event) => {
    if (event.type !== "status_update") return;

    onWsEvent?.(event);

    // Optimistic update — instant UI response
    setSessions((prev) =>
      prev.map((s) =>
        s.session_id === event.session_id
          ? { ...s, status: event.status, fetchedAt: Date.now() }
          : s,
      ),
    );

    // Re-fetch to get accurate remaining_minutes after the state change
    setTimeout(() => refetchRef.current?.(), WS_REFETCH_DELAY_MS);
  }, [onWsEvent]);

  return {
    sessions,
    loading,
    refresh: fetchAll,
    applyWsEvent,
  };
}
