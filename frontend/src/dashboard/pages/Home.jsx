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
import { colors, typeScale } from "../theme.js";

/**
 * P3-T01: previously an ad hoc inline object (fontSize 9.5px, mono, 700,
 * .15em, uppercase) that predated the token system. That 9.5px was never a
 * deliberate design choice next to the rest of the app's ~30+ occurrences
 * of the same uppercase-mono-label pattern at 10px (D-009's `typeScale.meta`)
 * — it was drift, not intent. Routed through `typeScale.meta` verbatim
 * (10px/700/.12em/uppercase/mono) rather than carried forward.
 */
const eyebrowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "10px",
  color: colors.inkFaint,
  ...typeScale.meta,
};

/**
 * P3-T01: Home's new flagship headline — the "real display moment" called
 * for by D-008/DESIGN REQUIREMENTS, giving the page an actual editorial
 * moment to match Login's ambition (it previously jumped straight from the
 * eyebrow into the launch form with no headline at all).
 *
 * Deliberately built from `typeScale.heading` (28px/650/-0.03em) rather
 * than `typeScale.hero` (clamp 42-82px): Home is an authenticated,
 * frequently revisited operational console, not a one-time landing gate
 * like Login — a full hero-scale headline would crowd the actual task
 * (starting/monitoring a session) every single visit. `heading` is also
 * exactly the size PageHeader.jsx already uses for every other page's
 * `<h1>`, so this keeps Home's headline consistent with the rest of the
 * app's heading hierarchy rather than inventing a one-off size.
 */
const headlineStyle = {
  margin: "0",
  maxWidth: "560px",
  color: colors.ink,
  ...typeScale.heading,
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
          <div className="pcgo-home-intro">
            <div style={eyebrowStyle}>
              <span className="pcgo-home-signal" aria-hidden="true" />
              {hasActiveSession ? "Current Session" : "Start a New Session"}
            </div>
            <h1 style={headlineStyle}>
              {hasActiveSession ? "Your session is live." : "Ready to launch."}
            </h1>
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
