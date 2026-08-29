/**
 * components/SunshineStreamHistory.jsx
 *
 * Same props (streams, loading), same formatDuration() helper, and same
 * "show all / show less" behavior as before — only the presentation was
 * reworked to match the visual language already used by RecoveryStats /
 * SessionHistory / SessionAnalytics:
 *   - Icon-badged section header.
 *   - A "Total Streams" count pill instead of a plain heading.
 *   - Each stream entry is now a bordered, left-accented card with
 *     icon-labeled rows and a pill-style duration badge.
 *
 * P5-T07 token pass (D-008/D-009):
 *
 * Backgrounds: all 8 `colors.bg*` references in this file (5x bgCard,
 * 3x bgInset) have been swapped for their `surface.l*` alias per D-009 —
 * same CSS custom property, same value, zero visual change. `colors` is
 * still imported/used throughout for non-background tokens (ink/border/
 * brand/status colors) and is unaffected.
 *
 * Typography: checked every inline `fontSize`/`font:`/`fontFamily`/
 * `fontWeight` group below against `typeScale` — none cleanly matched
 * at matching size+weight+family+letter-spacing, same outcome as
 * Recovery (P5-T05) and Sunshine Client Manager (P5-T06). All left as
 * documented literals:
 * - the section `<h2>` (15px/700/display): closest candidate to
 *   `typeScale.subheading` (17px/600/-0.01em/display) — family
 *   matches, weight (700 vs 600) and size (15px vs 17px) don't. Same
 *   values as `title` in RecoveryStats.jsx/RecoveryEvents.jsx/
 *   SessionHistory.jsx (see "shared visual language" note below).
 * - `countPill` (9px/700/0.06em/mono): closest to `typeScale.meta`
 *   (10px/700/0.12em/uppercase/mono) — weight/family match, size and
 *   letter-spacing don't, no `textTransform` set (the "STREAMS" text
 *   is a literal uppercase string, not transformed).
 * - the duration-pill container (9px/700/0.08em/mono/uppercase):
 *   weight/family/`textTransform` match `typeScale.meta` — size (9px
 *   vs 10px) and letter-spacing (0.08em vs 0.12em) don't. Closest
 *   near-miss in the file.
 * - the show-all/show-less button (10px/mono/0.08em, no explicit
 *   weight → browser default 400): size and family match
 *   `typeScale.meta`, but weight (400 vs 700), letter-spacing (0.08em
 *   vs 0.12em), and `textTransform` don't.
 * - `panelDescription` (9.5px/inkFaint/mono, no letter-spacing): no
 *   `typeScale` step sits here — left literal. Byte-identical values
 *   to `panelDescription` in RecoveryStats.jsx/RecoveryEvents.jsx.
 * - `loadingHeader` (10.5px/mono), `emptyBox` (11px/1.5/mono), the
 *   app-name row (12.5px/700, no explicit font family), the
 *   started-at row (11px, no explicit weight/family), and the
 *   resolution row (9.5px/mono): none match a `typeScale` step at
 *   matching size+weight+family — left literal.
 *
 * Shared-visual-language claim (this file's own header comment above,
 * verified rather than assumed per this task's instructions): checked
 * against RecoveryStats.jsx/RecoveryEvents.jsx/SessionHistory.jsx/
 * SessionAnalytics.jsx directly, not just the comment text.
 * - `panelDescription` is byte-identical (marginTop/color/fontSize/
 *   lineHeight/fontFamily) to RecoveryStats.jsx's and
 *   RecoveryEvents.jsx's `panelDescription` — a real, literal match.
 * - The section `<h2>`'s inline style (margin 0 / 15px / 700 / ink /
 *   display) is byte-identical in value to the extracted `title`
 *   const shared by RecoveryStats.jsx/RecoveryEvents.jsx/
 *   SessionHistory.jsx/SessionAnalytics.jsx — this file just keeps it
 *   inline rather than pulling it into a named const, since it's used
 *   once.
 * - The header icon badge is close but NOT byte-identical: this file's
 *   border is `1.5px solid color-mix(in srgb, ${colors.brand} 30%,
 *   transparent)`, while RecoveryStats.jsx/RecoveryEvents.jsx/
 *   SessionHistory.jsx/SessionAnalytics.jsx all use a solid
 *   `1.5px solid ${colors.brand}` border with no color-mix. Everything
 *   else (28px/28px, radius.sm, flex-center, brandDim background)
 *   matches. Left as-is — this task is a token-only pass, not a
 *   cross-file cosmetic reconciliation, and the difference predates
 *   this task.
 * - The outer section container (padding 16px / colors.bgCard→
 *   surface.l3 / radius.lg / colors.border) is NOT the same as the
 *   `box` const shared by the other three files (padding 20px) — a
 *   real, pre-existing difference, not introduced here.
 * - **Discrepancy found, not assumed:** this task's own prompt lists
 *   SessionAnalytics.jsx as "already elevated" alongside
 *   RecoveryStats.jsx/SessionHistory.jsx. A fresh check found this is
 *   false — SessionAnalytics.jsx still has 5 real `colors.bg*`
 *   references (`bgCard`, `bgElevated`×2, `bgInset`×2) and imports no
 *   `surface` token at all. It has not been through a P5 token pass;
 *   per PLAN.md's page order, Analytics is the *last* page still
 *   queued, not an already-done reference. Its `title`/`headerIcon`/
 *   `box` objects above were compared on their literal values only
 *   (which do match), not as evidence the file is elevated overall.
 */

import { useState } from "react";
import {
  Satellite,
  Monitor,
  Clock,
  Film,
} from "lucide-react";
import { colors, fonts, radius, surface } from "../dashboard/theme.js";

function StreamHistoryLoadingState() {
    return (
        <div className="pcgo-sunshine-history-loading" role="status" aria-live="polite">
            <div style={loadingHeader}>
                <span style={loadingDot} />
                Loading stream history
            </div>
            {["Latest stream", "Previous stream", "Stream details"].map((label) => (
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

const panelDescription = {
    marginTop: "3px",
    color: colors.inkFaint,
    fontSize: "9.5px",
    lineHeight: 1.4,
    fontFamily: fonts.mono,
};

const countPill = {
    flexShrink: 0,
    padding: "3px 8px",
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: `${radius.sm}px`,
    color: colors.inkFaint,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.06em",
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
    // P6-T08 motion audit: this string is character-for-character identical
    // to StatusBadge.jsx's already-documented `badge-pulse 1.6s` (and the
    // same non-convertible category as LoadingState.jsx's pulse and
    // RecoveryEvents.jsx's `badge-pulse 1.6s`) — an @keyframes name, not a
    // transition timing string, so there's no motion token to alias to
    // regardless of the 1.6s duration. The recurrence across files is
    // expected, not a sign of a prior audit error; this file still gets its
    // own comment per the project's per-file audit convention. Left as the
    // original literal.
    animation: "ssh-pulse 1.6s ease-in-out infinite",
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
    width: "92px",
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

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "7px",
    padding: "30px 20px",
    border: `1px dashed ${colors.borderSubtle}`,
    borderRadius: `${radius.md}px`,
    color: colors.inkFaint,
    fontSize: "11px",
    lineHeight: 1.5,
    textAlign: "center",
    fontFamily: fonts.mono,
};

export function SunshineStreamHistory({
    streams,
    loading,
}) {
    const [showAllStreams, setShowAllStreams] = useState(false);

    function formatDuration(seconds) {
        if (seconds == null) return "--";

        const total = Math.floor(seconds);

        const hours = Math.floor(total / 3600);
        const mins = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }

        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }

        return `${secs}s`;
    }

    const availableStreams = streams ?? [];
    const displayedStreams =
        showAllStreams
            ? availableStreams
            : availableStreams.slice(0, 3);

    return (
        <section
            className="pcgo-sunshine-stream-history"
            aria-labelledby="sunshine-stream-history-title"
            style={{
                padding: "16px",
                border: `1px solid ${colors.border}`,
                borderRadius: `${radius.lg}px`,
                background: surface.l3,
            }}
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                <div
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: `${radius.sm}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: colors.brandDim,
                        border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
                        color: colors.brand,
                    }}
                >
                    <Satellite size={13} strokeWidth={2} />
                </div>
                    <div>
                        <h2 id="sunshine-stream-history-title" style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: colors.ink, fontFamily: fonts.display }}>
                            Stream History
                        </h2>
                        <div style={panelDescription}>Completed Sunshine streaming sessions</div>
                    </div>

                    {!!availableStreams.length && (
                        <span style={countPill}>{availableStreams.length} STREAMS</span>
                    )}
            </div>

            {loading
              ? <StreamHistoryLoadingState />
              : (
                <div>
                {!availableStreams.length
                    ? (
                        <div style={emptyBox}>
                            <Clock size={17} strokeWidth={1.7} style={{ color: colors.inkFaint }} />
                            <strong>No stream history available</strong>
                            <span>Completed Sunshine sessions will appear here when history is available.</span>
                        </div>
                    )
                    : (

                        <div style={{ display: "grid", gap: "10px" }}>
                            {displayedStreams.map((stream, index) => (
                                <article
                                    key={`${stream.started_at || "stream"}-${index}`}
                                    style={{
                                        borderRadius: `${radius.md}px`,
                                        background: surface.l1,
                                        border: `1px solid ${colors.borderSubtle}`,
                                        borderLeft: `2px solid ${colors.brand}`,
                                        padding: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        rowGap: "8px",
                                        gap: "10px",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "7px",
                                                color: colors.ink,
                                                fontSize: "12.5px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Film size={11} strokeWidth={2} style={{ color: colors.brand, flexShrink: 0 }} />
                                            {
                                                (
                                                    stream.app_name ||
                                                    "Unknown"
                                                ).toUpperCase()
                                            }
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: colors.inkDim,
                                                fontSize: "11px",
                                                marginTop: "6px",
                                            }}
                                        >
                                            <Clock size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                                            {
                                                stream.started_at
                                                    ? new Date(
                                                        stream.started_at * 1000
                                                    ).toLocaleString()
                                                    : "--"
                                            }
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: colors.inkFaint,
                                                fontSize: "9.5px",
                                                marginTop: "6px",
                                                fontFamily: fonts.mono,
                                            }}
                                        >
                                            <Monitor size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                                            {
                                                stream.width && stream.height
                                                    ? `${stream.width}x${stream.height}`
                                                    : "--"
                                            }
                                            {" · "}
                                            {stream.fps || "--"} FPS
                                            {" · "}
                                            {
                                                stream.hdr
                                                    ? "HDR"
                                                    : "SDR"
                                            }
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            flexShrink: 0,
                                            padding: "6px 12px",
                                            borderRadius: `${radius.sm}px`,
                                            background: colors.brandDim,
                                            border: `1.5px solid color-mix(in srgb, ${colors.brand} 35%, transparent)`,
                                            color: colors.brand,
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            fontFamily: fonts.mono,
                                            textTransform: "uppercase",
                                            textAlign: "center",
                                            minWidth: "90px",
                                        }}
                                    >
                                        <div style={{ fontSize: "11px" }}>
                                            {
                                                formatDuration(
                                                    stream.duration_seconds
                                                )
                                            }
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "3px",
                                                fontSize: "8px",
                                                opacity: 0.85,
                                            }}
                                        >
                                            STREAM
                                        </div>
                                    </div>
                                </article>
                            ))}
                                    {
                                        availableStreams.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                                setShowAllStreams(
                                                !showAllStreams
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "2px",
                                            border: `1px solid ${colors.border}`,
                                            background: surface.l1,
                                            color: colors.inkDim,
                                            borderRadius: `${radius.md}px`,
                                            padding: "8px 10px",
                                            fontSize: "10px",
                                            fontFamily: fonts.mono,
                                            letterSpacing: "0.08em",
                                            cursor: "pointer",
                                            // P6-T08 motion audit: 150ms does not exactly match any
                                            // motion step (fast: 100ms, base: 160ms, cardIn: 220ms,
                                            // pill: 180ms). Left as the original literal.
                                            transition: "background 150ms ease, color 150ms ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = colors.brand;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = colors.inkDim;
                                        }}
                                    >
                                        {
                                            showAllStreams
                                                ? "SHOW LESS"
                                                : `SHOW ALL (${availableStreams.length})`
                                        }
                                    </button>
                                )
                            }
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes ssh-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </section>
    );
}
