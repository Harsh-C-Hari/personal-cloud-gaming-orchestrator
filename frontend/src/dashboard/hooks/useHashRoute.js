/**
 * dashboard/hooks/useHashRoute.js
 *
 * Minimal client-side router driven by window.location.hash.
 * No new dependency, no backend involvement — purely a frontend
 * navigation concern so every page (Home, Games, Logs, Settings, ...)
 * gets a real, bookmarkable, back-button-friendly URL, e.g.
 *   #/home
 *   #/settings/change-password
 *
 * Deliberately tiny: this app doesn't need nested routers, params,
 * or code-splitting — just "which page is active" + "go to X".
 */

import { useCallback, useEffect, useState } from "react";

function readRoute(fallback) {
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  return raw || fallback;
}

export function useHashRoute(fallback = "home") {
  const [route, setRoute] = useState(() => readRoute(fallback));

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute(fallback));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [fallback]);

  // Keep the URL in sync if we land on an empty hash.
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", `#/${fallback}`);
    }
  }, [fallback]);

  const navigate = useCallback((next) => {
    if (readRoute(fallback) === next) {
      // Still update in case caller relies on re-navigation, but avoid
      // pushing a duplicate history entry.
      window.history.replaceState(null, "", `#/${next}`);
      setRoute(next);
      return;
    }
    window.location.hash = `/${next}`;
  }, [fallback]);

  return [route, navigate];
}
