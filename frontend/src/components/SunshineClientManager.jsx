/**
 * components/SunshineClientManager.jsx
 *
 * Admin-only Sunshine client/pairing management, built to the same
 * architecture as UserPanel.jsx:
 *   - Self-contained: fetches its own client list, owns its own
 *     loading/error state, no data props required.
 *   - Same toast + useConfirm integration as UserPanel/GameManager for
 *     action feedback and destructive-action confirmation.
 *   - Same visual language (outerWrap/headerBar/cardSection/grid/card)
 *     as UserPanel / GameManager / SettingsPanel.
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
    FaSatelliteDish,
    FaDesktop,
    FaSyncAlt,
    FaUnlink,
    FaBan,
    FaKey,
    FaPlug,
    FaExclamationTriangle,
    FaPowerOff,
    FaCircle,
} from "react-icons/fa";

import {
    getSunshineClients,
    pairSunshineClient,
    unpairSunshineClient,
    unpairAllSunshineClients,
    closeSunshineStream,
} from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";

// ── Shared design tokens (matches UserPanel / GameManager / SettingsPanel) ──

const palette = {
    bg: "#000000",
    card: "rgba(0, 0, 0, 0.55)",
    cardAlt: "rgba(2,6,23,0.45)",
    border: "#1c2130",
    borderStrong: "rgba(148,163,184,0.18)",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    success: "#10d98a",
    warning: "#f5a524",
    danger: "#f43f5e",
    mono: "'JetBrains Mono', monospace",
    display: "'Rajdhani', sans-serif",
};

export function SunshineClientManager({ hostStatus, streamStatus }) {

    const toast = useToast();
    const confirm = useConfirm();

    const [clients, setClients] = useState([]);
    const [clientsReachable, setClientsReachable] = useState(true);
    const [clientsError, setClientsError] = useState("");
    const [loading, setLoading] = useState(false);

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

    const sunshineRunning = !!hostStatus?.sunshine_running;
    const sunshineReachable = !!hostStatus?.sunshine_api_reachable;
    const isStreaming = streamStatus?.state === "streaming";
    const isdisconnected = streamStatus?.state === "streaming" && !streamStatus?.transport_connected && streamStatus?.awaiting_reconnect;

    return (
        <div style={outerWrap}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={headerBar}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={headerIconBadge}>
                        <FaSatelliteDish size={13} />
                    </div>
                    <div>
                        <div style={headerTitle}>Sunshine Management</div>
                        <div style={headerSubtitle}>
                            {clients.length} paired client{clients.length === 1 ? "" : "s"}
                        </div>
                    </div>
                </div>

                <button
                    title="Reload clients"
                    aria-label="Reload clients"
                    disabled={loading}
                    style={{ ...iconGhostButton, opacity: loading ? 0.5 : 1 }}
                    onClick={loadClients}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <FaSyncAlt size={12} style={loading ? { animation: "scm-spin 0.8s linear infinite" } : undefined} />
                </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Status strip */}
                <div style={cardSection}>
                    <div style={sectionHeadRow}>
                        <span style={sectionLabel}>Status</span>
                    </div>

                    <div style={statusRow}>
                        <StatusPill
                            active={sunshineRunning}
                            label={sunshineRunning ? "Sunshine Running" : "Sunshine Stopped"}
                        />
                        <StatusPill
                            active={sunshineReachable}
                            label={sunshineReachable ? "API Reachable" : "API Unreachable"}
                        />
                        <StatusPill
                            active={isStreaming}
                            label={isStreaming ? `Streaming: ${streamStatus?.app_name || "Unknown"}` : "Idle"}
                            tone={isStreaming ? palette.accent : undefined}
                        />
                        {isdisconnected &&(
                            <StatusPill
                                active={isdisconnected}
                                label={isdisconnected ? "Transport Disconnected" : "Transport Connected"}
                                tone={isdisconnected ? palette.danger : palette.success}
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
                                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                        }}
                    >
                        {closingStream ? (
                            <FaSyncAlt size={11} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                        ) : (
                            <FaPowerOff size={11} />
                        )}
                        {closingStream ? "CLOSING…" : "FORCE CLOSE STREAM"}
                    </button>
                </div>

                {/* Paired clients */}
                <div style={cardSection}>
                    <div style={sectionHeadRow}>
                        <span style={sectionLabel}>Paired Clients</span>
                        <span style={countBadge}>{clients.length}</span>
                    </div>

                    {loading ? (
                        <div style={loadingRow}>
                            <span style={pulseDot} />
                            Loading clients...
                        </div>
                    ) : clientsError ? (
                        <div style={validationBad}>
                            <FaExclamationTriangle size={11} style={{ flexShrink: 0 }} />
                            {clientsError}
                        </div>
                    ) : clients.length === 0 ? (
                        <div style={emptyBox}>
                            <FaSatelliteDish size={22} style={{ color: palette.muted, opacity: 0.6 }} />
                            <div style={{ fontSize: "11px", color: palette.dim, fontFamily: palette.mono }}>
                                No paired clients
                            </div>
                        </div>
                    ) : (
                        <div style={grid}>
                            {clients.map((client) => (
                                <div key={client.uuid || client.name} style={clientCard}>
                                    <div style={cardTopAccent} />

                                    <div style={cardHeaderRow}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                                            <div style={avatarBadge}>
                                                <FaDesktop size={12} />
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
                                                    e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            {unpairingUuid === client.uuid ? (
                                                <FaSyncAlt size={10} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                                            ) : (
                                                <FaUnlink size={11} />
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
                                e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
                        }}
                    >
                        {unpairingAll ? (
                            <FaSyncAlt size={11} style={{ animation: "scm-spin 0.8s linear infinite" }} />
                        ) : (
                            <FaBan size={11} />
                        )}
                        {unpairingAll ? "UNPAIRING…" : "UNPAIR ALL CLIENTS"}
                    </button>
                </div>

                {/* Pair new client */}
                <div style={cardSection}>
                    <div style={sectionHeadRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={sectionIconBadge}>
                                <FaPlug size={12} />
                            </div>
                            <span style={sectionLabel}>Pair New Client</span>
                        </div>
                    </div>

                    <FieldLabel>PIN</FieldLabel>
                    <div style={{ position: "relative" }}>
                        <FaKey
                            size={11}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: palette.muted,
                                pointerEvents: "none",
                            }}
                        />
                        <input
                            style={{ ...inputStyle, paddingLeft: "34px" }}
                            placeholder="4-digit PIN shown on the client"
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
                                e.currentTarget.style.background =
                                    "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                                "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
                        }}
                    >
                        <FaPlug size={12} />
                        {pairing ? "PAIRING..." : "PAIR CLIENT"}
                    </button>
                </div>

            </div>

            <style>{`@keyframes scm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes scm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        </div>
    );
}

function StatusPill({ active, label, tone }) {
    const color = tone || (active ? palette.success : palette.muted);
    return (
        <span style={{ ...statusPill, color, borderColor: color }}>
            <FaCircle size={6} style={{ color }} />
            {label}
        </span>
    );
}

function FieldLabel({ children }) {
    return (
        <label
            style={{
                display: "block",
                fontSize: "9.5px",
                color: palette.muted,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: palette.mono,
                marginBottom: "7px",
                marginTop: "14px",
            }}
        >
            {children}
        </label>
    );
}

const focusBorder = (e) => {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
};
const blurBorder = (e) => {
    e.target.style.borderColor = palette.border;
    e.target.style.boxShadow = "none";
};

// ── Style primitives (matches UserPanel / GameManager / SettingsPanel) ─────

const outerWrap = {
    border: `1px solid ${palette.border}`,
    borderRadius: "12px",
    background: "rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
};

const headerBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "16px 20px",
    borderBottom: `1px solid ${palette.border}`,
    background: "rgb(0, 5, 6)",
};

const headerIconBadge = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.3)",
    color: palette.accent,
    fontSize: "13px",
    flexShrink: 0,
};

const headerTitle = {
    fontSize: "13.5px",
    fontWeight: 700,
    color: palette.text,
    fontFamily: palette.display,
    letterSpacing: "0.02em",
};

const headerSubtitle = {
    fontSize: "10px",
    color: palette.faint,
    fontFamily: palette.mono,
    marginTop: "1px",
    letterSpacing: "0.02em",
};

const iconGhostButton = {
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    background: "transparent",
    border: `1px solid ${palette.border}`,
    color: palette.accent,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
    flexShrink: 0,
};

const cardSection = {
    padding: "16px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    background: palette.card,
};

const sectionHeadRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
};

const sectionLabel = {
    fontSize: "9.5px",
    color: palette.muted,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontFamily: palette.mono,
};

const sectionIconBadge = {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.28)",
    color: palette.accent,
    flexShrink: 0,
};

const countBadge = {
    fontSize: "9px",
    color: palette.muted,
    fontFamily: palette.mono,
    padding: "1px 7px",
    border: `1px solid ${palette.border}`,
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
    fontFamily: palette.mono,
    letterSpacing: "0.04em",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid",
    background: "rgba(0,0,0,0.3)",
};

const closeStreamButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    border: `1px solid ${palette.danger}`,
    background: "rgba(239,68,68,0.08)",
    color: palette.danger,
    borderRadius: "7px",
    fontFamily: palette.mono,
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    transition: "background 0.15s",
};

const loadingRow = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "16px 4px",
    color: palette.dim,
    fontFamily: palette.mono,
    fontSize: "11.5px",
};

const pulseDot = {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: palette.accent,
    animation: "scm-pulse 1.4s ease-in-out infinite",
    flexShrink: 0,
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px 24px",
    border: `1px dashed ${palette.border}`,
    borderRadius: "10px",
    textAlign: "center",
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
};

const clientCard = {
    position: "relative",
    padding: "14px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: "10px",
    overflow: "hidden",
};

const cardTopAccent = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
    opacity: 0.8,
};

const cardHeaderRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
};

const avatarBadge = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(56,189,248,0.3)",
    background: "rgba(56,189,248,0.12)",
    color: palette.accent,
    flexShrink: 0,
};

const clientName = {
    color: palette.text,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: palette.display,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const cardMeta = {
    fontFamily: palette.mono,
    fontSize: "9.5px",
    color: palette.faint,
    marginTop: "3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const cardDeleteButton = {
    width: "26px",
    height: "26px",
    flexShrink: 0,
    borderRadius: "6px",
    background: "transparent",
    border: "1px solid rgba(239,68,68,0.4)",
    color: palette.danger,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
};

const deleteAllButton = {
    width: "100%",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    border: `1px solid ${palette.danger}`,
    background: "rgba(239,68,68,0.08)",
    color: palette.danger,
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: palette.mono,
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    transition: "background 0.15s",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: "7px",
    color: palette.text,
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

const saveButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "12px",
    background: "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
    border: "1px solid rgba(56,189,248,0.4)",
    borderRadius: "8px",
    color: palette.accent,
    fontSize: "11.5px",
    fontFamily: palette.mono,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textShadow: "0 0 14px rgba(56,189,248,0.4)",
    transition: "background 0.2s",
};

const validationBad = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "7px",
    color: palette.danger,
    border: `1px solid ${palette.danger}`,
    background: "rgba(244,63,94,0.08)",
    fontSize: "11px",
    fontFamily: palette.mono,
};
