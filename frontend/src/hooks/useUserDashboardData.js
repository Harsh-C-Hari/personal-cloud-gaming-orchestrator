import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    fetchUserHostStatus,
    fetchGames,
    reloadGames,
} from "../api/client.js";

export function useUserDashboardData() {

    const [hostStatus, setHostStatus] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [games, setGames] =
        useState({});

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const isLoadedRef =
        useRef(false);

    const loadGames =
        useCallback(async () => {

            try {

                await reloadGames();

                const data =
                    await fetchGames();

                setGames(
                    data ?? {}
                );

            } catch {

                setGames({});
            }

        }, []);

    const refresh =
        useCallback(async () => {

            setLoading(true);

            try {

                const data =
                    await fetchUserHostStatus();

                setHostStatus(data);

                setError("");

                setLastUpdated(
                    new Date()
                );

            } catch (err) {

                setError(
                    err.message
                );

            } finally {

                setLoading(false);

            }

        }, []);

    useEffect(() => {

        refresh();

        const id =
            setInterval(
                refresh,
                5000
            );

        return () =>
            clearInterval(id);

    }, [refresh]);

    useEffect(() => {

        if (
            isLoadedRef.current
        ) {
            return;
        }

        loadGames();

        isLoadedRef.current = true;

    }, [loadGames]);

    return {

        hostStatus,

        games,

        loading,

        error,

        lastUpdated,

        refresh,

        loadGames,
    };
}