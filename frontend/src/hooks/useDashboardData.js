import {
    useCallback,
    useEffect,
    useState,
    useRef,
} from "react";

import {
    fetchHostStatus,
    fetchHostMetrics,
    fetchSessionHealth,
    fetchRecoveryEvents,
    fetchRecoveryStats,
    fetchGames,
    reloadGames,
    fetchTailscaleStatus,
    getSunshineStream,
    fetchStreamHistory,
} from "../api/client.js";

import { useWebSocket } from "./useWebSocket.js";

export function useDashboardData() {

    const [hostStatus, setHostStatus] =
        useState(null);

    const [hostMetrics, setHostMetrics] =
        useState(null);

    const [tailscaleStatus, setTailscaleStatus] =
        useState(null);

    const [hostLoading, setHostLoading] =
        useState(false);

    const [hostError, setHostError] =
        useState("");

    const [sessionHealth, setSessionHealth] =
        useState(null);

    const [recoveryEvents, setRecoveryEvents] =
        useState([]);

    const [recoveryEventsLoading, setRecoveryEventsLoading] = useState(true);
    
    const [recoveryStats, setRecoveryStats] =
        useState(null);

    const [games, setGames] =
        useState({});

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [streamStatus, setStreamStatus] = useState(null);

    const [streamHistory, setStreamHistory] = useState([]);
    
    const [streamHistoryLoading, setStreamHistoryLoading ] = useState(true);

    // Timestamps of the last WS-driven update to each of the 4 fields
    // also covered by REST polling below. A REST request that's already
    // in-flight when a real state change happens will resolve carrying
    // the OLD pre-change snapshot -- if applied unconditionally, it
    // silently stomps the correct value the WS push just delivered,
    // until the next 5s poll cycle happens to catch the now-current
    // state and "self-corrects". These refs let refreshHostData detect
    // "a WS update landed after I started this request" and skip
    // applying that one stale field instead of overwriting good data.
    const lastWsSunshineStateAt = useRef(0);
    const lastWsSunshineHistoryAt = useRef(0);
    const lastWsRecoveryEventsAt = useRef(0);
    const lastWsRecoveryStatsAt = useRef(0);

    const loadSessionHealth =
        useCallback(async () => {

            try {

                const data =
                    await fetchSessionHealth();

                setSessionHealth(data);

            } catch {

                setSessionHealth(null);

            }

        }, []);

    const isLoadedRef = useRef(false);
    
    const loadGames =
        useCallback(async () => {

            try {

                await reloadGames();
                const data =
                    await fetchGames();

                setGames(data ?? {});

            } catch (err) {

                console.error(
                    "Failed to load games",
                    err
                );

                setGames({});

            }

        }, []);

    const refreshHostData =
        useCallback(async () => {

            setHostLoading(true);

            // Snapshot "now" before firing any request below. Any WS
            // update whose timestamp is >= this was applied after we
            // started asking the server for this same data, so our
            // response (once it arrives) can't be trusted to be at
            // least as fresh -- skip applying that one field.
            const requestStartedAt = Date.now();

            try {

                //
                // Primary dashboard data
                //

                const [
                    statusData,
                    metricsData,
                    tailscaleData,
                    streamData,
                ] = await Promise.all([
                    fetchHostStatus(),
                    fetchHostMetrics(),
                    fetchTailscaleStatus(),
                    getSunshineStream(),
                ]);

                // Apply immediately
                setHostStatus(statusData);

                setHostMetrics(metricsData);

                setTailscaleStatus(
                    tailscaleData
                );

                if (
                    requestStartedAt >=
                    lastWsSunshineStateAt.current
                ) {

                    setStreamStatus(streamData);
                }
                
                //
                // Secondary dashboard data
                //

                const [
                    healthResult,
                    recoveryEventsResult,
                    recoveryStatsResult,
                    streamHistoryResult,
                ] = await Promise.allSettled([
                    fetchSessionHealth(),
                    fetchRecoveryEvents(),
                    fetchRecoveryStats(),
                    fetchStreamHistory(),
                ]);

                if (
                    healthResult.status ===
                    "fulfilled"
                ) {

                    setSessionHealth(
                        healthResult.value
                    );
                }

                if (
                    recoveryEventsResult.status ===
                    "fulfilled" &&
                    requestStartedAt >=
                    lastWsRecoveryEventsAt.current
                ) {

                    setRecoveryEvents(
                        recoveryEventsResult.value.events ?? []
                    );
                }

                if (
                    recoveryStatsResult.status ===
                    "fulfilled" &&
                    requestStartedAt >=
                    lastWsRecoveryStatsAt.current
                ) {

                    setRecoveryStats(
                        recoveryStatsResult.value
                    );
                }

                if (
                    streamHistoryResult.status ===
                    "fulfilled" &&
                    requestStartedAt >=
                    lastWsSunshineHistoryAt.current
                ) {

                    setStreamHistory(
                        streamHistoryResult.value.streams ?? []
                    );
                }

                setHostError("");

                setLastUpdated(
                    new Date()
                );

            } catch (err) {

                console.error(
                    "Host refresh failed:",
                    err
                );

                setHostError(
                    err.message ??
                    "Failed to load host status"
                );

            } finally {

                setHostLoading(false);
                setStreamHistoryLoading(false);
                setRecoveryEventsLoading(false);

            }

        }, []);

    // ── WebSocket-driven live updates ───────────────────────────────────
    //
    // REST polling above (every 5 s) remains as the source of truth /
    // resync mechanism. This handler applies the same data instantly
    // when it arrives over the socket, same pattern useSessions.js uses
    // for session status. recovery_event is additive (prepend the new
    // event) since the WS payload is a single event, not the full list;
    // everything else is a full-value replacement matching the REST
    // response shape exactly.

    const handleWsEvent = useCallback((event) => {

        switch (event.type) {

            case "sunshine_state_update":
                lastWsSunshineStateAt.current = Date.now();
                setStreamStatus(event.state);
                break;

            case "sunshine_history_update":
                lastWsSunshineHistoryAt.current = Date.now();
                setStreamHistory(event.streams ?? []);
                break;

            case "recovery_event":
                lastWsRecoveryEventsAt.current = Date.now();
                setRecoveryEvents((prev) =>
                    [event.event, ...prev].slice(0, 100)
                );
                break;

            case "recovery_stats_update":
                lastWsRecoveryStatsAt.current = Date.now();
                setRecoveryStats(event.stats);
                break;

            default:
                break;
        }

    }, []);

    useWebSocket(handleWsEvent);

    useEffect(() => {

        refreshHostData();

        const id =
            setInterval(
                refreshHostData,
                5000
            );

        return () =>
            clearInterval(id);

    }, [refreshHostData]);

    useEffect(() => {

        if (isLoadedRef.current) return;
        
        loadGames();
        isLoadedRef.current = true;
    }, [loadGames]);

    useEffect(() => {

        loadSessionHealth();

    }, [loadSessionHealth]);

    return {

        hostStatus,
        hostMetrics,
        tailscaleStatus,
        streamStatus,

        hostLoading,
        streamHistoryLoading,
        hostError,

        sessionHealth,

        recoveryEvents,
        recoveryEventsLoading,
        recoveryStats,
        streamHistory,

        games,

        lastUpdated,

        refreshHostData,
        loadGames,
        loadSessionHealth,
    };
}