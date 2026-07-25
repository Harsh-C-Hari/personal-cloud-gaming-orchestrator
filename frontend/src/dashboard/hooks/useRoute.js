/**
 * dashboard/hooks/useRoute.js
 *
 * Pathname-based router using the History API (pushState/popstate) instead
 * of a hash. Gives clean URLs: /home, /settings, /change-password, etc.
 *
 * Route segments are deliberately kept distinct from the backend proxy
 * prefixes in vite.config.js (/sessions, /games, /health, /saves, /ws,
 * /host, /config, /admin, /system) so a hard refresh or direct URL entry
 * on any page never gets intercepted by the dev proxy. See AdminDashboard
 * for the route → label mapping ("game-manager", "monitor", etc.).
 */

import { useCallback, useEffect, useRef, useState } from "react";

function readRoute(fallback) {
  const raw = window.location.pathname.replace(/^\/+/, "").trim();
  return raw || fallback;
}

export function useRoute(fallback = "home") {
  const [route, setRoute] = useState(() => readRoute(fallback));

  // Internal "came from" stack — lets Back buttons return to whichever
  // page the user actually navigated from (e.g. Settings → Logs → Back
  // goes to Settings, not always Home), instead of a hardcoded target.
  const stackRef = useRef([route]);

  useEffect(() => {
    const onPopState = () => {
      const next = readRoute(fallback);
      setRoute(next);
      // A native browser back/forward press bypasses navigate()/goBack(),
      // so resync our stack to the single page we actually landed on
      // rather than leaving it pointing at stale entries.
      stackRef.current = [next];
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [fallback]);

  const navigate = useCallback((next) => {
    const target = `/${next}`;
    if (window.location.pathname === target) return;
    window.history.pushState(null, "", target);
    setRoute(next);
    stackRef.current.push(next);
  }, []);

  // Goes to whichever route was active immediately before this one. Falls
  // back to `fallback` ("home") when there's nowhere recorded to return to
  // (e.g. straight after a hard refresh / direct link).
  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) {
      stackRef.current.pop();
      const prev = stackRef.current[stackRef.current.length - 1];
      window.history.pushState(null, "", `/${prev}`);
      setRoute(prev);
    } else {
      navigate(fallback);
    }
  }, [navigate, fallback]);

  return [route, navigate, goBack];
}
