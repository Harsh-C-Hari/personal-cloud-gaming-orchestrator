/**
 * components/SaveBrowser.jsx
 *
 * Same props (type, name, saves, loading, error, deleting, onTypeChange,
 * onNameChange, onDelete) and same hasSaves/options derivation as before —
 * only the presentation was reworked to match the FieldLabel + focus-ring
 * input pattern used by its parent, StartSessionForm.jsx. It already
 * renders inside that form's own bordered card under a "Save Data" section
 * heading, so the old nested box/title here was a redundant "card inside a
 * card" — dropped in favor of just the controls.
 */

import { Layers, Archive, Trash2, AlertTriangle, Inbox } from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: colors.bgInset,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    color: colors.ink,
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    // P6-T07 motion audit: 150ms does not exactly match any motion step
    // (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms) — a
    // duration-only coincidence would not be enough anyway, but there's
    // no exact match here at all. Left as the original literal.
    transition: "border-color 150ms ease",
};

function focusBorder(e) {
    e.target.style.borderColor = colors.ink;
}
function blurBorder(e) {
    e.target.style.borderColor = colors.border;
}

function FieldLabel({ icon, children }) {
    return (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "9.5px",
                color: colors.inkFaint,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: fonts.mono,
                fontWeight: 700,
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
                fontFamily: fonts.mono,
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
                    <FieldLabel icon={<Layers size={11} strokeWidth={2} />}>Save Source</FieldLabel>
                    <select
                        style={inputStyle}
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        aria-label="Save Source"
                    >
                        {saves.latest_exists && <option value="latest">latest save</option>}
                        {archives.length > 0 && <option value="archives">archive</option>}
                        {backups.length > 0 && <option value="backups">backup</option>}
                    </select>
                </div>
            )}

            {loading && (
                <HintLine icon={<Layers size={11} strokeWidth={2} />} color={colors.inkFaint}>
                    Loading saves…
                </HintLine>
            )}

            {error && (
                <HintLine icon={<AlertTriangle size={11} strokeWidth={2} />} color={colors.danger}>
                    {error}
                </HintLine>
            )}

            {!loading && !hasSaves && (
                <HintLine icon={<Inbox size={11} strokeWidth={2} />} color={colors.inkFaint}>
                    No saves found for this user.
                </HintLine>
            )}

            {hasSaves && type !== "latest" && (
                <>
                    <div style={{ marginTop: "12px" }}>
                        <FieldLabel icon={<Archive size={11} strokeWidth={2} />}>
                            Select {type === "archives" ? "Archive" : "Backup"}
                        </FieldLabel>
                        <select
                            style={inputStyle}
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            aria-label={`Select ${type === "archives" ? "Archive" : "Backup"}`}
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
                                background: "transparent",
                                border: `1.5px solid ${colors.danger}`,
                                borderRadius: `${radius.full}px`,
                                color: colors.danger,
                                fontSize: "10.5px",
                                fontFamily: fonts.mono,
                                letterSpacing: "0.04em",
                                cursor: deleting ? "not-allowed" : "pointer",
                                opacity: deleting ? 0.6 : 1,
                                // P6-T07 motion audit: 150ms does not exactly match any
                                // motion step (fast: 100ms, base: 160ms, cardIn: 220ms,
                                // pill: 180ms). Left as the original literal.
                                transition: "background 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                                if (!deleting) e.currentTarget.style.background = "rgba(255,107,107,0.1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <Trash2 size={11} strokeWidth={2} />
                            {deleting ? "Deleting…" : `Delete ${type === "archives" ? "archive" : "backup"}`}
                        </button>
                    )}
                </>
            )}

            {type !== "latest" && options.length === 0 && !loading && (
                <HintLine icon={<Inbox size={11} strokeWidth={2} />} color={colors.inkFaint}>
                    No {type === "archives" ? "archives" : "backups"} found
                </HintLine>
            )}
        </div>
    );
}
