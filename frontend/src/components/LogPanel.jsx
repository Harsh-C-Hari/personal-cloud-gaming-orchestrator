import { useEffect, useState, useRef } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  FileOutput,
  FileText,
  List,
  MoreVertical,
  PauseCircle,
  RadioTower,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { getLogs, getLogSessions, getApiUrl, clearToken } from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { colors, fonts, radius, shadow, surface } from "../dashboard/theme.js";

const focusBorder = (e) => { e.target.style.borderColor = colors.ink; };
const blurBorder = (e) => { e.target.style.borderColor = colors.borderSubtle; };

function getLogMeta(log) {
  if (log.includes("[ERROR]")) return { label: "ERROR", color: colors.danger, icon: <XCircle size={11} strokeWidth={2} />, key: "error" };
  if (log.includes("[WARNING]")) return { label: "WARNING", color: colors.warning, icon: <AlertTriangle size={11} strokeWidth={2} />, key: "warning" };
  if (log.includes("[INFO]")) return { label: "INFO", color: colors.success, icon: <FileText size={11} strokeWidth={2} />, key: "info" };
  return { label: "LOG", color: colors.inkDim, icon: <FileText size={11} strokeWidth={2} />, key: "neutral" };
}

function LoadingLogRows() {
  return (
    <div className="pcgo-logs__loading" role="status" aria-label="Loading logs">
      {[1, 2, 3, 4, 5].map((row) => (
        <div className="pcgo-logs__loading-row" key={row}>
          <span className="pcgo-logs__loading-severity" />
          <span className="pcgo-logs__loading-line" />
        </div>
      ))}
    </div>
  );
}

export function LogPanel() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [logError, setLogError] = useState("");
  const [level, setLevel] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [sessions, setSessions] = useState([]);
  const [warningCount, setWarningCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [search, setSearch] = useState("");
  const logRef = useRef(null);
  const atBottomRef = useRef(true);
  const userScrolledRef = useRef(false);
  const initializedRef = useRef(false);
  const [atBottom, setAtBottom] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [compactMode, setCompactMode] = useState(window.innerWidth < 900);
  const [mobileMode, setMobileMode] = useState(window.innerWidth < 650);

  const current_user = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";
  const hasActiveFilters = level !== "ALL" || sessionFilter !== "ALL" || Boolean(search.trim());

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await getLogs(
        level === "ALL" ? null : level,
        sessionFilter === "ALL" ? null : sessionFilter,
        search.trim() ? search : null,
      );
      setLogs(data.logs || []);
      setWarningCount(data.warnings || 0);
      setErrorCount(data.errors || 0);
      setLogError("");
      setHasLoaded(true);

      setTimeout(() => {
        if (!logRef.current) return;
        const container = logRef.current;
        if (!initializedRef.current) {
          container.scrollTop = container.scrollHeight - container.clientHeight;
          initializedRef.current = true;
          atBottomRef.current = true;
          setAtBottom(true);
          return;
        }
        if (autoRefresh && atBottomRef.current && userScrolledRef.current) {
          container.scrollTop = container.scrollHeight - container.clientHeight;
        }
      }, 50);
    } catch (err) {
      setLogError(err.message || "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions() {
    try {
      const data = await getLogSessions();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => { loadLogs(); loadSessions(); }, [level, sessionFilter, search]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => { loadLogs(); loadSessions(); }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, level, sessionFilter, search]);

  useEffect(() => {
    const style = document.createElement("style");
    // P6-T09 motion audit: `.scroll-btn`'s `animation: scrollBounce 2s
    // infinite;` below is keyframe-based (not `transition:`), same non-
    // convertible category as every other `animation:` audited in this
    // project so far. `motion`'s four steps are transition timing strings
    // ("<duration> <easing>"), not @keyframes names, so there is no
    // equivalent to alias to here regardless of the 2s duration. This is
    // a raw CSS-string template literal (not a JS inline-style object),
    // but the same `${...}` interpolation used for `colors.borderInk`
    // just below would work identically for a `motion` value if a genuine
    // match existed — it doesn't, so this is left as the original
    // literal; no conversion.
    style.innerHTML = `
      @keyframes lp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pcgo-log-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
      @keyframes scrollBounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(5px); } }
      .scroll-btn { animation: scrollBounce 2s infinite; }
      .scroll-btn:hover { transform: translateX(-50%) scale(1.08); border: 1.5px solid ${colors.borderInk}; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { initializedRef.current = false; }, [level, sessionFilter, search]);

  useEffect(() => {
    if (!showMenu) return undefined;
    function handleKeyDown(e) { if (e.key === "Escape") setShowMenu(false); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMenu]);

  useEffect(() => {
    function handleResize() {
      setCompactMode(window.innerWidth < 900);
      setMobileMode(window.innerWidth < 650);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function jumpBottom() {
    if (!logRef.current) return;
    logRef.current.scrollTo({ top: logRef.current.scrollHeight - logRef.current.clientHeight, behavior: "smooth" });
  }

  async function downloadLogs() {
    if (downloading) return;
    try {
      setDownloading(true);
      const endpoint = isAdmin ? "/admin/logs/download" : "/admin/my-logs/download";
      const response = await fetch(getApiUrl(endpoint), { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } });
      if (!response.ok) {
        if (response.status === 401) { clearToken(); window.location.href = "/login"; return; }
        toast.error("Failed to download logs.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = isAdmin ? "host_logs" : `${current_user}_logs`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function downloadFiltered() {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const parts = [];
    if (level !== "ALL") parts.push(level.toLowerCase());
    if (sessionFilter !== "ALL") parts.push(sessionFilter);
    if (search.trim()) parts.push(search.replaceAll(" ", "_").replace(/[^a-zA-Z0-9_-]/g, ""));
    if (parts.length === 0) parts.push(isAdmin ? "host_logs" : `${current_user}_logs`);
    link.download = `${parts.join("_")}.log`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleScroll() {
    if (!logRef.current) return;
    const container = logRef.current;
    const bottom = container.scrollHeight - container.scrollTop - container.clientHeight < 8;
    setAtBottom(bottom);
    atBottomRef.current = bottom;
    userScrolledRef.current = true;
  }

  const escapedSearch = (search || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function PillButton({ active, tone, onClick, icon, children, disabled, ariaLabel }) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        style={{ ...(active ? activePillButton(tone) : pillButton), ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : null) }}
        onMouseEnter={(e) => {
          if (active || disabled) return;
          e.currentTarget.style.background = "rgba(237,235,227,0.08)";
          e.currentTarget.style.color = colors.ink;
          e.currentTarget.style.borderColor = colors.borderStrong;
        }}
        onMouseLeave={(e) => {
          if (active || disabled) return;
          e.currentTarget.style.background = surface.l2;
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
        <div style={statIconWrap(tone)}>{icon}</div>
        <div style={{ minWidth: 0 }}><div style={{ ...statValue, color: tone }}>{value}</div><div style={statLabel}>{label}</div></div>
      </div>
    );
  }

  const filterControls = (
    <>
      <select aria-label="Filter logs by severity" value={level} onChange={(e) => setLevel(e.target.value)} style={selectStyle} onFocus={focusBorder} onBlur={blurBorder}>
        <option value="ALL">ALL LEVELS</option>
        <option value="INFO">INFO</option>
        <option value="WARNING">WARNING</option>
        <option value="ERROR">ERROR</option>
      </select>
      <select aria-label="Filter logs by session" value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} style={selectStyle} onFocus={focusBorder} onBlur={blurBorder}>
        <option value="ALL">ALL SESSIONS</option>
        {sessions.map((session) => <option key={session} value={session}>{session}</option>)}
      </select>
      <div style={searchWrap}>
        <Search size={11} strokeWidth={2} style={searchIcon} />
        <input aria-label="Search logs" placeholder="Search logs..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={searchInputStyle} onFocus={focusBorder} onBlur={blurBorder} />
      </div>
    </>
  );

  const actions = (
    <div style={actionsRow}>
      <PillButton active={autoRefresh} tone={colors.success} ariaLabel={autoRefresh ? "Pause automatic log refresh" : "Enable automatic log refresh"} onClick={() => setAutoRefresh(!autoRefresh)} icon={autoRefresh ? <RadioTower size={10} strokeWidth={2} /> : <PauseCircle size={10} strokeWidth={2} />}>
        {autoRefresh ? "AUTO-REFRESH" : "PAUSED"}
      </PillButton>
      <PillButton
        ariaLabel={loading ? "Refreshing logs" : "Refresh logs"}
        onClick={loadLogs}
        disabled={loading}
        icon={
          <RefreshCw
            size={10}
            strokeWidth={2}
            style={
              loading
                ? {
                    // P6-T09 motion audit: keyframe-based `animation:` (not
                    // `transition:`), same non-convertible category as
                    // SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08).
                    // `motion`'s four steps are transition timing strings
                    // ("<duration> <easing>"), not @keyframes names, so
                    // there is no equivalent to alias to here regardless
                    // of the 0.8s duration. Left as the original literal;
                    // no conversion.
                    animation: "lp-spin 0.8s linear infinite",
                  }
                : undefined
            }
          />
        }
      >
        {loading ? "REFRESHING..." : "REFRESH"}
      </PillButton>
      <PillButton
        ariaLabel={downloading ? "Downloading logs" : "Download logs"}
        onClick={downloadLogs}
        disabled={downloading}
        icon={
          <Download
            size={10}
            strokeWidth={2}
            style={
              downloading
                ? {
                    // P6-T09 motion audit: same `lp-spin 0.8s` keyframe as
                    // the refresh icon above — this is a second, separate
                    // JSX element, so it gets its own comment rather than
                    // relying on the one above. Keyframe-based, non-
                    // convertible for the same reason (no `motion` step is
                    // an @keyframes name). Left as the original literal;
                    // no conversion.
                    animation: "lp-spin 0.8s linear infinite",
                  }
                : undefined
            }
          />
        }
      >
        {downloading ? "DOWNLOADING..." : "DOWNLOAD"}
      </PillButton>
      <PillButton ariaLabel="Export the currently filtered logs" onClick={downloadFiltered} disabled={downloading} icon={<FileOutput size={10} strokeWidth={2} />}>EXPORT</PillButton>
    </div>
  );

  return (
    <section className="pcgo-logs" style={sectionStyle} aria-labelledby="logs-title">
      <div style={headerRow}>
        <div style={headerLeft}>
          <div style={iconBadge}><FileText size={12} strokeWidth={2} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="pcgo-logs__eyebrow">OPERATIONAL EVIDENCE</div>
            <h2 id="logs-title" style={titleStyle}>HOST LOGS</h2>
          </div>
          <span style={countBadge}>{logs.length} VISIBLE</span>
        </div>
        {!compactMode && actions}
        {compactMode && !mobileMode && actions}
        {mobileMode && (
          <div style={{ position: "relative" }}>
            <button type="button" aria-label="Open log actions" aria-expanded={showMenu} onClick={() => setShowMenu(!showMenu)} style={pillButton}><MoreVertical size={10} strokeWidth={2} /> MORE</button>
            {showMenu && (
              <>
                <div aria-hidden="true" onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 19, background: "transparent" }} />
                <div style={dropdownMenu} role="menu">
                  <button type="button" style={menuButton} onClick={() => { setAutoRefresh(!autoRefresh); setShowMenu(false); }}>{autoRefresh ? <RadioTower size={10} strokeWidth={2} style={{ color: colors.success }} /> : <PauseCircle size={10} strokeWidth={2} />}{autoRefresh ? "AUTO-REFRESH" : "PAUSED"}</button>
                  <button type="button" style={menuButton} onClick={() => { loadLogs(); setShowMenu(false); }}><RefreshCw size={10} strokeWidth={2} /> REFRESH</button>
                  <button type="button" style={menuButton} onClick={() => { downloadLogs(); setShowMenu(false); }}><Download size={10} strokeWidth={2} /> DOWNLOAD</button>
                  <button type="button" style={menuButton} onClick={() => { downloadFiltered(); setShowMenu(false); }}><FileOutput size={10} strokeWidth={2} /> EXPORT</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="pcgo-logs__scope-note"><FileText size={11} strokeWidth={2} />{isAdmin ? "Host log window · filters are applied by the backend" : "Authorized session log window · filters are applied by the backend"}</div>
      <div className="pcgo-logs__filters" style={filtersRow}>{filterControls}</div>

      <div className="pcgo-logs__stats" style={statsRow} aria-label="Visible log summary">
        <StatTile icon={<List size={13} strokeWidth={2} />} label={loading ? "LOADING..." : "ENTRIES LOADED"} value={logs.length} tone={colors.brand} />
        <StatTile icon={<AlertTriangle size={13} strokeWidth={2} />} label="WINDOW WARNINGS" value={warningCount} tone={colors.warning} />
        <StatTile icon={<XCircle size={13} strokeWidth={2} />} label="WINDOW ERRORS" value={errorCount} tone={colors.danger} />
      </div>

      {loading && hasLoaded && <div className="pcgo-logs__refresh-note" role="status">Refreshing the filtered log window… existing evidence remains visible.</div>}
      {logError && <div className="pcgo-logs__error" role="alert"><XCircle size={12} strokeWidth={2} /><span>{logError}</span></div>}

      <div style={logWrapper}>
        <div ref={logRef} onScroll={handleScroll} style={logContainer} role="log" aria-label="Host log stream" aria-busy={loading}>
          {loading && !hasLoaded ? <LoadingLogRows /> : logError && !hasLoaded ? (
            <div style={emptyStyle} className="pcgo-logs__empty"><XCircle size={18} strokeWidth={1.5} /><strong>Log data unavailable.</strong><span>Retry the request to inspect the operational evidence.</span></div>
          ) : logs.length === 0 ? (
            <div style={emptyStyle} className="pcgo-logs__empty"><FileText size={18} strokeWidth={1.5} /><strong>{hasActiveFilters ? "No logs match the current filters." : "No log data is available."}</strong><span>{hasActiveFilters ? "Clear or adjust the filters to inspect another returned log window." : "The log service returned no records in the available window."}</span></div>
          ) : (
            logs.map((log, index) => {
              const meta = getLogMeta(log);
              return (
                <div key={`${index}-${log}`} className={`pcgo-logs__entry pcgo-logs__entry--${meta.key}`} style={{ ...logStyle, borderLeftColor: meta.color }} title={log}>
                  <div className="pcgo-logs__entry-meta" style={{ color: meta.color }}>{meta.icon}<span>{meta.label}</span></div>
                  <div className="pcgo-logs__entry-message">
                    {search ? log.split(new RegExp(`(${escapedSearch})`, "gi")).map((part, i) => part.toLowerCase() === search.toLowerCase() ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>) : log}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {!atBottom && <button className="scroll-btn" style={scrollButton} onClick={jumpBottom} title="Jump to bottom" aria-label="Jump to newest log entry"><ChevronDown size={14} strokeWidth={2} /></button>}
      </div>
    </section>
  );
}

/**
 * P5-T03 token migration notes.
 *
 * Backgrounds: every `colors.bg*` reference below (bgCard/bgElevated/
 * bgInset) has been swapped for its `surface.l*` alias per D-009 — same
 * CSS custom property, same value, zero visual change.
 *
 * Typography: this page's dense, mono-heavy "operational evidence"
 * character (D-008) uses a set of small, odd sizes (8px-16px) that were
 * tuned specifically for a real-time log stream, not the editorial
 * `typeScale` steps (which start at `bodySmall`'s 12px and are built on
 * Space Grotesk/Inter, not JetBrains Mono for anything below `meta`).
 * Checked every inline font group against `typeScale` and left all of
 * them as documented literals rather than force-fitting a mismatch,
 * per D-005 ("only convert what cleanly matches... document and leave
 * literal anything that doesn't"):
 * - `titleStyle` (13px/mono/0.12em, h2 default-bold): closest candidate
 *   to `typeScale.meta` (10px/700/0.12em/uppercase/mono) — letter-spacing
 *   and font-family already match, and the h2's browser-default weight
 *   likely already renders at meta's 700. But forcing the 13px title
 *   down to meta's 10px would be a real ~23% visible size cut to the
 *   page's `<h2>`, not a zero-visual alias — left literal.
 * - `countBadge` (9px), `pillButton`/`menuButton` (9.5px/0.08em, no
 *   explicit weight): the action-pill/badge typography is a size step
 *   below `meta` with a different letter-spacing and no forced weight —
 *   left literal. (Their text content is all static uppercase strings,
 *   so unlike SessionCard/StartSessionForm's dynamic labels, forcing
 *   `textTransform: uppercase` here would be harmless, but the
 *   size/letter-spacing/weight mismatch is the actual blocker.)
 * - `selectStyle`/`searchInputStyle` (11.5px, `fontFamily: "inherit"`):
 *   the explicit `"inherit"` (rather than any `fonts.*` value) reads as
 *   a deliberate choice to match the surrounding form context, not an
 *   oversight — left literal.
 * - `statValue` (16px/700/mono) and `statLabel` (8.5px/0.08em/mono/
 *   uppercase): both sit between `typeScale` steps with no clean match
 *   on size+letter-spacing — left literal.
 * - `logStyle` (11px/mono, the log-line/timestamp text) and `emptyStyle`
 *   (11px/mono/0.02em): `logStyle` in particular renders raw,
 *   case-sensitive backend log content — forcing any uppercase-bearing
 *   step onto it would corrupt the evidence itself, independent of the
 *   size mismatch — left literal.
 * All of the above keep their exact pre-existing literal values;
 * nothing here changes visually.
 */
const sectionStyle = { padding: "16px", border: `1px solid ${colors.border}`, borderRadius: `${radius.lg}px`, background: surface.l3 };
const headerRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "12px" };
const headerLeft = { display: "flex", alignItems: "center", gap: "9px", minWidth: 0 };
const iconBadge = { width: "28px", height: "28px", borderRadius: `${radius.sm}px`, display: "flex", alignItems: "center", justifyContent: "center", background: colors.brandDim, border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`, color: colors.brand, flexShrink: 0 };
const titleStyle = { margin: 0, fontSize: "13px", letterSpacing: "0.12em", color: colors.ink, fontFamily: fonts.mono };
const countBadge = { fontSize: "9px", color: colors.inkFaint, fontFamily: fonts.mono, border: `1.5px solid ${colors.borderSubtle}`, borderRadius: "10px", padding: "3px 8px", whiteSpace: "nowrap" };
const actionsRow = { display: "flex", gap: "8px", flexWrap: "wrap" };
// P6-T09 motion audit: `pillButton`'s `transition:` below shares one
// 150ms/`ease` duration+easing across all three properties, but 150ms
// doesn't exactly match any `motion` step (fast: 100ms, base: 160ms,
// cardIn: 220ms, pill: 180ms cubic-bezier). Left as the original literal;
// no conversion.
const pillButton = { display: "inline-flex", alignItems: "center", gap: "6px", border: `1px solid ${colors.border}`, background: surface.l2, color: colors.inkDim, borderRadius: `${radius.sm}px`, padding: "6px 11px", fontSize: "9.5px", fontFamily: fonts.mono, letterSpacing: "0.08em", cursor: "pointer", transition: "background 150ms ease, color 150ms ease, border-color 150ms ease" };
const activePillButton = (tone) => ({ ...pillButton, color: tone, borderColor: tone, background: `${tone}24` });
const filtersRow = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" };
const selectStyle = { background: surface.l1, border: `1px solid ${colors.borderSubtle}`, color: colors.ink, padding: "9px 10px", borderRadius: `${radius.sm}px`, fontSize: "11.5px", fontFamily: "inherit" };
const searchWrap = { position: "relative", flex: 1, minWidth: "180px", display: "flex", alignItems: "center" };
const searchIcon = { position: "absolute", left: "11px", color: colors.inkFaint, pointerEvents: "none" };
const searchInputStyle = { ...selectStyle, width: "100%", padding: "8px 10px 8px 30px", boxSizing: "border-box" };
const dropdownMenu = { position: "absolute", top: "calc(100% + 6px)", right: 0, display: "flex", flexDirection: "column", gap: "6px", padding: "8px", background: surface.l3, border: `1px solid ${colors.border}`, borderRadius: `${radius.md}px`, boxShadow: shadow.overlay, zIndex: 20, minWidth: "180px", overflow: "hidden" };
const menuButton = { ...pillButton, width: "100%", justifyContent: "flex-start", background: "transparent", border: `1.5px solid ${colors.borderSubtle}` };
const statsRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", marginBottom: "12px" };
const statTile = { padding: "10px 12px", borderRadius: `${radius.md}px`, background: surface.l1, border: `1px solid ${colors.borderSubtle}`, display: "flex", alignItems: "center", gap: "10px" };
const statIconWrap = (tone) => ({ flexShrink: 0, width: "30px", height: "30px", borderRadius: `${radius.sm}px`, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${tone} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)`, color: tone, fontSize: "13px" });
const statValue = { fontSize: "16px", fontWeight: 700, fontFamily: fonts.mono, lineHeight: 1.1, whiteSpace: "nowrap" };
const statLabel = { fontSize: "8.5px", color: colors.inkFaint, letterSpacing: "0.08em", fontFamily: fonts.mono, marginTop: "3px", textTransform: "uppercase" };
const logWrapper = { position: "relative" };
const logContainer = { position: "relative", background: surface.l1, border: `1px solid ${colors.borderSubtle}`, borderRadius: `${radius.md}px`, padding: "10px", minHeight: "200px", maxHeight: "min(600px, 65dvh)", overflowY: "auto", overflowX: "hidden" };
const logStyle = { display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", alignItems: "start", gap: "10px", fontFamily: fonts.mono, fontSize: "11px", color: colors.inkDim, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word", width: "100%", boxSizing: "border-box", marginBottom: "5px", borderBottom: `1px solid ${colors.borderSubtle}`, borderLeft: `2px solid ${colors.inkDim}`, padding: "7px 7px 7px 9px" };
const emptyStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: colors.inkFaint, textAlign: "center", padding: "40px 20px", fontFamily: fonts.mono, fontSize: "11px", letterSpacing: "0.02em" };
// P6-T09 motion audit: `scrollButton`'s `transition:` below uses the
// `all` shorthand rather than naming specific properties (so it also
// transitions e.g. `box-shadow` on this style object) — a different
// semantic from a named-property transition, but that doesn't change the
// conclusion here: 200ms doesn't exactly match any `motion` step (fast:
// 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as
// the original literal; no conversion.
const scrollButton = { position: "absolute", left: "50%", bottom: "22px", transform: "translateX(-50%)", width: "38px", height: "38px", borderRadius: "50%", border: `1px solid ${colors.borderInk}`, background: surface.l3, color: colors.brand, cursor: "pointer", zIndex: 300, boxShadow: shadow.small, transition: "all 0.2s ease", display: "flex", justifyContent: "center", alignItems: "center" };
