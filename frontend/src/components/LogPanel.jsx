/**
 * components/LogPanel.jsx
 *
 * Same data fetching (getLogs, getLogSessions), same state, same
 * auto-refresh / scroll-tracking / search-highlight / responsive
 * (compact / mobile) logic, same download & export handlers as before —
 * only the presentation was reworked to match the visual language already
 * used by SessionHistory / SessionAnalytics / GameManager / SettingsPanel:
 *   - Icon-badged section header with a live entry count, matching the
 *     other panels' header pattern.
 *   - Icon-labeled filter controls (level / session / search) styled with
 *     the shared input/select treatment instead of bare browser widgets.
 *   - Entries / Warnings / Errors rendered as icon-badged stat tiles
 *     instead of a plain text status line.
 *   - LIVE/PAUSED, REFRESH, DOWNLOAD and EXPORT are now icon+label pill
 *     buttons using the same mono, uppercase, bordered treatment used
 *     everywhere else in the app.
 *   - The mobile "more" menu is restyled as a flat bordered dropdown card
 *     matching GameManager's menu pattern (no glass/blur, per
 *     DESIGN_SYSTEM's ban on glassmorphism).
 *
 * No functional change: every handler, state variable, ref, effect and
 * API call below is untouched from the previous implementation.
 */

import {
    useEffect,
    useState,
    useRef,
} from "react";

import {
    FileText,
    RefreshCw,
    Download,
    FileOutput,
    Search,
    MoreVertical,
    AlertTriangle,
    XCircle,
    RadioTower,
    PauseCircle,
    ChevronDown,
    List,
} from "lucide-react";

import {
    getLogs,
    getLogSessions,
    getApiUrl,
    clearToken,
} from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { colors, fonts, radius } from "../dashboard/theme.js";

// The level/session filter selects and the search input below all use
// selectStyle/searchInputStyle, which set outline:"none". Every other
// input in this app pairs that with an onFocus/onBlur border change
// (see GameManager.jsx, StartSessionForm.jsx, etc.) — these three were
// missing that pairing, so tabbing to them showed no focus indication
// at all. Adding the same pattern here for consistency.
const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
};
const blurBorder = (e) => {
    e.target.style.borderColor = colors.borderSubtle;
};

export function LogPanel() {

    const toast = useToast();

    const [logs, setLogs] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [level, setLevel] =
        useState("ALL");

    const [autoRefresh, setAutoRefresh] =
        useState(true);

    const [sessionFilter, setSessionFilter] =
        useState("ALL");

    const [sessions, setSessions] =
        useState([]);

    const [warningCount, setWarningCount] =
    useState(0);

    const [errorCount, setErrorCount] =
        useState(0);

    const [search, setSearch] =
        useState("");

    const logRef = useRef(null);

    const atBottomRef = useRef(true);

    const userScrolledRef = useRef(false);

    const initializedRef = useRef(false);
    
    const [atBottom, setAtBottom] =
        useState(true);

    const [searchInput, setSearchInput] =
        useState("");

    const [showMenu, setShowMenu] =
        useState(false);

    const [downloading, setDownloading] =
        useState(false);

    const [compactMode, setCompactMode] =
        useState(
            window.innerWidth < 900
        );

    const [mobileMode, setMobileMode] =
        useState(
            window.innerWidth < 650
        );

    const current_user =
        localStorage.getItem("username");

    const role =
        localStorage.getItem("role");
    
    const isAdmin =
        role === "admin";
    
    async function loadLogs() {

        try {

            setLoading(true);

            const data =
                await getLogs(
                    level === "ALL"
                        ? null
                        : level,

                    sessionFilter === "ALL"
                        ? null
                        : sessionFilter,

                    search.trim()
                        ? search
                        : null
                );

            setLogs(
                data.logs || []
            );

            setTimeout(() => {

                if (!logRef.current) {
                    return;
                }

                const container =
                    logRef.current;

                if (!initializedRef.current) {

                    container.scrollTop =
                        container.scrollHeight -
                        container.clientHeight;

                    initializedRef.current = true;

                    atBottomRef.current = true;
                    setAtBottom(true);

                    return;
                }

                if (
                    autoRefresh &&
                    atBottomRef.current &&
                    userScrolledRef.current
                ) {

                    container.scrollTop =
                        container.scrollHeight -
                        container.clientHeight;
                }

            }, 50);

            setWarningCount(
                data.warnings || 0
            );

            setErrorCount(
                data.errors || 0
            );

        } catch {

            setLogs([
                "Failed to load logs.",
            ]);

        } finally {

            setLoading(false);

        }
    }

    async function loadSessions() {

        try {
            const data =
                await getLogSessions();

            setSessions(
                data.sessions
            );
        
        } catch (err) {
            setSessions([]);
        }
    }

    useEffect(() => {

        loadLogs();
        loadSessions();

    }, [
        level,
        sessionFilter,
        search,
    ]);

    useEffect(() => {

        if (!autoRefresh) {
            return;
        }

        const interval =
            setInterval(() => {
                loadLogs();
                loadSessions();
            }, 5000);

        return () =>
            clearInterval(
                interval
            );

    }, [
        autoRefresh,
        level,
        sessionFilter,
        search,
    ]);

    useEffect(() => {

        const style =
            document.createElement("style");

        style.innerHTML = `

            @keyframes lp-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }

            @keyframes scrollBounce {

                0%,100% {
                    transform:
                        translateX(-50%)
                        translateY(0);
                }

                50% {
                    transform:
                        translateX(-50%)
                        translateY(5px);
                }
            }

            .scroll-btn {

                animation:
                    scrollBounce 2s infinite;
            }

            .scroll-btn:hover {

                transform:
                    translateX(-50%)
                    scale(1.08);

                border:
                    1.5px solid
                    ${colors.borderInk};
            }
        `;

        document.head.appendChild(style);

        return () =>
            document.head.removeChild(style);

    }, []);

    useEffect(() => {

        const timer =
            setTimeout(() => {

                setSearch(
                    searchInput
                );

            }, 400);

        return () =>
            clearTimeout(timer);

    }, [searchInput]);

    useEffect(() => {

        initializedRef.current = false;

    }, [
        level,
        sessionFilter,
        search,
    ]);

    useEffect(() => {

        if (!showMenu) return;

        function handleKeyDown(e) {
            if (e.key === "Escape") {
                setShowMenu(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () =>
            window.removeEventListener("keydown", handleKeyDown);

    }, [showMenu]);

    useEffect(() => {

        function handleResize() {

            setCompactMode(
                window.innerWidth < 900
            );

            setMobileMode(
                window.innerWidth < 650
            );
        }

        window.addEventListener(
            "resize",
            handleResize
        );

        handleResize();

        return () =>
            window.removeEventListener(
                "resize",
                handleResize
            );

    }, []);

    function jumpBottom() {

        if (!logRef.current) {
            return;
        }

        const container =
            logRef.current;

        container.scrollTo({
            top:
                container.scrollHeight -
                container.clientHeight,

            behavior:
                "smooth",
        });        
    }

    async function downloadLogs() {

        if (downloading) return;

        try {

            setDownloading(true);

            const endpoint =
                isAdmin
                    ? "/admin/logs/download"
                    : "/admin/my-logs/download";

            const response = await fetch(
                getApiUrl(endpoint),
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("access_token")}`,
                    },
                }
            );

            if (!response.ok) {

                if (response.status === 401) {
                    clearToken();
                    window.location.href = "/login";
                    return;
                }

                toast.error("Failed to download logs.");
                return;
            }

            const blob = await response.blob();

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            const file_name = (
                isAdmin
                    ? "host_logs"
                    : `${current_user}_logs`
            );
            link.download = file_name;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

        } finally {

            setDownloading(false);

        }
    }
    
    function downloadFiltered() {

        const blob =
            new Blob(
                [logs.join("\n")],
                {
                    type:
                        "text/plain",
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        const parts = [];

        if (level !== "ALL") {
            parts.push(
                level.toLowerCase()
            );
        }

        if (
            sessionFilter !== "ALL"
        ) {
            parts.push(
                sessionFilter
            );
        }

        if (
            search.trim()
        ) {
            parts.push(
                search
                    .replaceAll(
                        " ",
                        "_"
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        ""
                    )
            );
        }

        if (parts.length === 0) {

            const file_name = (
                isAdmin
                    ? "host_logs"
                    : `${current_user}_logs`
            );
            parts.push(
                file_name
            );
        }

        link.download =
            `${parts.join("_")}.log`;

        link.click();

        URL.revokeObjectURL(url);
    }

    function handleScroll() {

        if (!logRef.current) {
            return;
        }

        const container =
            logRef.current;

        const threshold = 8;

        const bottom =

            container.scrollHeight -

            container.scrollTop -

            container.clientHeight

            < threshold;

        setAtBottom(bottom);
        atBottomRef.current = bottom;
        userScrolledRef.current = true;
    }
    
    const escapedSearch =
        (search || "")
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

    // ── Small presentational helpers (match GameManager / SessionHistory) ──

    function PillButton({ active, tone, onClick, icon, children, disabled }) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                style={{
                    ...(active ? activePillButton(tone) : pillButton),
                    ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : null),
                }}
                onMouseEnter={(e) => {
                    if (active || disabled) return;
                    e.currentTarget.style.background = "rgba(237,235,227,0.08)";
                    e.currentTarget.style.color = colors.ink;
                    e.currentTarget.style.borderColor = colors.borderStrong;
                }}
                onMouseLeave={(e) => {
                    if (active || disabled) return;
                    e.currentTarget.style.background = colors.bgCard;
                    e.currentTarget.style.color = colors.inkDim;
                    e.currentTarget.style.borderColor = colors.border;
                }}
            >
                {icon}
                {children}
            </button>
        );
    }

    function StatTile({ icon, label, value, tone }) {
        return (
            <div style={statTile}>
                <div style={statIconWrap(tone)}>
                    {icon}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ ...statValue, color: tone }}>
                        {value}
                    </div>
                    <div style={statLabel}>
                        {label}
                    </div>
                </div>
            </div>
        );
    }

    const filterControls = (
        <>
            <select
                value={level}
                onChange={(e) =>
                    setLevel(e.target.value)
                }
                style={selectStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
            >
                <option value="ALL">ALL LEVELS</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
            </select>

            <select
                value={sessionFilter}
                onChange={(e) =>
                    setSessionFilter(
                        e.target.value
                    )
                }
                style={selectStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
            >
                <option value="ALL">
                    ALL SESSIONS
                </option>

                {
                    sessions.map(session => (
                        <option
                            key={session}
                            value={session}
                        >
                            {session}
                        </option>
                    ))
                }

            </select>

            <div style={searchWrap}>
                <Search size={11} strokeWidth={2} style={searchIcon} />
                <input
                    placeholder="Search logs..."
                    value={searchInput}
                    onChange={(e) =>
                        setSearchInput(
                            e.target.value
                        )
                    }
                    style={searchInputStyle}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                />
            </div>
        </>
    );

    return (

        <section style={sectionStyle}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={headerRow}>

                <div style={headerLeft}>
                    <div style={iconBadge}>
                        <FileText size={12} strokeWidth={2} />
                    </div>

                    <h2 style={titleStyle}>
                        HOST LOGS
                    </h2>

                    <span style={countBadge}>
                        {logs.length}
                    </span>
                </div>

                {/* ================= LARGE ================= */}

                {
                    !compactMode && (

                        <div style={actionsRow}>

                            <PillButton
                                active={autoRefresh}
                                tone={colors.success}
                                onClick={() =>
                                    setAutoRefresh(
                                        !autoRefresh
                                    )
                                }
                                icon={
                                    autoRefresh
                                        ? <RadioTower size={10} strokeWidth={2} />
                                        : <PauseCircle size={10} strokeWidth={2} />
                                }
                            >
                                {
                                    autoRefresh
                                        ? "LIVE"
                                        : "PAUSED"
                                }
                            </PillButton>

                            <PillButton
                                onClick={loadLogs}
                                disabled={loading}
                                icon={<RefreshCw size={10} strokeWidth={2} style={loading ? { animation: "lp-spin 0.8s linear infinite" } : undefined} />}
                            >
                                {loading ? "REFRESHING..." : "REFRESH"}
                            </PillButton>

                            <PillButton
                                onClick={downloadLogs}
                                disabled={downloading}
                                icon={<Download size={10} strokeWidth={2} style={downloading ? { animation: "lp-spin 0.8s linear infinite" } : undefined} />}
                            >
                                {downloading ? "DOWNLOADING..." : "DOWNLOAD"}
                            </PillButton>

                            <PillButton
                                onClick={downloadFiltered}
                                disabled={downloading}
                                icon={<FileOutput size={10} strokeWidth={2} />}
                            >
                                EXPORT
                            </PillButton>

                        </div>

                    )
                }

                {/* ================= MEDIUM / MOBILE ================= */}

                {
                    compactMode &&
                    !mobileMode && (

                        <div style={actionsRow}>

                            <PillButton
                                active={autoRefresh}
                                tone={colors.success}
                                onClick={() =>
                                    setAutoRefresh(
                                        !autoRefresh
                                    )
                                }
                                icon={
                                    autoRefresh
                                        ? <RadioTower size={10} strokeWidth={2} />
                                        : <PauseCircle size={10} strokeWidth={2} />
                                }
                            >
                                {
                                    autoRefresh
                                        ? "LIVE"
                                        : "PAUSED"
                                }
                            </PillButton>

                            <PillButton
                                onClick={loadLogs}
                                disabled={loading}
                                icon={<RefreshCw size={10} strokeWidth={2} style={loading ? { animation: "lp-spin 0.8s linear infinite" } : undefined} />}
                            >
                                {loading ? "REFRESHING..." : "REFRESH"}
                            </PillButton>

                            <PillButton
                                onClick={downloadLogs}
                                disabled={downloading}
                                icon={<Download size={10} strokeWidth={2} style={downloading ? { animation: "lp-spin 0.8s linear infinite" } : undefined} />}
                            >
                                {downloading ? "DOWNLOADING..." : "DOWNLOAD"}
                            </PillButton>

                            <PillButton
                                onClick={downloadFiltered}
                                disabled={downloading}
                                icon={<FileOutput size={10} strokeWidth={2} />}
                            >
                                EXPORT
                            </PillButton>

                        </div>

                    )
                }

                {
                    mobileMode && (

                        <div style={{ position: "relative" }}>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowMenu(
                                        !showMenu
                                    )
                                }
                                style={pillButton}
                            >
                                <MoreVertical size={10} strokeWidth={2} />
                                MORE
                            </button>

                            {
                                showMenu && (

                                    <>
                                    {/* Outside-click backdrop — same pattern as
                                        DashboardLayout's mobile nav overlay. Sits
                                        behind the dropdown (lower z-index) and
                                        covers the full viewport, so any tap
                                        outside the menu closes it. */}
                                    <div
                                        aria-hidden="true"
                                        onClick={() => setShowMenu(false)}
                                        style={{
                                            position: "fixed",
                                            inset: 0,
                                            zIndex: 19,
                                            background: "transparent",
                                        }}
                                    />

                                    <div style={dropdownMenu}>

                                        <button
                                            style={menuButton}
                                            onClick={() => {

                                                setAutoRefresh(
                                                    !autoRefresh
                                                );

                                                setShowMenu(false);

                                            }}
                                        >
                                            {
                                                autoRefresh
                                                    ? <RadioTower size={10} strokeWidth={2} style={{ color: colors.success }} />
                                                    : <PauseCircle size={10} strokeWidth={2} />
                                            }
                                            {
                                                autoRefresh
                                                    ? "LIVE"
                                                    : "PAUSED"
                                            }
                                        </button>

                                        <button
                                            style={menuButton}
                                            onClick={() => {

                                                loadLogs();

                                                setShowMenu(false);

                                            }}
                                        >
                                            <RefreshCw size={10} strokeWidth={2} />
                                            REFRESH
                                        </button>

                                        <button
                                            style={menuButton}
                                            onClick={() => {

                                                downloadLogs();

                                                setShowMenu(false);

                                            }}
                                        >
                                            <Download size={10} strokeWidth={2} />
                                            DOWNLOAD
                                        </button>

                                        <button
                                            style={menuButton}
                                            onClick={() => {

                                                downloadFiltered();

                                                setShowMenu(false);

                                            }}
                                        >
                                            <FileOutput size={10} strokeWidth={2} />
                                            EXPORT
                                        </button>

                                    </div>
                                    </>

                                )
                            }

                        </div>

                    )
                }

            </div>

            {/* ── Filters ────────────────────────────────────────────── */}
            <div style={filtersRow}>
                {filterControls}
            </div>

            {/* ── Stat tiles ─────────────────────────────────────────── */}
            <div style={statsRow}>

                <StatTile
                    icon={<List size={13} strokeWidth={2} />}
                    label={
                        loading
                            ? "LOADING..."
                            : "ENTRIES LOADED"
                    }
                    value={logs.length}
                    tone={colors.brand}
                />

                <StatTile
                    icon={<AlertTriangle size={13} strokeWidth={2} />}
                    label="WARNINGS"
                    value={warningCount}
                    tone={colors.warning}
                />

                <StatTile
                    icon={<XCircle size={13} strokeWidth={2} />}
                    label="ERRORS"
                    value={errorCount}
                    tone={colors.danger}
                />

            </div>

            {/* ── Log stream ─────────────────────────────────────────── */}
            <div style={logWrapper}>
                <div
                    ref={logRef}
                    onScroll={handleScroll}
                    style={logContainer}
                >

                    {
                        logs.length === 0
                            ? (
                                <div style={emptyStyle}>
                                    No logs available.
                                </div>
                            )
                            : (
                                logs.map(
                                    (
                                        log,
                                        index,
                                    ) => {

                                        let style =
                                            logStyle;

                                        if (
                                            log.includes(
                                                "[ERROR]"
                                            )
                                        ) {

                                            style = {
                                                ...logStyle,
                                                color:
                                                    colors.danger,
                                            };
                                        }

                                        else if (
                                            log.includes(
                                                "[WARNING]"
                                            )
                                        ) {

                                            style = {
                                                ...logStyle,
                                                color:
                                                    colors.warning,
                                            };
                                        }

                                        else if (
                                            log.includes(
                                                "[INFO]"
                                            )
                                        ) {

                                            style = {
                                                ...logStyle,
                                                color:
                                                    colors.success,
                                            };
                                        }

                                        return (
                                            <div
                                                key={index}
                                                style={style}
                                            >
                                                {
                                                    search
                                                        ? log
                                                            .split(
                                                                new RegExp(
                                                                    `(${escapedSearch})`,
                                                                    "gi"
                                                                )
                                                            )
                                                            .map(
                                                                (
                                                                    part,
                                                                    i,
                                                                ) =>

                                                                    part.toLowerCase() ===
                                                                    search.toLowerCase()

                                                                    ? (
                                                                        <span
                                                                            key={i}
                                                                            style={{
                                                                                background:
                                                                                    colors.brandDim,
                                                                                color:
                                                                                    colors.brand,
                                                                                padding:
                                                                                    "0 2px",
                                                                                borderRadius:
                                                                                    "3px",
                                                                                fontWeight:
                                                                                    "600",
                                                                            }}
                                                                        >
                                                                            {part}
                                                                        </span>
                                                                    )

                                                                    : (
                                                                        <span key={i}>
                                                                            {part}
                                                                        </span>
                                                                    )
                                                            )

                                                        : log
                                                }
                                            </div>
                                        );
                                    }
                                )
                            )
                    }
                    </div>
                    {
                        !atBottom && (
                            <button
                                className="scroll-btn"
                                style={scrollButton}
                                onClick={jumpBottom}
                                title="Jump to bottom"
                                aria-label="Jump to bottom"
                            >
                                <ChevronDown size={14} strokeWidth={2} />
                            </button>
                        )
                    }
                </div>

        </section>

    );
}

// ── Style primitives ───────────────────────────────────────────────────
// Kept as plain objects/functions built from theme.js tokens, matching
// the convention used by GameManager / SessionHistory / SessionAnalytics.

const sectionStyle = {
    padding: "16px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    background: colors.bgCard,
};

const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
};

const headerLeft = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
};

const iconBadge = {
    width: "28px",
    height: "28px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brandDim,
    border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
    color: colors.brand,
    flexShrink: 0,
};

const titleStyle = {
    margin: 0,
    fontSize: "13px",
    letterSpacing: "0.12em",
    color: colors.ink,
    fontFamily: fonts.mono,
};

const countBadge = {
    fontSize: "9px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
    border: `1.5px solid ${colors.borderSubtle}`,
    borderRadius: "10px",
    padding: "1px 8px",
};

const actionsRow = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
};

const pillButton = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: `1.5px solid ${colors.border}`,
    background: colors.bgCard,
    color: colors.inkDim,
    borderRadius: `${radius.full}px`,
    padding: "6px 11px",
    fontSize: "9.5px",
    fontFamily: fonts.mono,
    letterSpacing: "0.08em",
    cursor: "pointer",
    transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
};

const activePillButton = (tone) => ({
    ...pillButton,
    color: tone,
    borderColor: tone,
    background: `${tone}24`,
});

const filtersRow = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
};

const selectStyle = {
    background: colors.bgInset,
    border: `1.5px solid ${colors.borderSubtle}`,
    color: colors.ink,
    padding: "8px 10px",
    borderRadius: `${radius.md}px`,
    fontSize: "11.5px",
    fontFamily: "inherit",
    outline: "none",
};

const searchWrap = {
    position: "relative",
    flex: 1,
    minWidth: "180px",
    display: "flex",
    alignItems: "center",
};

const searchIcon = {
    position: "absolute",
    left: "11px",
    color: colors.inkFaint,
    pointerEvents: "none",
};

const searchInputStyle = {
    ...selectStyle,
    width: "100%",
    padding: "8px 10px 8px 30px",
    boxSizing: "border-box",
};

const dropdownMenu = {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px",
    background: colors.bgCard,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
    zIndex: 20,
    minWidth: "160px",
    overflow: "hidden",
};

const menuButton = {
    ...pillButton,
    width: "100%",
    justifyContent: "flex-start",
    background: "transparent",
    border: `1.5px solid ${colors.borderSubtle}`,
};

const statsRow = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
};

const statTile = {
    padding: "12px",
    borderRadius: `${radius.md}px`,
    background: colors.bgCard,
    border: `1.5px solid ${colors.borderSubtle}`,
    display: "flex",
    alignItems: "center",
    gap: "12px",
};

const statIconWrap = (tone) => ({
    flexShrink: 0,
    width: "32px",
    height: "32px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `color-mix(in srgb, ${tone} 14%, transparent)`,
    border: `1.5px solid color-mix(in srgb, ${tone} 40%, transparent)`,
    color: tone,
    fontSize: "13px",
});

const statValue = {
    fontSize: "17px",
    fontWeight: 700,
    fontFamily: fonts.mono,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
};

const statLabel = {
    fontSize: "9px",
    color: colors.inkFaint,
    letterSpacing: "0.08em",
    fontFamily: fonts.mono,
    marginTop: "3px",
    textTransform: "uppercase",
};

const logWrapper = {
    position: "relative",
};

const logContainer = {
    position: "relative",
    background: colors.bgInset,
    border: `1.5px solid ${colors.borderSubtle}`,
    borderRadius: `${radius.md}px`,
    padding: "12px",
    minHeight: "200px",
    maxHeight: "min(600px, 65dvh)",
    overflowY: "auto",
    overflowX: "hidden",
};

const logStyle = {
    fontFamily: fonts.mono,
    fontSize: "12px",
    color: colors.inkDim,

    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",

    width: "100%",
    boxSizing: "border-box",

    marginBottom: "6px",
    borderBottom: `1px solid ${colors.borderSubtle}`,
    paddingBottom: "6px",
};

const emptyStyle = {
    color: colors.inkFaint,
    textAlign: "center",
    padding: "40px 20px",
    fontFamily: fonts.mono,
    fontSize: "11px",
    letterSpacing: "0.04em",
};

const scrollButton = {

    position: "absolute",

    left: "50%",

    bottom: "22px",

    transform: "translateX(-50%)",

    width: "38px",

    height: "38px",

    borderRadius: "50%",

    border:
        `1.5px solid ${colors.borderInk}`,

    background:
        colors.bgCard,

    color:
        colors.brand,

    cursor: "pointer",

    zIndex: 300,

    boxShadow:
        "0 8px 24px rgba(0,0,0,0.45)",

    transition:
        "all 0.2s ease",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",
};
