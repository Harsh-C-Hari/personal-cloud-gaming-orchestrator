import {
    useCallback,
    useEffect,
    useState,
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

    const [recoveryStats, setRecoveryStats] =
        useState(null);

    const [games, setGames] =
        useState({});

    const [lastUpdated, setLastUpdated] =
        useState(null);

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
                ] = await Promise.all([
                    fetchHostStatus(),
                    fetchHostMetrics(),
                    fetchTailscaleStatus(),
                ]);

                // Apply immediately
                setHostStatus(statusData);

                setHostMetrics(metricsData);

                setTailscaleStatus(
                    tailscaleData
                );

                //
                // Secondary dashboard data
                //

                const [
                    healthResult,
                    recoveryEventsResult,
                    recoveryStatsResult,
                ] = await Promise.allSettled([
                    fetchSessionHealth(),
                    fetchRecoveryEvents(),
                    fetchRecoveryStats(),
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

        loadGames();

    }, [loadGames]);

    useEffect(() => {

        loadSessionHealth();

    }, [loadSessionHealth]);

    return {

        hostStatus,
        hostMetrics,
        tailscaleStatus,

        hostLoading,
        hostError,

        sessionHealth,

        recoveryEvents,
        recoveryStats,

        games,

        lastUpdated,

        refreshHostData,
        loadGames,
        loadSessionHealth,
    };
}