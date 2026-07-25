/**
 * components/SaveBrowser.jsx
 *
 * Same props (type, name, saves, loading, error, deleting, onTypeChange,
 * onNameChange, onDelete) and same hasSaves/options derivation as before —
 * only the presentation was reworked to match the FieldLabel + focus-glow
 * input pattern used by its parent, StartSessionForm.jsx. It already
 * renders inside that form's own `cardSection` (bordered card) under a
 * "Save Data" section heading, so the old nested box/title here was a
 * redundant "card inside a card" — dropped in favor of just the controls.
 */

import { FaLayerGroup, FaFileArchive, FaTrashAlt, FaExclamationTriangle, FaInbox } from "react-icons/fa";

const palette = {
    bg: "#080a0f",
    border: "#1c2130",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    danger: "#f43f5e",
    mono: "'JetBrains Mono', monospace",
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
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

function focusBorder(e) {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
}
function blurBorder(e) {
    e.target.style.borderColor = palette.border;
    e.target.style.boxShadow = "none";
}

function FieldLabel({ icon, children }) {
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "9.5px",
                color: palette.muted,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: palette.mono,
                marginBottom: "8px",
            }}
        >
            {icon}
            {children}
        </span>
    );
}

function HintLine({ icon, color, children }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "9px",
                fontSize: "10.5px",
                color,
                fontFamily: palette.mono,
            }}
        >
            {icon}
            {children}
        </div>
    );
}

export function SaveBrowser({
    type,
    name,
    saves,
    loading = false,
    error = "",
    deleting = false,
    onTypeChange,
    onNameChange,
    onDelete,
}) {
    const archives = saves?.archives || [];
    const backups = saves?.backups || [];

    const options =
        type === "archives"
            ? archives
            : type === "backups"
                ? backups
                : [];

    const hasSaves =
        saves?.latest_exists ||
        saves.archives.length > 0 ||
        saves.backups.length > 0;

    return (
        <div>
            {hasSaves && (
                <div>
                    <FieldLabel icon={<FaLayerGroup size={10} />}>Save Source</FieldLabel>
                    <select
                        style={inputStyle}
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                    >
                        {saves.latest_exists && <option value="latest">latest save</option>}
                        {archives.length > 0 && <option value="archives">archive</option>}
                        {backups.length > 0 && <option value="backups">backup</option>}
                    </select>
                </div>
            )}

            {loading && (
                <HintLine icon={<FaLayerGroup size={10} />} color={palette.faint}>
                    Loading saves…
                </HintLine>
            )}

            {error && (
                <HintLine icon={<FaExclamationTriangle size={10} />} color={palette.danger}>
                    {error}
                </HintLine>
            )}

            {!loading && !hasSaves && (
                <HintLine icon={<FaInbox size={10} />} color={palette.faint}>
                    No saves found for this user.
                </HintLine>
            )}

            {hasSaves && type !== "latest" && (
                <>
                    <div style={{ marginTop: "12px" }}>
                        <FieldLabel icon={<FaFileArchive size={10} />}>
                            Select {type === "archives" ? "Archive" : "Backup"}
                        </FieldLabel>
                        <select
                            style={inputStyle}
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                        >
                            <option value="">Select {type === "archives" ? "archive" : "backup"}</option>
                            {options.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    {name && (
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "7px",
                                width: "100%",
                                marginTop: "10px",
                                padding: "9px 10px",
                                background: "rgba(244,63,94,0.08)",
                                border: "1px solid rgba(244,63,94,0.35)",
                                borderRadius: "7px",
                                color: palette.danger,
                                fontSize: "10.5px",
                                fontFamily: palette.mono,
                                letterSpacing: "0.04em",
                                cursor: deleting ? "not-allowed" : "pointer",
                                opacity: deleting ? 0.6 : 1,
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(244,63,94,0.16)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(244,63,94,0.08)";
                            }}
                        >
                            <FaTrashAlt size={10} />
                            {deleting ? "Deleting…" : `Delete ${type === "archives" ? "archive" : "backup"}`}
                        </button>
                    )}
                </>
            )}

            {type !== "latest" && options.length === 0 && !loading && (
                <HintLine icon={<FaInbox size={10} />} color={palette.faint}>
                    No {type === "archives" ? "archives" : "backups"} found
                </HintLine>
            )}
        </div>
    );
}
