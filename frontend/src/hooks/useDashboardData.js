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

                setStreamStatus(streamData);
                
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
                    "fulfilled"
                ) {

                    setRecoveryEvents(
                        recoveryEventsResult.value.events ?? []
                    );
                }

                if (
                    recoveryStatsResult.status ===
                    "fulfilled"
                ) {

                    setRecoveryStats(
                        recoveryStatsResult.value
                    );
                }

                if (
                    streamHistoryResult.status ===
                    "fulfilled"
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