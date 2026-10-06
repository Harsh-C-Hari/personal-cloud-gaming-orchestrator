/**
 * components/SaveBrowser.jsx
 *
 * Save selector used by StartSessionForm.
 *
 * This component is responsible only for selecting the save source
 * and specific backup/archive to load when launching a session.
 * Save management/deletion is handled by the dedicated Save Library.
 */

import { Layers, Archive, AlertTriangle, Inbox } from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: colors.bgInset,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    color: colors.ink,
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    boxSizing: "border-box",
    // P6-T07 motion audit: 150ms does not exactly match any motion step
    // (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms).
    transition: "border-color 150ms ease",
};

// 3.3: Focus/blur border change handled by CSS .pcgo-input:focus in base.css.

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
    onTypeChange,
    onNameChange,
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
        archives.length > 0 ||
        backups.length > 0;

    return (
        <div>
            {hasSaves && (
                <div>
                    <FieldLabel icon={<Layers size={11} strokeWidth={2} />}>
                        Save Source
                    </FieldLabel>

                    <select
                        className="pcgo-input"
                        style={inputStyle}
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        aria-label="Save Source"
                    >
                        {saves.latest_exists && (
                            <option value="latest">latest save</option>
                        )}

                        {archives.length > 0 && (
                            <option value="archives">archive</option>
                        )}

                        {backups.length > 0 && (
                            <option value="backups">backup</option>
                        )}
                    </select>
                </div>
            )}

            {loading && (
                <HintLine
                    icon={<Layers size={11} strokeWidth={2} />}
                    color={colors.inkFaint}
                >
                    Loading saves…
                </HintLine>
            )}

            {error && (
                <HintLine
                    icon={<AlertTriangle size={11} strokeWidth={2} />}
                    color={colors.danger}
                >
                    {error}
                </HintLine>
            )}

            {!loading && !hasSaves && (
                <HintLine
                    icon={<Inbox size={11} strokeWidth={2} />}
                    color={colors.inkFaint}
                >
                    No saves found for this user.
                </HintLine>
            )}

            {hasSaves && type !== "latest" && (
                <div style={{ marginTop: "12px" }}>
                    <FieldLabel
                        icon={<Archive size={11} strokeWidth={2} />}
                    >
                        Select {type === "archives" ? "Archive" : "Backup"}
                    </FieldLabel>

                    <select
                        className="pcgo-input"
                        style={inputStyle}
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        aria-label={`Select ${
                            type === "archives" ? "Archive" : "Backup"
                        }`}
                    >
                        <option value="">
                            Select{" "}
                            {type === "archives" ? "archive" : "backup"}
                        </option>

                        {options.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {type !== "latest" &&
                options.length === 0 &&
                !loading && (
                    <HintLine
                        icon={<Inbox size={11} strokeWidth={2} />}
                        color={colors.inkFaint}
                    >
                        No{" "}
                        {type === "archives"
                            ? "archives"
                            : "backups"}{" "}
                        found
                    </HintLine>
                )}
        </div>
    );
}