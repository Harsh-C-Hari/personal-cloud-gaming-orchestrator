/**
 * components/RecoveryEvents.jsx
 *
 * Same props (recoveryEvents, recoveryEventsLoading, showAllRecoveryEvents
 * + its setter) and same slice-to-3/show-all logic — only the presentation
 * was reworked to the "Chalkboard Neo-Brutalist" system: flat tokens from
 * theme.js instead of a local cyan-glow palette, lucide-react icons instead
 * of react-icons/fa, and flat pill styling (no `color+opacity-hex` glow
 * borders) matching StatusBadge/HostStatusPanel's Badge.
 *
 * P5-T05 token pass (D-008/D-009):
 *
 * Backgrounds: all 8 `colors.bg*` references in this file (bgCard x5
 * counting the loading skeleton, bgInset x2, one bgCardHover/bgInset
 * pair on the newest-event highlight) have been swapped for their
 * `surface.l*` alias per D-009 — same CSS custom property, same value,
 * zero visual change. `colors` is still imported/used throughout for
 * non-background tokens (ink/border/brand/status colors) and is
 * unaffected.
 *
 * Typography: same dense "operational readout" character as its
 * sibling `RecoveryStats.jsx` — bespoke sizes (9px-11px) tuned for a
 * compact event list, not the editorial `typeScale` steps. Checked
 * every inline font group below against `typeScale` and left all of
 * them as documented literals, per D-005/D-009:
 * - `title` (15px/700/display): closest candidate to
 *   `typeScale.subheading` (17px/600/-0.01em/display) — font-family
 *   matches, weight (700 vs 600) and size (15px vs 17px) don't — left
 *   literal. Shared verbatim with `RecoveryStats.jsx`'s `title`.
 * - `countPill` (10px/700/mono, no letter-spacing/uppercase — its text
 *   content, e.g. "3 EVENTS", is a static pre-uppercased string):
 *   size+weight+family all match `typeScale.meta` (10px/700/0.12em/
 *   uppercase/mono), but the missing letter-spacing/`textTransform`
 *   don't — left literal, same category of near-miss as Session
 *   History's `showAllButton` (P5-T04).
 * - the event-badge inline group (9px/700/0.08em/uppercase/mono, line
 *   ~146) and `showAllButton` (9px/700/0.08em/mono): both miss
 *   `typeScale.meta` on size and letter-spacing — left literal.
 *   `showAllButton` is shared verbatim with `RecoveryStats.jsx`'s
 *   `detailToggle`.
 * - `panelDescription` (9.5px/400/mono): shared verbatim with
 *   `RecoveryStats.jsx`'s `panelDescription` — no matching step, left
 *   literal.
 * - `loadingHeader` (10.5px/mono), `emptyBox` (11px/mono), the
 *   event-service/event-name/meta-line/timestamp inline groups (11px,
 *   10.5px, and 9px/mono respectively): none match a `typeScale` step
 *   at matching size+weight+family — left literal.
 * All of the above keep their exact pre-existing literal values;
 * nothing here changes visually. See `RecoveryStats.jsx` for the
 * sibling component's matching audit and the shared-object list.
 */

import { History, CheckCircle2, XCircle, RefreshCw, Info } from "lucide-react";
import { colors, fonts, radius, surface } from "../dashboard/theme.js";

function eventVisual(eventType) {
  switch (eventType) {
    case "restart_success":
      return { color: colors.success, icon: <CheckCircle2 size={12} strokeWidth={2} /> };
    case "recovered":
      return { color: colors.success, icon: <CheckCircle2 size={12} strokeWidth={2} /> };
    case "restart_failed":
    case "failure_detected":
    case "service_stopped":
    case "ipn_missing":
    case "nostate":
      return { color: colors.danger, icon: <XCircle size={12} strokeWidth={2} /> };
    case "restart_attempt":
      return { color: colors.warning, icon: <RefreshCw size={12} strokeWidth={2} /> };
    default:
      return { color: colors.accentBlue, icon: <Info size={12} strokeWidth={2} /> };
  }
}

function formatEventName(eventType) {
  return String(eventType || "unknown").replaceAll("_", " ");
}

function eventService(event) {
  return String(event?.service || "host recovery").toUpperCase();
}

function formatEventTime(time) {
  if (!time) return "Time unavailable";
  return new Date(time * 1000).toLocaleString();
}

function RecoveryEventsLoadingState() {
  return (
    <div className="pcgo-recovery-events-loading" role="status" aria-live="polite">
      <div style={loadingHeader}>
        <span style={loadingDot} />
        Loading recovery activity
      </div>
      {["Latest event", "Previous event", "Event details"].map((label) => (
        <div key={label} style={loadingRow} aria-hidden="true">
          <span style={loadingIcon} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={loadingLineWide} />
            <span style={loadingLineShort} />
          </div>
          <span style={loadingTag} />
        </div>
      ))}
    </div>
  );
}

export function RecoveryEvents({
  recoveryEvents,
  recoveryEventsLoading,
  showAllRecoveryEvents,
  setShowAllRecoveryEvents,
}) {
  const events = recoveryEvents ?? [];
  const displayedRecoveryEvents = showAllRecoveryEvents ? events : events.slice(0, 3);
  const latestEvent = events[0];

  return (
    <section className="pcgo-recovery-events-panel" style={box} aria-labelledby="recovery-events-title">
      <div className="pcgo-recovery-panel-heading" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
          <div style={headerIcon}>
            <History size={13} strokeWidth={2} />
          </div>
          <div>
            <h2 id="recovery-events-title" style={title}>Recent Recovery Activity</h2>
            <div style={panelDescription}>Latest interventions and failure signals</div>
          </div>
        </div>
        {events.length > 0 && <span style={countPill}>{events.length} EVENTS</span>}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
        {latestEvent ? `Latest recovery event: ${eventService(latestEvent)} ${formatEventName(latestEvent.event)}` : ""}
      </div>

      {recoveryEventsLoading ? (
        <RecoveryEventsLoadingState />
      ) : events.length === 0 ? (
        <div style={emptyBox}>
          <Info size={15} strokeWidth={1.8} style={{ color: colors.inkFaint }} />
          <strong>No recovery events recorded</strong>
          <span>The event stream is clear. New recovery activity will appear here.</span>
        </div>
      ) : (
        <div>
          <ol className="pcgo-recovery-event-list" style={{ display: "flex", flexDirection: "column", gap: "8px", margin: 0, padding: 0, listStyle: "none" }}>
            {displayedRecoveryEvents.map((event, index) => {
              const { color, icon } = eventVisual(event.event);
              const eventName = formatEventName(event.event);

              return (
                <li key={`${event.time}-${event.event}-${index}`}>
                  <article
                    style={{
                      padding: "11px 12px",
                      borderRadius: `${radius.md}px`,
                      background: index === 0 ? surface.l4 : surface.l1,
                      border: `1px solid ${index === 0 ? colors.border : colors.borderSubtle}`,
                      borderLeft: `2px solid ${color}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      rowGap: "6px",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
                      <div style={{ color, flexShrink: 0, marginTop: "1px" }}>{icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: colors.ink, fontSize: "11px", fontWeight: 700, fontFamily: fonts.mono, overflowWrap: "anywhere" }}>
                          {eventService(event)}
                        </div>
                        <div style={{ color: colors.inkDim, fontSize: "10.5px", fontFamily: fonts.mono, marginTop: "1px", textTransform: "capitalize" }}>
                          {eventName}
                        </div>
                        {event.details?.failure_mode != null && event.event === "failure_detected" && <div style={metaLine}>Mode: {event.details.failure_mode}</div>}
                        {event.details?.state != null && event.event === "initial_state" && <div style={metaLine}>State: {event.details.state}</div>}
                        {event.details?.attempt != null && event.details?.attempt !== 0 && <div style={metaLine}>Attempt: {event.details.attempt}</div>}
                        <div style={{ color: colors.inkFaint, fontSize: "9px", marginTop: "4px", fontFamily: fonts.mono }}>
                          {formatEventTime(event.time)}
                        </div>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, padding: "3px 8px", borderRadius: `${radius.sm}px`, background: `${color}22`, border: `1.5px solid ${color}4d`, color, fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", fontFamily: fonts.mono, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {eventName}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          {events.length > 3 && (
            <button
              type="button"
              aria-expanded={showAllRecoveryEvents}
              onClick={() => setShowAllRecoveryEvents(!showAllRecoveryEvents)}
              style={showAllButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.ink;
                e.currentTarget.style.borderColor = colors.borderStrong;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.inkDim;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {showAllRecoveryEvents ? "SHOW LESS" : `SHOW ALL (${events.length})`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

const metaLine = {
  color: colors.inkFaint,
  fontSize: "9px",
  marginTop: "2px",
  fontFamily: fonts.mono,
};

const box = {
  padding: "20px",
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
  background: surface.l3,
};

const panelDescription = {
  marginTop: "3px",
  color: colors.inkFaint,
  fontSize: "9.5px",
  lineHeight: 1.4,
  fontFamily: fonts.mono,
};

const loadingHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  color: colors.inkDim,
  fontSize: "10.5px",
  fontFamily: fonts.mono,
};

const loadingDot = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: colors.brand,
  // P6-T07 motion audit: this string is character-for-character identical
  // to StatusBadge.jsx's already-documented `badge-pulse 1.6s` (and the
  // same non-convertible category as LoadingState.jsx's pulse) — an
  // @keyframes name, not a transition timing string, so there's no
  // motion token to alias to regardless of the 1.6s duration. The
  // recurrence across files is expected, not a sign of a prior audit
  // error; this file still gets its own comment per the project's
  // per-file audit convention. Left as the original literal.
  animation: "badge-pulse 1.6s ease-in-out infinite",
  flexShrink: 0,
};

const loadingRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "52px",
  padding: "10px 12px",
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  background: surface.l1,
};

const loadingIcon = {
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
  flexShrink: 0,
};

const loadingLineWide = {
  display: "block",
  width: "min(150px, 70%)",
  height: "8px",
  borderRadius: "2px",
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
};

const loadingLineShort = {
  display: "block",
  width: "90px",
  height: "7px",
  marginTop: "7px",
  borderRadius: "2px",
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
};

const loadingTag = {
  width: "54px",
  height: "16px",
  borderRadius: `${radius.sm}px`,
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
  flexShrink: 0,
};

const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const title = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: colors.ink,
  fontFamily: fonts.display,
};

const headerIcon = {
  width: "28px",
  height: "28px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1.5px solid ${colors.brand}`,
  color: colors.brand,
};

const countPill = {
  fontSize: "10px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
  fontWeight: 700,
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.sm}px`,
  padding: "1px 8px",
};

const emptyBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "7px",
  padding: "30px 20px",
  textAlign: "center",
  border: `1.5px dashed ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  color: colors.inkFaint,
  fontSize: "11px",
  lineHeight: 1.5,
  fontFamily: fonts.mono,
};

const showAllButton = {
  width: "100%",
  marginTop: "10px",
  border: `1px solid ${colors.border}`,
  background: surface.l2,
  color: colors.inkDim,
  borderRadius: `${radius.sm}px`,
  padding: "8px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  letterSpacing: "0.08em",
  fontWeight: 700,
  cursor: "pointer",
  // P6-T07 motion audit: 150ms does not exactly match any motion step
  // (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms). Left as the
  // original literal.
  transition: "color 150ms ease, border-color 150ms ease",
};
