import {
    useEffect,
    useState,
    useRef,
} from "react";

import {
    getLogs,
    getLogSessions,
    getApiUrl,
} from "../api/client";

export function LogPanel() {

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

                box-shadow:
                    0 10px 40px
                    rgba(56,189,248,0.25);

                border:
                    1px solid
                    rgba(56,189,248,0.4);
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
            alert("Failed to download logs.");
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
    
    return (

        <div style={panelStyle}>

            <div style={headerStyle}>

                <h2 style={titleStyle}>
                    Host Logs
                </h2>

                <div style={controlsContainer}>

                    {/* ================= LARGE ================= */}

                    {
                        !compactMode && (

                            <div style={controlsRow}>

                                <select
                                    value={level}
                                    onChange={(e) =>
                                        setLevel(e.target.value)
                                    }
                                    style={selectStyle}
                                >
                                    <option value="ALL">ALL</option>
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

                                <input
                                    placeholder="Search..."
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(
                                            e.target.value
                                        )
                                    }
                                    style={searchStyle}
                                />

                                <button
                                    style={
                                        autoRefresh
                                            ? activeButton
                                            : buttonStyle
                                    }
                                    onClick={() =>
                                        setAutoRefresh(
                                            !autoRefresh
                                        )
                                    }
                                >
                                    {
                                        autoRefresh
                                            ? "LIVE"
                                            : "PAUSED"
                                    }
                                </button>

                                <button
                                    style={buttonStyle}
                                    onClick={loadLogs}
                                >
                                    REFRESH
                                </button>

                                <button
                                    style={buttonStyle}
                                    onClick={downloadLogs}
                                >
                                    DOWNLOAD
                                </button>

                                <button
                                    style={buttonStyle}
                                    onClick={
                                        downloadFiltered
                                    }
                                >
                                    EXPORT
                                </button>

                            </div>

                        )
                    }

                    {/* ================= MEDIUM ================= */}

                    {
                        compactMode &&
                        !mobileMode && (

                            <>

                                <div style={controlsRow}>

                                    <select
                                        value={level}
                                        onChange={(e) =>
                                            setLevel(
                                                e.target.value
                                            )
                                        }
                                        style={selectStyle}
                                    >
                                        <option value="ALL">ALL</option>
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

                                    <input
                                        placeholder="Search..."
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(
                                                e.target.value
                                            )
                                        }
                                        style={selectStyle}
                                    />

                                </div>

                                <div style={controlsRow}>

                                    <button
                                        style={
                                            autoRefresh
                                                ? activeButton
                                                : buttonStyle
                                        }
                                        onClick={() =>
                                            setAutoRefresh(
                                                !autoRefresh
                                            )
                                        }
                                    >
                                        {
                                            autoRefresh
                                                ? "LIVE"
                                                : "PAUSED"
                                        }
                                    </button>

                                    <button
                                        style={buttonStyle}
                                        onClick={loadLogs}
                                    >
                                        REFRESH
                                    </button>

                                    <button
                                        style={buttonStyle}
                                        onClick={downloadLogs}
                                    >
                                        DOWNLOAD
                                    </button>

                                    <button
                                        style={buttonStyle}
                                        onClick={
                                            downloadFiltered
                                        }
                                    >
                                        EXPORT
                                    </button>

                                </div>

                            </>

                        )
                    }

                    {/* ================= MOBILE ================= */}

                    {
                        mobileMode && (

                            <>

                                <div style={controlsRow}>

                                    <select
                                        value={level}
                                        onChange={(e) =>
                                            setLevel(
                                                e.target.value
                                            )
                                        }
                                        style={selectStyle}
                                    >
                                        <option value="ALL">ALL</option>
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

                                    <input
                                        placeholder="Search..."
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(
                                                e.target.value
                                            )
                                        }
                                        style={selectStyle}
                                    />

                                    <button
                                        style={buttonStyle}
                                        onClick={() =>
                                            setShowMenu(
                                                !showMenu
                                            )
                                        }
                                    >
                                        ⋮ More
                                    </button>

                                </div>

                                {
                                    showMenu && (

                                        <div style={menuStyle}>

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
                                                REFRESH
                                            </button>

                                            <button
                                                style={buttonStyle}
                                                onClick={downloadLogs}
                                            >
                                                DOWNLOAD
                                            </button>

                                            <button
                                                style={menuButton}
                                                onClick={() => {

                                                    downloadFiltered();

                                                    setShowMenu(false);

                                                }}
                                            >
                                                EXPORT
                                            </button>

                                        </div>

                                    )
                                }

                            </>

                        )
                    }

                </div>

            </div>

            <div style={statusStyle}>

                {loading
                    ? "Loading logs..."
                    : `${logs.length} entries loaded`}

                {" • "}

                Warnings:
                {" "}
                {warningCount}

                {" • "}

                Errors:
                {" "}
                {errorCount}

            </div>

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
                                                    "#ef4444",
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
                                                    "#f59e0b",
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
                                                    "#10d98a",
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
                                                                                    "rgba(56,189,248,0.25)",
                                                                                color:
                                                                                    "#38bdf8",
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
                            >
                                ↓
                            </button>
                        )
                    }
                </div>

        </div>

    );
}

const panelStyle = {
    marginTop: "14px",
    padding: "16px",
    background: "#080a0f",
    border: "1px solid #1c2130",
    borderRadius: "8px",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
};

const titleStyle = {
    margin: 0,
};

const controlsContainer = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
};

const controlsRow = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
};

const buttonStyle = {
    padding: "8px 14px",
    background: "transparent",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const menuStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",

    padding: "8px",

    background: "#05070b",

    border: "1px solid #1c2130",

    borderRadius: "8px",
};

const menuButton = {
    ...buttonStyle,

    width: "100%",

    textAlign: "left",
};

const selectStyle = {
    background: "#05070b",
    border: "1px solid #1c2130",
    color: "#e2e8f0",
    padding: "8px",
    borderRadius: "6px",
};

const searchStyle = {
    ...selectStyle,
    flex: 1,
    minWidth: "180px",
};

const activeButton = {
    ...buttonStyle,
    background:
        "rgba(56,189,248,0.1)",
};

const statusStyle = {
    marginBottom: "12px",
    color: "#94a3b8",
    fontSize: "12px",
};

const logContainer = {
    position: "relative",
    background: "#05070b",
    border: "1px solid #1c2130",
    borderRadius: "8px",
    padding: "12px",
    height: "600px",
    overflowY: "auto",
    overflowX: "hidden",
};

const logStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "12px",

    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",

    width: "100%",
    boxSizing: "border-box",

    marginBottom: "6px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    paddingBottom: "6px",
};

const emptyStyle = {
    color: "#64748b",
    textAlign: "center",
    padding: "20px",
};

const logWrapper = {
    position: "relative",
};

const scrollButton = {

    position: "absolute",

    left: "50%",

    bottom: "22px",

    transform: "translateX(-50%)",

    width: "40px",

    height: "40px",

    borderRadius: "50%",

    border:
        "1px solid rgba(255,255,255,0.08)",

    background:
        "rgba(15,15,20,0.55)",

    backdropFilter:
        "blur(1.5px)",

    WebkitBackdropFilter:
        "blur(1.5px)",

    color:
        "rgba(255,255,255,0.75)",

    fontSize: "20px",

    fontWeight: "300",

    cursor: "pointer",

    zIndex: 300,

    boxShadow:
        "0 8px 30px rgba(0,0,0,0.4)",

    transition:
        "all 0.2s ease",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",
};