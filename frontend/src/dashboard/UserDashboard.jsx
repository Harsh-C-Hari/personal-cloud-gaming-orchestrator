/**
 * dashboard/UserDashboard.jsx
 *
 * Per the migration note: GET /host/status and /host/metrics become
 * admin-only after this refactor. Users get GET /host/user-status via the
 * already-implemented useUserDashboardData hook. Its response is adapted
 * (adaptUserHostStatus) to the flat shape StartSessionForm/buildAlerts
 * already expect, so no shared component needed any code changes.
 *
 * Only renders Home, Analytics, Session History, and Logs — matching the
 * requested user page list. Any other route falls back to Home.
 */

import { useEffect, useMemo, useState } from "react";
import { FaHome, FaChartBar, FaHistory, FaClipboardList, FaLock } from "react-icons/fa";
import { useUserDashboardData } from "../hooks/useUserDashboardData.js";
import { useSessionShell } from "./useSessionShell.js";
import { useRoute } from "./hooks/useRoute.js";
import { DashboardLayout } from "./layout/DashboardLayout.jsx";
import { logout } from "./utils/logout.js";
import { adaptUserHostStatus, buildUserAlerts } from "./utils/adaptUserHostStatus.js";

import { Home } from "./pages/Home.jsx";
import { AnalyticsPage } from "./pages/AnalyticsPage.jsx";
import { SessionHistoryPage } from "./pages/SessionHistoryPage.jsx";
import { LogsPage } from "./pages/LogsPage.jsx";
import { ChangePasswordPage } from "./pages/ChangePasswordPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

const NAV_ITEMS = [
  { route: "home", icon: <FaHome />, label: "Home" },
  { route: "analytics", icon: <FaChartBar />, label: "Analytics" },
  { route: "history", icon: <FaHistory />, label: "Session History" },
  { route: "logs", icon: <FaClipboardList />, label: "Logs" },
  { route: "change-password", icon: <FaLock />, label: "Change Password" },
];

const HOME_NAV_CARDS = [
  { route: "analytics", icon: <FaChartBar />, label: "Analytics", description: "Usage trends" },
  { route: "history", icon: <FaHistory />, label: "History", description: "Past sessions" },
  { route: "logs", icon: <FaClipboardList />, label: "Logs", description: "Activity log" },
  { route: "change-password", icon: <FaLock />, label: "Change Password", description: "Update your password" },
];

export function UserDashboard({ username }) {
  const [route, navigate, goBack] = useRoute("home");

  const { hostStatus: rawHostStatus, games, lastUpdated } = useUserDashboardData();

  const hostStatus = useMemo(() => adaptUserHostStatus(rawHostStatus), [rawHostStatus]);

  // The user-status payload already ships a curated, severity-tagged
  // alerts array (maintenance/recovery/health/sunshine/tailscale) — use it
  // directly instead of useSessionShell's admin-shape buildAlerts().
  const activeAlerts = useMemo(() => buildUserAlerts(rawHostStatus), [rawHostStatus]);

  const { wsEvents, connected, sessions, activeSessions, finishedSessions, loading, refresh, historyRefreshKey } =
    useSessionShell({ hostStatus });

  const goHome = () => navigate("home");

  // Pages the user has actually visited this session stay mounted (just
  // hidden via CSS) once landed on, instead of being unmounted whenever
  // navigating elsewhere — that's what lets in-progress input (e.g. a
  // half-filled Change Password form) survive a trip to another page.
  const [visitedRoutes, setVisitedRoutes] = useState(() => new Set([route]));

  useEffect(() => {
    setVisitedRoutes((prev) => (prev.has(route) ? prev : new Set(prev).add(route)));
  }, [route]);

  const pages = {
    home: (
      <Home
        games={games}
        hostStatus={hostStatus}
        sessions={sessions}
        activeSessions={activeSessions}
        finishedSessions={finishedSessions}
        loading={loading}
        refresh={refresh}
        activeAlerts={activeAlerts}
        connected={connected}
        wsEvents={wsEvents}
        navCards={HOME_NAV_CARDS}
        onNavigate={navigate}
      />
    ),
    analytics: <AnalyticsPage refreshKey={historyRefreshKey} onBack={goBack} />,
    history: <SessionHistoryPage refreshKey={historyRefreshKey} onBack={goBack} />,
    logs: <LogsPage onBack={goBack} />,
    "change-password": <ChangePasswordPage onBack={goBack} />,
  };

  const isKnownRoute = Object.prototype.hasOwnProperty.call(pages, route);
  const activeKey = isKnownRoute ? route : null;

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeRoute={isKnownRoute ? route : null}
      onNavigate={navigate}
      connected={connected}
      lastUpdated={lastUpdated}
      username={username}
      role="user"
      onLogout={logout}
      onLogoClick={goHome}
    >
      {!isKnownRoute && <NotFoundPage path={route} onGoHome={goHome} />}
      {Object.entries(pages).map(([key, element]) => {
        if (!visitedRoutes.has(key) && key !== activeKey) return null;
        return (
          <div key={key} style={{ display: key === activeKey ? "block" : "none" }}>
            {element}
          </div>
        );
      })}
    </DashboardLayout>
  );
}
