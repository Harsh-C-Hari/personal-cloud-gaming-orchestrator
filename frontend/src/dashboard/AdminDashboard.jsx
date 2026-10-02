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
  Home as HomeIcon,
  Server,
  RefreshCw,
  Play,
  Gamepad2,
  UserCog,
  BarChart3,
  History,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData.js";
import { forceUnlockSession, startSunshine, restartSunshine, enableMaintenance, disableMaintenance, revalidateHost } from "../api/client.js";
import { useSessionShell } from "./useSessionShell.js";
import { useRoute } from "./hooks/useRoute.js";
import { DashboardLayout } from "./layout/DashboardLayout.jsx";
import { logout } from "./utils/logout.js";
import { useToast } from "../components/ui/Toast.jsx";
import { useConfirm } from "../components/ui/ConfirmDialog.jsx";

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
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

const NAV_ITEMS = [
  { route: "home", icon: <HomeIcon size={15} strokeWidth={2} />, label: "Home" },
  { route: "monitor", icon: <Server size={15} strokeWidth={2} />, label: "Host Monitor" },
  { route: "recovery", icon: <RefreshCw size={15} strokeWidth={2} />, label: "Recovery" },
  { route: "streams", icon: <Play size={15} strokeWidth={2} />, label: "Sunshine" },
  { route: "game-manager", icon: <Gamepad2 size={15} strokeWidth={2} />, label: "Game Manager" },
  { route: "users", icon: <UserCog size={15} strokeWidth={2} />, label: "User Management" },
  { route: "analytics", icon: <BarChart3 size={15} strokeWidth={2} />, label: "Analytics" },
  { route: "history", icon: <History size={15} strokeWidth={2} />, label: "Session History" },
  { route: "logs", icon: <ClipboardList size={15} strokeWidth={2} />, label: "Logs" },
  { route: "settings", icon: <Settings size={15} strokeWidth={2} />, label: "Settings" },
];

const HOME_NAV_CARDS = [
  { route: "game-manager", icon: <Gamepad2 size={20} strokeWidth={1.75} />, label: "Games", description: "Manage Games" },
  { route: "monitor", icon: <Server size={20} strokeWidth={1.75} />, label: "Host Monitor", description: "Live host status" },
  { route: "recovery", icon: <RefreshCw size={20} strokeWidth={1.75} />, label: "Recovery", description: "Recovery stats & events" },
  { route: "streams", icon: <Play size={20} strokeWidth={1.75} />, label: "Sunshine", description: "Client pairing & stream history" },
  { route: "analytics", icon: <BarChart3 size={20} strokeWidth={1.75} />, label: "Analytics", description: "Usage trends" },
  { route: "history", icon: <History size={20} strokeWidth={1.75} />, label: "History", description: "Past sessions" },
  { route: "logs", icon: <ClipboardList size={20} strokeWidth={1.75} />, label: "Logs", description: "Activity log" },
  { route: "users", icon: <UserCog size={20} strokeWidth={1.75} />, label: "Users", description: "User management" },
  { route: "settings", icon: <Settings size={20} strokeWidth={1.75} />, label: "Settings", description: "Password, config, about" },
];

export function AdminDashboard({ username }) {
  const toast = useToast();
  const confirm = useConfirm();
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
    gamesLoading,
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
          toast.warning("Cannot enable maintenance while sessions are active.");
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
    if (!(await confirm("Force unlock session lock? Use only if stuck.", { danger: true, confirmLabel: "Unlock" }))) return;
    try {
      setUnlocking(true);
      const result = await forceUnlockSession();
      await refresh();
      await loadSessionHealth();
      const message = result.message || (result.unlocked ? "Session lock forcefully released." : "Session lock was not released.");
      if (result.unlocked) {
        toast.success(message);
      } else {
        toast.warning(message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to force unlock session.");
    } finally {
      setUnlocking(false);
    }
  }, [unlocking, refresh, loadSessionHealth, confirm, toast]);

  const handleRevalidate = useCallback(async () => {
    if (revalidating) return;
    try {
      setRevalidating(true);
      await revalidateHost();
      await refreshHostData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRevalidating(false);
    }
  }, [revalidating, refreshHostData, toast]);

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
    streams: (
      <SunshinePage
        streamHistory={streamHistory}
        streamHistoryLoading={streamHistoryLoading}
        hostStatus={hostStatus}
        streamStatus={streamStatus}
        onBack={goBack}
      />
    ),
    "game-manager": (
      <GameManagerPage
        games={games}
        gamesLoading={gamesLoading}
        loadGames={loadGames}
        onBack={goBack}
      />
    ),
    users: <UserManagementPage onBack={goBack} />,
    analytics: <AnalyticsPage refreshKey={historyRefreshKey} onBack={goBack} />,
    history: <SessionHistoryPage refreshKey={historyRefreshKey} onBack={goBack} />,
    logs: <LogsPage onBack={goBack} />,
    settings: <SettingsPage onBack={goBack} onNavigate={navigate} />,
    "change-password": <ChangePasswordPage onBack={goBack} />,
  };

  const isKnownRoute = Object.prototype.hasOwnProperty.call(pages, route);
  const activeKey = isKnownRoute ? route : null;

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      activeRoute={isKnownRoute ? (route === "change-password" ? "settings" : route) : null}
      onNavigate={navigate}
      connected={connected}
      lastUpdated={lastUpdated}
      username={username}
      role="admin"
      onLogout={logout}
      onLogoClick={goHome}
    >
      {!isKnownRoute && (
        <div className="pcgo-page-enter">
          <NotFoundPage path={route} onGoHome={goHome} />
        </div>
      )}
      {Object.entries(pages).map(([key, element]) => {
        if (!visitedRoutes.has(key) && key !== activeKey) return null;
        // className (not just the display style) is keyed off activeKey so
        // that becoming the active route is always a genuine "add the
        // .pcgo-page-enter class" DOM mutation - including on a *return*
        // visit, where the class was removed when this route was last left.
        // That fresh add/remove is what makes the browser (re)start the
        // cgo-fade-up animation each real navigation, without remounting
        // {element} itself: unrelated re-renders where activeKey doesn't
        // change produce the same className string, so React never touches
        // the DOM's class attribute and no replay happens.
        return (
          <div
            key={key}
            className={key === activeKey ? "pcgo-page-enter" : undefined}
            style={{ display: key === activeKey ? "block" : "none" }}
          >
            {element}
          </div>
        );
      })}
    </DashboardLayout>
  );
}
