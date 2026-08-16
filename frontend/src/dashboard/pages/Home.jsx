/**
 * dashboard/pages/Home.jsx
 *
 * Primary landing page: a focused launch console, compact operational rail,
 * and command index. All data and handlers remain owned by AdminDashboard /
 * UserDashboard and are passed through unchanged.
 */

import { SessionCard } from "../../components/SessionCard.jsx";
import { StartSessionForm } from "../../components/StartSessionForm.jsx";
import { ActiveAlerts } from "../components/ActiveAlerts.jsx";
import { SessionSidebar } from "../components/SessionSidebar.jsx";
import { NavigationCard } from "../components/NavigationCard.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { colors, fonts } from "../theme.js";

const EYEBROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
  marginBottom: "12px",
};

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
    <div className="pcgo-feature-page pcgo-home-page">
      <ActiveAlerts alerts={activeAlerts} />

      <div className="pcgo-home-hero">
        <main className="pcgo-home-primary">
          <div style={EYEBROW_STYLE}>
            <span className="pcgo-home-signal" aria-hidden="true" />
            {hasActiveSession ? "Current Session" : "Start a New Session"}
          </div>

          {loading ? (
            <LoadingState />
          ) : hasActiveSession ? (
            <div className="pcgo-active-session-stack">
              {activeSessions.map((s) => (
                <SessionCard key={s.session_id} session={s} onRefresh={refresh} />
              ))}
            </div>
          ) : (
            <StartSessionForm games={games} onLaunched={refresh} activeSessions={sessions} hostStatus={hostStatus} />
          )}
        </main>

        <aside className="pcgo-home-rail" aria-label="Operational activity">
          <SessionSidebar
            activeCount={activeSessions.length}
            totalCount={sessions.length}
            connected={connected}
            events={wsEvents}
          />
        </aside>
      </div>

      <section className="pcgo-command-section" aria-labelledby="home-command-index">
        <div className="pcgo-command-heading">
          <div>
            <div className="pcgo-command-kicker">Command index</div>
            <h2 id="home-command-index">Move through the control plane</h2>
          </div>
          <span className="pcgo-command-meta">{navCards.length} destinations</span>
        </div>

        {navCards.length === 0 ? (
          <EmptyState label="No pages available" />
        ) : (
          <div className="pcgo-command-index">
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
