/**
 * dashboard/pages/Home.jsx
 *
 * Primary landing page (GeForce NOW / Steam style):
 *   1. Active alerts
 *   2. Current active session (large card) — OR — Start Session form
 *   3. Live activity panel (stats + recent events)
 *   4. Quick navigation grid to every other page
 *
 * All session/host data and handlers are owned by AdminDashboard /
 * UserDashboard and simply passed in as props — this page has no data
 * fetching or business logic of its own.
 */

import { SessionCard } from "../../components/SessionCard.jsx";
import { StartSessionForm } from "../../components/StartSessionForm.jsx";
import { ActiveAlerts } from "../components/ActiveAlerts.jsx";
import { SessionSidebar } from "../components/SessionSidebar.jsx";
import { NavigationCard } from "../components/NavigationCard.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { colors, fonts } from "../theme.js";

export function Home({
  games,
  hostStatus,
  sessions,
  activeSessions,
  finishedSessions,
  loading,
  refresh,
  activeAlerts,
  connected,
  wsEvents,
  navCards,
  onNavigate,
}) {
  const hasActiveSession = activeSessions.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <ActiveAlerts alerts={activeAlerts} />

      <section>
        <div
          style={{
            fontSize: "9.5px",
            color: colors.textMuted,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: fonts.mono,
            marginBottom: "14px",
          }}
        >
          {hasActiveSession ? "Current Session" : "Start a New Session"}
        </div>

        {loading ? (
          <LoadingState />
        ) : hasActiveSession ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {activeSessions.map((s) => (
              <SessionCard key={s.session_id} session={s} onRefresh={refresh} />
            ))}
          </div>
        ) : (
          <StartSessionForm games={games} onLaunched={refresh} activeSessions={sessions} hostStatus={hostStatus} />
        )}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        <SessionSidebar
          activeCount={activeSessions.length}
          totalCount={sessions.length}
          connected={connected}
          events={wsEvents}
        />
      </section>

      <section>
        <div
          style={{
            fontSize: "9.5px",
            color: colors.textMuted,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: fonts.mono,
            marginBottom: "14px",
          }}
        >
          Quick Navigation
        </div>

        {navCards.length === 0 ? (
          <EmptyState label="No pages available" />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "12px",
            }}
          >
            {navCards.map((card) => (
              <NavigationCard
                key={card.route}
                icon={card.icon}
                label={card.label}
                description={card.description}
                badge={card.route === "history" ? finishedSessions.length : undefined}
                onClick={() => onNavigate(card.route)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
