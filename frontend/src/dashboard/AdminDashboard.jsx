/**
 * dashboard/AdminDashboard.jsx
 *
 * Owns all admin data/handlers (same logic as the old Dashboard.jsx, just
 * relocated) and renders the requested admin page via DashboardLayout.
 *
 * Nothing here changes hostStatus/hostMetrics fetching, sunshine/maintenance
 * actions, revalidation, or force-unlock behavior — every handler is the
 * same implementation that used to live inline in pages/Dashboard.jsx.
 */

import { useCallback, useEffect, useState } from "react";
import {
  FaHome,
  FaServer,
  FaSyncAlt,
  FaPlay,
  FaGamepad,
  FaUsersCog,
  FaChartBar,
  FaHistory,
  FaClipboardList,
  FaCog,
} from "react-icons/fa";
import { useDashboardData } from "../hooks/useDashboardData.js";
import { forceUnlockSession, startSunshine, restartSunshine, enableMaintenance, disableMaintenance, revalidateHost } from "../api/client.js";
import { useSessionShell } from "./useSessionShell.js";
import { useRoute } from "./hooks/useRoute.js";
import { DashboardLayout } from "./layout/DashboardLayout.jsx";
import { logout } from "./utils/logout.js";

import { Home } from "./pages/Home.jsx";
import { HostMonitorPage } from "./pages/HostMonitorPage.jsx";
import { RecoveryPage } from "./pages/RecoveryPage.jsx";
import { SunshinePage } from "./pages/SunshinePage.jsx";
import { GameManagerPage } from "./pages/GameManagerPage.jsx";
import { UserManagementPage } from "./pages/UserManagementPage.jsx";
import { AnalyticsPage } from "./pages/AnalyticsPage.jsx";
import { SessionHistoryPage } from "./pages/SessionHistoryPage.jsx";
import { LogsPage } from "./pages/LogsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { ChangePasswordPage } from "./pages/ChangePasswordPage.jsx";

const NAV_ITEMS = [
  { route: "home", icon: <FaHome />, label: "Home" },
  { route: "monitor", icon: <FaServer />, label: "Host Monitor" },
  { route: "recovery", icon: <FaSyncAlt />, label: "Recovery" },
  { route: "streams", icon: <FaPlay />, label: "Sunshine Stream" },
  { route: "game-manager", icon: <FaGamepad />, label: "Game Manager" },
  { route: "users", icon: <FaUsersCog />, label: "User Management" },
  { route: "analytics", icon: <FaChartBar />, label: "Analytics" },
  { route: "history", icon: <FaHistory />, label: "Session History" },
  { route: "logs", icon: <FaClipboardList />, label: "Logs" },
  { route: "settings", icon: <FaCog />, label: "Settings" },
];

const HOME_NAV_CARDS = [
  { route: "game-manager", icon: <FaGamepad />, label: "Games", description: "Manage Games" },
  { route: "monitor", icon: <FaServer />, label: "Host Monitor", description: "Live host status" },
  { route: "recovery", icon: <FaSyncAlt />, label: "Recovery", description: "Recovery stats & events" },
  { route: "streams", icon: <FaPlay />, label: "Streams", description: "Sunshine stream history" },
  { route: "analytics", icon: <FaChartBar />, label: "Analytics", description: "Usage trends" },
  { route: "history", icon: <FaHistory />, label: "History", description: "Past sessions" },
  { route: "logs", icon: <FaClipboardList />, label: "Logs", description: "Activity log" },
  { route: "users", icon: <FaUsersCog />, label: "Users", description: "User management" },
  { route: "settings", icon: <FaCog />, label: "Settings", description: "Password, config, about" },
];

export function AdminDashboard({ username }) {
  const [route, navigate, goBack] = useRoute("home");

  const [sunshineAction, setSunshineAction] = useState(null);
  const [maintenanceAction, setMaintenanceAction] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [showAllRecoveryEvents, setShowAllRecoveryEvents] = useState(false);
  const [showTailscaleRecoveryDetails, setShowTailscaleRecoveryDetails] = useState(false);
  const [showTailscaleFailureDetails, setShowTailscaleFailureDetails] = useState(false);

  const {
    hostStatus,
    hostMetrics,
    tailscaleStatus,
    streamStatus,
    hostLoading,
    hostError,
    sessionHealth,
    recoveryEvents,
    recoveryEventsLoading,
    recoveryStats,
    streamHistory,
    streamHistoryLoading,
    games,
    lastUpdated,
    refreshHostData,
    loadGames,
    loadSessionHealth,
  } = useDashboardData();

  const {
    wsEvents,
    connected,
    sessions,
    activeSessions,
    finishedSessions,
    loading,
    refresh,
    activeAlerts,
    historyRefreshKey,
  } = useSessionShell({ hostStatus, hostMetrics, onTerminalEvent: loadSessionHealth });

  const handleSunshineStart = async () => {
    try {
      setSunshineAction("starting");
      await startSunshine();
      await refreshHostData();
    } catch (error) {
      console.error(error);
    } finally {
      setSunshineAction(null);
    }
  };

  const handleSunshineRestart = async () => {
    try {
      setSunshineAction("restarting");
      await restartSunshine();
      await refreshHostData();
    } catch (error) {
      console.error(error);
    } finally {
      setSunshineAction(null);
    }
  };

  const handleMaintenanceToggle = async () => {
    if (maintenanceAction) return;
    try {
      setMaintenanceAction(true);
      const enabling = !hostStatus.maintenance_mode;
      if (enabling) {
        const result = await enableMaintenance();
        if (!result.success) {
          alert("Cannot enable maintenance while sessions are active.");
          return;
        }
      } else {
        await disableMaintenance();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setMaintenanceAction(false);
      refreshHostData();
    }
  };

  useEffect(() => {
    if (sunshineAction === "starting" && hostStatus?.sunshine_running) {
      setSunshineAction(null);
    }
  }, [sunshineAction, hostStatus]);

  const handleForceUnlock = useCallback(async () => {
    if (unlocking) return;
    if (!window.confirm("Force unlock session lock? Use only if stuck.")) return;
    try {
      setUnlocking(true);
      const result = await forceUnlockSession();
      await refresh();
      await loadSessionHealth();
      alert(result.message || (result.unlocked ? "Session lock forcefully released." : "Session lock was not released."));
    } catch (err) {
      alert(err.message || "Failed to force unlock session.");
    } finally {
      setUnlocking(false);
    }
  }, [unlocking, refresh, loadSessionHealth]);

  const handleRevalidate = useCallback(async () => {
    if (revalidating) return;
    try {
      setRevalidating(true);
      await revalidateHost();
      await refreshHostData();
    } catch (error) {
      alert(error.message);
    } finally {
      setRevalidating(false);
    }
  }, [revalidating, refreshHostData]);

  const goHome = () => navigate("home");

  // Pages the user has actually visited this session. A page is mounted
  // the first time its route becomes active and then stays mounted (just
  // hidden via CSS) for the rest of the session — that's what lets
  // unsaved form input (SettingsPanel, GameManager, UserPanel, etc.)
  // survive navigating away and back, instead of being wiped on unmount.
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
    monitor: (
      <HostMonitorPage
        hostStatus={hostStatus}
        hostMetrics={hostMetrics}
        hostLoading={hostLoading}
        hostError={hostError}
        sunshineAction={sunshineAction}
        onStartSunshine={handleSunshineStart}
        onRestartSunshine={handleSunshineRestart}
        handleMaintenanceToggle={handleMaintenanceToggle}
        maintenanceAction={maintenanceAction}
        sessionHealth={sessionHealth}
        handleRevalidate={handleRevalidate}
        revalidating={revalidating}
        tailscaleStatus={tailscaleStatus}
        streamStatus={streamStatus}
        unlocking={unlocking}
        onForceUnlock={handleForceUnlock}
        onBack={goBack}
      />
    ),
    recovery: (
      <RecoveryPage
        recoveryStats={recoveryStats}
        recoveryEvents={recoveryEvents}
        recoveryEventsLoading={recoveryEventsLoading}
        showTailscaleRecoveryDetails={showTailscaleRecoveryDetails}
        setShowTailscaleRecoveryDetails={setShowTailscaleRecoveryDetails}
        showTailscaleFailureDetails={showTailscaleFailureDetails}
        setShowTailscaleFailureDetails={setShowTailscaleFailureDetails}
        showAllRecoveryEvents={showAllRecoveryEvents}
        setShowAllRecoveryEvents={setShowAllRecoveryEvents}
        onBack={goBack}
      />
    ),
    streams: <SunshinePage streamHistory={streamHistory} streamHistoryLoading={streamHistoryLoading} onBack={goBack} />,
    "game-manager": <GameManagerPage games={games} loadGames={loadGames} onBack={goBack} />,
    users: <UserManagementPage onBack={goBack} />,
    analytics: <AnalyticsPage refreshKey={historyRefreshKey} onBack={goBack} />,
    history: <SessionHistoryPage refreshKey={historyRefreshKey} onBack={goBack} />,
    logs: <LogsPage onBack={goBack} />,
    settings: <SettingsPage onBack={goBack} onNavigate={navigate} />,
    "change-password": <ChangePasswordPage onBack={goBack} />,
  };

  const activeKey = pages[route] ? route : "home";

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeRoute={route === "change-password" ? "settings" : route}
      onNavigate={navigate}
      connected={connected}
      lastUpdated={lastUpdated}
      username={username}
      role="admin"
      onLogout={logout}
      onLogoClick={goHome}
    >
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
