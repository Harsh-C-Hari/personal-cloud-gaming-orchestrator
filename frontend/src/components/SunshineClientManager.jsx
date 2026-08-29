/**
 * components/SunshineClientManager.jsx
 *
 * Admin-only Sunshine client/pairing management, built to the same
 * architecture as UserPanel.jsx:
 *   - Self-contained: fetches its own client list, owns its own
 *     loading/error state, no data props required.
 *   - Same toast + useConfirm integration as UserPanel/GameManager for
 *     action feedback and destructive-action confirmation.
 *   - Same visual language (outerWrap/headerBar/cardSection/grid/card),
 *     now built from theme.js's flat Chalkboard Neo-Brutalist tokens
 *     instead of the old cyan-glow palette.
 *
 * `hostStatus` / `streamStatus` are the only props, and both are purely
 * read-only display — they're the same objects useDashboardData() already
 * polls centrally (via useDashboardData -> AdminDashboard -> SunshinePage),
 * passed down here instead of re-fetched, so this component never opens a
 * second poller against the same endpoints.
 *
 * Scope note: this component only calls the Sunshine *management* APIs
 * already exposed by host.py (clients / pair / unpair / unpair-all /
 * close-stream). It never touches, calls, or displays logic for
 * stream-started / stream-ended / transport-connected / transport-
 * disconnected — those four events are owned exclusively by
 * sunshine_stream_hook.py and host_agent/sunshine_transport_monitor.py
 * (enforced backend-side by api/internal_event_auth.py). The read-only
 * "current stream" line below is just displaying state those two already
 * published elsewhere (the same state SunshineStreamHistory/HostStatusPanel
 * already read) — not publishing anything itself.
 */

import {
    useEffect,
    useState,
} from "react";

import {
    Satellite,
    Monitor,
    RefreshCw,
    Unlink,
    Ban,
    Key,
    Plug,
    AlertTriangle,
    Power,
    Circle,
} from "lucide-react";

import {
    getSunshineClients,
    pairSunshineClient,
    unpairSunshineClient,
    unpairAllSunshineClients,
    closeSunshineStream,
} from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { colors, fonts, radius, surface } from "../dashboard/theme.js";

/**
 * P5-T06 token-elevation audit (typeScale/surface, per D-008/D-009):
 *
 * Backgrounds: all 10 `colors.bg*` references in this file are literal
 * elevation-slot backgrounds and were swapped for their `surface.l*`
 * alias per the established mapping (bgInset->l1, bgElevated->l2,
 * bgCard->l3) — same CSS custom properties, zero visual change.
 *
 * One exception, left un-swapped: `saveButton`'s `color: colors.bg`
 * (~line 906) is a *foreground* text-color use (light-on-dark text for
 * the "PAIR CLIENT" button, which sits on a `colors.ink` background),
 * not a background/elevation-slot use. D-009's `surface` alias system
 * is explicitly framed as an elevation ladder for backgrounds
 * ("L0 (deepest/page base)"..."L4 (highest)") — every existing
 * `surface.l*` consumer across P2-P5 so far has been a `background`
 * property. Re-labelling a foreground text color as an "elevation
 * level" would be semantically wrong even though the literal value is
 * shared, so this one is left as `colors.bg` rather than converted to
 * `surface.l0`.
 *
 * Typography: every `fontSize`/`font:`/`fontFamily`/`fontWeight` group
 * in this file (~18 distinct style objects, sizes ranging 9px-13.5px)
 * was checked against `typeScale`'s six steps for a genuine match
 * (matching fontSize + fontWeight + fontFamily, per the standard this
 * project has used since P5-T01/P2-T01) — **none matched.** Same
 * outcome as Recovery (P5-T05): this page's dense operational-console
 * character uses its own bespoke scale, not the editorial `typeScale`
 * steps. Closest near-misses, left as documented literals rather than
 * forced:
 *   - `saveButton` (11.5px/700/mono/0.12em) matches `typeScale.meta`'s
 *     weight, font family, AND letter-spacing exactly — only the size
 *     (11.5px vs. meta's 10px) and textTransform (this button's
 *     "PAIR CLIENT"/"PAIRING..." text is already literal uppercase in
 *     JSX, not CSS `text-transform: uppercase`) differ.
 *   - `FieldLabel`'s inline style and `sectionLabel` (9.5px/700/mono/
 *     uppercase, 0.13em and 0.15em letter-spacing respectively) are
 *     both close to `typeScale.meta` (10px/700/mono/uppercase/0.12em)
 *     but neither matches on size or letter-spacing.
 *   - `headerTitle` (13.5px/700/display) coincidentally shares
 *     `typeScale.body`'s exact font-size (13.5px) but diverges on both
 *     font-weight (700 vs. 500) and font-family (display vs. body/
 *     Inter) — a size-only coincidence, not a real match.
 *   - `closeStreamButton` and `deleteAllButton` are byte-identical to
 *     each other in their font properties (10.5px/mono/0.08em
 *     letter-spacing, both destructive-action buttons) — a genuine
 *     sibling-consistency pair, but neither matches any `typeScale`
 *     step.
 * All 18 groups are left as literal values, matching D-005's "refine,
 * don't flatten" instruction for pages with real existing character.
 */

export function SunshineClientManager({ hostStatus, streamStatus }) {

    const toast = useToast();
    const confirm = useConfirm();

    const [clients, setClients] = useState([]);
    const [clientsReachable, setClientsReachable] = useState(true);
    const [clientsError, setClientsError] = useState("");
    const [loading, setLoading] = useState(true);

    const [pin, setPin] = useState("");
    const [pairing, setPairing] = useState(false);

    const [unpairingUuid, setUnpairingUuid] = useState(null);
    const [unpairingAll, setUnpairingAll] = useState(false);
    const [closingStream, setClosingStream] = useState(false);

    async function loadClients() {
        try {
            setLoading(true);

            const data = await getSunshineClients();

            setClients(data.clients || []);
            setClientsReachable(!!data.reachable);
            setClientsError(data.error || "");

        } catch (err) {
            setClients([]);
            setClientsReachable(false);
            setClientsError(err.message || "Failed to load Sunshine clients.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadClients();
    }, []);

    async function handlePair() {
        if (pairing || !pin.trim()) return;

        try {
            setPairing(true);

            const result = await pairSunshineClient(pin.trim());

            if (result.success) {
                toast.success("Client paired successfully.");
                setPin("");
                await loadClients();
            } else {
                toast.error(result.message || "Pairing failed. Check the PIN and try again.");
            }
        } catch (err) {
            toast.error(err.message || "Failed to pair client.");
        } finally {
            setPairing(false);
        }
    }

    async function handleUnpair(client) {
        if (unpairingUuid || unpairingAll) return;

        const label = client.name || client.uuid;

        if (!(await confirm(`Unpair "${label}"?`, { danger: true, confirmLabel: "Unpair" }))) {
            return;
        }

        try {
            setUnpairingUuid(client.uuid);

            const result = await unpairSunshineClient(client.uuid);

            if (result.success) {
                toast.success(`"${label}" unpaired.`);
                await loadClients();
            } else {
                toast.error(result.message || `Failed to unpair "${label}".`);
            }
        } catch (err) {
            toast.error(err.message || "Failed to unpair client.");
        } finally {
            setUnpairingUuid(null);
        }
    }

    async function handleUnpairAll() {
        if (unpairingUuid || unpairingAll || clients.length === 0) return;

        if (!(await confirm("Unpair all Sunshine clients? Every paired device will need to pair again.", {
            danger: true,
            confirmLabel: "Unpair All",
        }))) {
            return;
        }

        try {
            setUnpairingAll(true);

            const result = await unpairAllSunshineClients();

            if (result.success) {
                toast.success("All clients unpaired.");
                await loadClients();
            } else {
                toast.error(result.message || "Failed to unpair all clients.");
            }
        } catch (err) {
            toast.error(err.message || "Failed to unpair all clients.");
        } finally {
            setUnpairingAll(false);
        }
    }

    async function handleCloseStream() {
        if (closingStream) return;

        if (!(await confirm("Force-close the current Sunshine stream? The connected client will be disconnected.", {
            danger: true,
            confirmLabel: "Close Stream",
        }))) {
            return;
        }

        try {
            setClosingStream(true);

            const result = await closeSunshineStream();

            if (result.success) {
                toast.success(result.message || "Stream closed successfully.");
            } else {
                toast.error(result.message || "Failed to close stream.");
            }
        } catch (err) {
            toast.error(err.message || "Failed to close stream.");
        } finally {
            setClosingStream(false);
        }
    }

    const sunshineRunning = hostStatus ? !!hostStatus.sunshine_running : null;
    const sunshineReachable = hostStatus ? !!hostStatus.sunshine_api_reachable : null;
    const streamState = streamStatus?.state ?? null;
    const isStreaming = streamState === "streaming";
    const isdisconnected = streamState === "streaming" && !streamStatus?.transport_connected && streamStatus?.awaiting_reconnect;
    const statusTone = sunshineRunning === null || sunshineReachable === null || streamState === null ? colors.neutral : sunshineRunning && sunshineReachable ? colors.success : colors.danger;

    return (
        <div className="pcgo-sunshine-manager" style={outerWrap}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={headerBar}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={headerIconBadge}>
                        <Satellite size={13} strokeWidth={2} />
                    </div>
                    <div>
                        <div style={headerTitle}>Sunshine Management</div>
                        <div style={headerSubtitle}>
                            {loading ? "Checking paired-client registry" : `${clients.length} paired client${clients.length === 1 ? "" : "s"}`}
                        </div>
                    </div>
                </div>

                <button
                    title="Reload clients"
                    aria-label="Reload clients"
                    disabled={loading}
                    style={{ ...iconGhostButton, opacity: loading ? 0.5 : 1 }}
                    onClick={loadClients}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,235,227,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    {/* P6-T13 motion audit: named-keyframe `animation:` reference, not a `transition:`
                        property — `motion`'s four exports are transition-timing value strings, not
                        `@keyframes` names, so there's no valid conversion target regardless of
                        duration. 0.8s also doesn't match any `motion` step's duration. Left as the
                        original literal; no conversion. */}
                    <RefreshCw size={12} strokeWidth={2} style={loading ? { animation: "scm-spin 0.8s linear infinite" } : undefined} />
                </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Status strip */}
                <div className="pcgo-sunshine-status-card" style={cardSection}>
                    <div style={visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
                        {hostStatus ? `Sunshine ${sunshineRunning ? "running" : "stopped"}; API ${sunshineReachable ? "reachable" : "unreachable"}; stream ${streamState || "pending"}.` : "Checking Sunshine operational status."}
                    </div>
                    <div style={sectionHeadRow}>
                        <div>
                            <span style={sectionLabel}>Operational status</span>
                            <div style={sectionDescription}>Service, API, and current stream truth</div>
                        </div>
                        <StatusPill
                            active={statusTone === colors.success}
                            label={hostStatus && sunshineRunning && sunshineReachable ? "OPERATIONAL" : hostStatus ? "ATTENTION" : "PENDING"}
                            tone={statusTone}
                        />
                    </div>

                    <div className="pcgo-sunshine-status-grid" style={statusRow}>
                        <StatusPill
                            active={sunshineRunning === true}
                            label={sunshineRunning === null ? "Sunshine Pending" : sunshineRunning ? "Sunshine Running" : "Sunshine Stopped"}
                            tone={sunshineRunning === null ? colors.neutral : sunshineRunning ? colors.success : colors.danger}
                        />
                        <StatusPill
                            active={sunshineReachable === true}
                            label={sunshineReachable === null ? "API Pending" : sunshineReachable ? "API Reachable" : "API Unreachable"}
                            tone={sunshineReachable === null ? colors.neutral : sunshineReachable ? colors.success : colors.danger}
                        />
                        <StatusPill
                            active={isStreaming}
                            label={streamState === null ? "Stream Pending" : isStreaming ? `Streaming: ${streamStatus?.app_name || "Unknown"}` : "Stream Idle"}
                            tone={streamState === null ? colors.neutral : isStreaming ? colors.accentBlue : colors.inkDim}
                        />
                        {isdisconnected && (
                            <StatusPill
                                active={isdisconnected}
                                label="Transport Disconnected"
                                tone={colors.danger}
                            />
                        )}
                    </div>

                    <button
                        style={{
                            ...closeStreamButton,
                            opacity: !isStreaming || closingStream ? 0.4 : 1,
                            cursor: !isStreaming || closingStream ? "not-allowed" : "pointer",
                        }}
                        disabled={!isStreaming || closingStream}
                        onClick={handleCloseStream}
                        onMouseEnter={(e) => {
                            if (isStreaming && !closingStream) {
                                e.currentTarget.style.background = "rgba(255,107,107,0.16)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        {closingStream ? (
                            // P6-T13 motion audit: named-keyframe `animation:` reference, not a
                            // `transition:` property — `motion`'s four exports are transition-timing
                            // value strings, not `@keyframes` names, so there's no valid conversion
                            // target regardless of duration. 0.8s also doesn't match any `motion`
                            // step's duration. Left as the original literal; no conversion.
                            <RefreshCw size={11} strokeWidth={2} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                        ) : (
                            <Power size={11} strokeWidth={2} />
                        )}
                        {closingStream ? "CLOSING…" : "FORCE CLOSE STREAM"}
                    </button>
                </div>

                {/* Paired clients */}
                <div style={cardSection}>
                    <div style={sectionHeadRow}>
                        <div>
                            <span style={sectionLabel}>Paired Clients</span>
                            <div style={sectionDescription}>Known paired devices, not active streaming clients</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {!loading && <StatusPill active={clientsReachable} label={clientsReachable ? "Registry Reachable" : "Registry Unavailable"} tone={clientsReachable ? colors.success : colors.danger} />}
                            <span style={countBadge}>{loading ? "--" : clients.length}</span>
                        </div>
                    </div>

                    {loading ? (
                        <ClientListLoadingState />
                    ) : clientsError ? (
                        <div style={validationBad}>
                            <AlertTriangle size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                            {clientsError}
                        </div>
                    ) : clients.length === 0 ? (
                            <div style={emptyBox}>
                                <Satellite size={22} strokeWidth={1.5} style={{ color: colors.inkFaint }} />
                                <strong style={{ fontSize: "11px", color: colors.inkDim, fontFamily: fonts.mono }}>No paired clients</strong>
                                <span style={emptyDescription}>Pairing has not been completed for any Sunshine device.</span>
                            </div>
                    ) : (
                        <div style={grid}>
                            {clients.map((client) => (
                                <div key={client.uuid || client.name} style={clientCard}>
                                    <div style={cardHeaderRow}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                                            <div style={avatarBadge}>
                                                <Monitor size={12} strokeWidth={2} />
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <div style={clientName} title={client.name || client.uuid}>
                                                    {client.name || "Unnamed device"}
                                                </div>
                                                <div style={cardMeta} title={client.uuid}>
                                                    {client.uuid || "--"}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            title={`Unpair ${client.name || client.uuid}`}
                                            aria-label={`Unpair ${client.name || client.uuid}`}
                                            style={{
                                                ...cardDeleteButton,
                                                opacity: unpairingUuid === client.uuid || unpairingAll ? 0.4 : 1,
                                                cursor: unpairingUuid === client.uuid || unpairingAll ? "not-allowed" : "pointer",
                                            }}
                                            disabled={unpairingUuid === client.uuid || unpairingAll}
                                            onClick={() => handleUnpair(client)}
                                            onMouseEnter={(e) => {
                                                if (unpairingUuid !== client.uuid && !unpairingAll) {
                                                    e.currentTarget.style.background = "rgba(255,107,107,0.16)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            {unpairingUuid === client.uuid ? (
                                                // P6-T13 motion audit: named-keyframe `animation:` reference, not
                                                // a `transition:` property — `motion`'s four exports are
                                                // transition-timing value strings, not `@keyframes` names, so
                                                // there's no valid conversion target regardless of duration. 0.8s
                                                // also doesn't match any `motion` step's duration. Left as the
                                                // original literal; no conversion.
                                                <RefreshCw size={10} strokeWidth={2} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                                            ) : (
                                                <Unlink size={11} strokeWidth={2} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        style={{
                            ...deleteAllButton,
                            opacity: clients.length === 0 || unpairingAll || unpairingUuid ? 0.4 : 1,
                            cursor: clients.length === 0 || unpairingAll || unpairingUuid ? "not-allowed" : "pointer",
                        }}
                        disabled={clients.length === 0 || unpairingAll || !!unpairingUuid}
                        onClick={handleUnpairAll}
                        onMouseEnter={(e) => {
                            if (clients.length > 0 && !unpairingAll && !unpairingUuid) {
                                e.currentTarget.style.background = "rgba(255,107,107,0.16)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        {unpairingAll ? (
                            // P6-T13 motion audit: named-keyframe `animation:` reference, not a
                            // `transition:` property — `motion`'s four exports are transition-timing
                            // value strings, not `@keyframes` names, so there's no valid conversion
                            // target regardless of duration. 0.8s also doesn't match any `motion`
                            // step's duration. Left as the original literal; no conversion.
                            <RefreshCw size={11} strokeWidth={2} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                        ) : (
                            <Ban size={11} strokeWidth={2} />
                        )}
                        {unpairingAll ? "UNPAIRING…" : "UNPAIR ALL CLIENTS"}
                    </button>
                </div>

                {/* Pair new client */}
                <div style={cardSection}>
                    <div style={sectionHeadRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={sectionIconBadge}>
                                <Plug size={12} strokeWidth={2} />
                            </div>
                            <span style={sectionLabel}>Pair New Client</span>
                        </div>
                    </div>

                    <FieldLabel>PIN</FieldLabel>
                    <div style={{ position: "relative" }}>
                        <Key
                            size={11}
                            strokeWidth={2}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: colors.inkFaint,
                                pointerEvents: "none",
                            }}
                        />
                        <input
                            style={{ ...inputStyle, paddingLeft: "34px" }}
                            placeholder="4-digit PIN shown on the client"
                            aria-label="PIN"
                            value={pin}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) => setPin(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && pin.trim() && !pairing) handlePair();
                            }}
                        />
                    </div>

                    <button
                        style={{
                            ...saveButton,
                            opacity: pin.trim() && !pairing ? 1 : 0.5,
                            cursor: pin.trim() && !pairing ? "pointer" : "not-allowed",
                            marginTop: "16px",
                        }}
                        disabled={!pin.trim() || pairing}
                        onClick={handlePair}
                        onMouseEnter={(e) => {
                            if (pin.trim() && !pairing) {
                                e.currentTarget.style.filter = "brightness(1.06)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = "none";
                        }}
                    >
                        <Plug size={12} strokeWidth={2} />
                        {pairing ? "PAIRING..." : "PAIR CLIENT"}
                    </button>
                </div>

            </div>

            <style>{`@keyframes scm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes scm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        </div>
    );
}

function StatusPill({ active, label, tone }) {
    const color = tone || (active ? colors.success : colors.inkDim);
    return (
        <span style={{ ...statusPill, color, borderColor: color }}>
            <Circle size={6} strokeWidth={0} fill={color} style={{ color }} />
            {label}
        </span>
    );
}

function ClientListLoadingState() {
    return (
        <div className="pcgo-sunshine-client-loading" role="status" aria-live="polite">
            <div style={loadingRow}>
                <span style={pulseDot} />
                Checking paired-client registry
            </div>
            <div className="pcgo-sunshine-client-loading-grid" aria-hidden="true">
                {["Client identity", "Pairing record"].map((label) => (
                    <div key={label} style={clientLoadingCard}>
                        <span style={loadingAvatar} />
                        <div style={{ flex: 1 }}>
                            <span style={loadingLineWide} />
                            <span style={loadingLineShort} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <label
            style={{
                display: "block",
                fontSize: "9.5px",
                color: colors.inkFaint,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: fonts.mono,
                fontWeight: 700,
                marginBottom: "7px",
                marginTop: "14px",
            }}
        >
            {children}
        </label>
    );
}

const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
};
const blurBorder = (e) => {
    e.target.style.borderColor = colors.border;
};

// ── Style primitives (matches UserPanel / GameManager / SettingsPanel) ─────

const outerWrap = {
    border: `1px solid ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    background: surface.l3,
    overflow: "hidden",
};

const headerBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "8px",
    gap: "10px",
    padding: "16px 20px",
    borderBottom: `1px solid ${colors.border}`,
    background: surface.l2,
};

const headerIconBadge = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brandDim,
    border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
    color: colors.brand,
    fontSize: "13px",
    flexShrink: 0,
};

const headerTitle = {
    fontSize: "13.5px",
    fontWeight: 700,
    color: colors.ink,
    fontFamily: fonts.display,
    letterSpacing: "0.02em",
};

const headerSubtitle = {
    fontSize: "10px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
    marginTop: "1px",
    letterSpacing: "0.02em",
};

const iconGhostButton = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    background: "transparent",
    border: `1.5px solid ${colors.border}`,
    color: colors.brand,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "background 150ms ease",
    flexShrink: 0,
};

const cardSection = {
    padding: "16px",
    borderRadius: `${radius.md}px`,
    border: `1px solid ${colors.border}`,
    background: surface.l1,
};

const sectionHeadRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "6px",
    marginBottom: "14px",
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

const sectionDescription = {
    marginTop: "4px",
    color: colors.inkFaint,
    fontSize: "9.5px",
    lineHeight: 1.4,
    fontFamily: fonts.mono,
};

const emptyDescription = {
    maxWidth: "280px",
    color: colors.inkFaint,
    fontSize: "10px",
    lineHeight: 1.45,
    fontFamily: fonts.mono,
};

const sectionLabel = {
    fontSize: "9.5px",
    color: colors.inkFaint,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontFamily: fonts.mono,
    fontWeight: 700,
};

const sectionIconBadge = {
    width: "24px",
    height: "24px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brandDim,
    border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
    color: colors.brand,
    flexShrink: 0,
};

const countBadge = {
    fontSize: "9px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
    padding: "1px 7px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: "10px",
};

const statusRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px",
};

const statusPill = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "9.5px",
    fontFamily: fonts.mono,
    letterSpacing: "0.04em",
    padding: "5px 10px",
    borderRadius: `${radius.sm}px`,
    border: "1px solid",
    background: surface.l1,
};

const closeStreamButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    border: `1.5px solid ${colors.danger}`,
    background: "transparent",
    color: colors.danger,
    borderRadius: `${radius.sm}px`,
    fontFamily: fonts.mono,
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "background 150ms ease",
    marginTop: "14px",
};

const loadingRow = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 4px",
    color: colors.inkDim,
    fontFamily: fonts.mono,
    fontSize: "10.5px",
};

const clientLoadingCard = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minHeight: "58px",
    padding: "12px",
    background: surface.l3,
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: `${radius.md}px`,
};

const loadingAvatar = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    background: surface.l1,
    border: `1px solid ${colors.borderSubtle}`,
    flexShrink: 0,
};

const loadingLineWide = {
    display: "block",
    width: "min(140px, 76%)",
    height: "8px",
    borderRadius: "2px",
    background: surface.l1,
    border: `1px solid ${colors.borderSubtle}`,
};

const loadingLineShort = {
    display: "block",
    width: "84px",
    height: "7px",
    marginTop: "7px",
    borderRadius: "2px",
    background: surface.l1,
    border: `1px solid ${colors.borderSubtle}`,
};

const pulseDot = {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: colors.brand,
    // P6-T13 motion audit: this is a named-keyframe `animation:` reference, not a
    // `transition:` property — `motion`'s four exports are transition-timing value strings,
    // not `@keyframes` names, so there's no valid conversion target regardless of duration.
    // Its 1.6s duration also doesn't match any `motion` step's duration anyway. Left as the
    // original literal; no conversion.
    animation: "scm-pulse 1.6s ease-in-out infinite",
    flexShrink: 0,
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px 24px",
    border: `1.5px dashed ${colors.border}`,
    borderRadius: `${radius.md}px`,
    textAlign: "center",
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
};

const clientCard = {
    position: "relative",
    padding: "14px",
    background: surface.l3,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    overflow: "hidden",
};

const cardHeaderRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "6px",
    gap: "8px",
};

const avatarBadge = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
    background: colors.brandDim,
    color: colors.brand,
    flexShrink: 0,
};

const clientName = {
    color: colors.ink,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: fonts.display,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
};

const cardMeta = {
    fontFamily: fonts.mono,
    fontSize: "9.5px",
    color: colors.inkFaint,
    marginTop: "3px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
};

const cardDeleteButton = {
    width: "26px",
    height: "26px",
    flexShrink: 0,
    borderRadius: `${radius.sm}px`,
    background: "transparent",
    border: `1.5px solid ${colors.danger}66`,
    color: colors.danger,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "background 150ms ease",
};

const deleteAllButton = {
    width: "100%",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    border: `1.5px solid ${colors.danger}`,
    background: "transparent",
    color: colors.danger,
    borderRadius: `${radius.full}px`,
    cursor: "pointer",
    fontFamily: fonts.mono,
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "background 150ms ease",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: surface.l1,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    color: colors.ink,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "border-color 150ms ease",
};

const saveButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "12px",
    background: colors.ink,
    border: "1.5px solid transparent",
    borderRadius: `${radius.sm}px`,
    color: colors.bg,
    fontSize: "11.5px",
    fontFamily: fonts.mono,
    fontWeight: 700,
    letterSpacing: "0.12em",
    // P6-T13 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "filter 150ms ease",
};

const validationBad = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: `${radius.md}px`,
    color: colors.danger,
    border: `1.5px solid ${colors.danger}`,
    background: "rgba(255,107,107,0.08)",
    fontSize: "11px",
    fontFamily: fonts.mono,
};
