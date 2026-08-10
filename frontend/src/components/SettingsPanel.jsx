/**
 * components/SettingsPanel.jsx
 *
 * Same API calls / validation / state as before (getConfig, updateConfig,
 * selectFile, per-section save payloads, restart-required detection) —
 * only the presentation layer was reworked to match DESIGN_SYSTEM.md:
 *   - Section cards now use the shared `Card` primitive instead of a
 *     hand-rolled bordered div.
 *   - Save / Cancel use the shared `Button` primitive (flat, no gradient,
 *     no glow) instead of a custom cyan-gradient button.
 *   - The "READ ONLY" marker uses the shared `Chip` primitive.
 *   - Inputs/selects use `bgInset` fill + flat border-color focus (no glow
 *     ring), per DESIGN_SYSTEM.md §5.
 *   - Icons migrated from `react-icons/fa` to `lucide-react`, per
 *     DESIGN_SYSTEM.md §7.
 *   - All colors/fonts/radius now come from `dashboard/theme.js` — the old
 *     local `palette` (cyan accent, Rajdhani display font) is gone.
 *
 * No functional change: every handler, state variable, validation rule,
 * and API call below is untouched from the previous implementation.
 */

import { useEffect, useState } from "react";
import {
    FileInput,
    Cloud,
    Network,
    Clock,
    ClipboardList,
    Server,
    Database,
    Tags,
    XCircle,
    AlertTriangle,
    Save,
    RotateCcw,
    ChevronDown,
    Lock,
} from "lucide-react";
import {
    getConfig,
    updateConfig,
    selectFile,
} from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { Card, Button, Chip, Spinner } from "./ui/primitives.jsx";
import { colors, fonts, radius } from "../dashboard/theme.js";

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: colors.bgInset,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    color: colors.ink,
    fontSize: "13px",
    fontFamily: fonts.body,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 150ms ease",
};

const readOnlyStyle = {
    ...inputStyle,
    color: colors.inkFaint,
    cursor: "not-allowed",
    background: colors.bgElevated,
};

const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
};
const blurBorder = (e) => {
    e.target.style.borderColor = colors.border;
};

function SectionHeader({ icon, title, readOnly }) {
    return (
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
                    border: `1.5px solid ${colors.brand}`,
                    color: colors.brand,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <h3
                style={{
                    margin: 0,
                    fontSize: "13px",
                    letterSpacing: "0.12em",
                    color: colors.ink,
                    fontFamily: fonts.mono,
                    textTransform: "uppercase",
                }}
            >
                {title}
            </h3>
            {readOnly && (
                <Chip tone="neutral" icon={<Lock size={9} strokeWidth={2} />} style={{ marginLeft: "2px" }}>
                    Read Only
                </Chip>
            )}
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

function FieldGroup({ children }) {
    return (
        <div className="pcgo-2col" style={{ gap: "0 14px" }}>
            {children}
        </div>
    );
}

function SelectWrap({ children }) {
    return (
        <div style={{ position: "relative" }}>
            {children}
            <ChevronDown
                size={10}
                style={{
                    position: "absolute",
                    right: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.inkFaint,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
}

function ToggleSwitch({ checked, onChange, label }) {
    return (
        <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={() => onChange(!checked)}
            onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") onChange(!checked);
            }}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                userSelect: "none",
                marginTop: "14px",
                padding: "8px 0",
                minHeight: "44px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: `${radius.full}px`,
                    background: checked ? colors.brandDim : colors.bgInset,
                    border: `1.5px solid ${checked ? colors.brand : colors.border}`,
                    position: "relative",
                    transition: "background 150ms ease, border-color 150ms ease",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "2px",
                        left: checked ? "16px" : "2px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: checked ? colors.brand : colors.inkGhost,
                        transition: "left 150ms ease, background 150ms ease",
                    }}
                />
            </div>
            <span style={{ fontSize: "12px", color: colors.inkDim, fontFamily: fonts.mono }}>{label}</span>
        </div>
    );
}

export function SettingsPanel() {

    const toast = useToast();
    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    useEffect(() => {
        loadConfig();
    }, []);

    function getValue(field) {
        return field?.value;
    }

    function requiresRestartChanged(
        section,
        key,
    ) {

        if (
            !config ||
            !originalConfig
        ) {
            return false;
        }

        return (
            config[section][key]
                .requires_restart &&
            config[section][key].value !==
            originalConfig[section][key].value
        );
    }

    const restartRequired =
        config &&
        originalConfig &&
        (
            requiresRestartChanged(
                "host_agent",
                "environment"
            ) ||
            requiresRestartChanged(
                "host_agent",
                "debug"
            ) ||
            requiresRestartChanged(
                "storage",
                "backup_retention"
            ) ||
            requiresRestartChanged(
                "storage",
                "archive_retention"
            ) ||
            requiresRestartChanged(
                "storage",
                "enable_archives"
            ) ||
            requiresRestartChanged(
                "storage",
                "enable_integrity_hashing"
            ) ||
            requiresRestartChanged(
                "logging",
                "console_logging"
            )
        );

    async function loadConfig() {

        try {

            const data =
                await getConfig();

            setConfig(data);

            setOriginalConfig(
                JSON.parse(
                    JSON.stringify(data)
                )
            );

        } catch {

            toast.error(
                "Failed to load settings."
            );
        }
    }

    async function updateSection(
        section,
        data,
    ) {
        await updateConfig(
            section,
            data,
        );
    }

    async function saveSettings() {

        setValidationErrors([]);
        const errors = validateSettings();

        setValidationErrors(errors);

        if (errors.length > 0) {
            return;
        }

        setSaving(true);

        try {

            await updateSection(
                "sunshine",
                {
                    api_url:
                        config.sunshine.api_url.value,

                    username:
                        config.sunshine.username.value,

                    password:
                        config.sunshine.password.value,

                    path:
                        config.sunshine.path.value,

                    verify_ssl:
                        config.sunshine.verify_ssl.value,

                    close_stream_on_game_exit:
                        config.sunshine
                            .close_stream_on_game_exit
                            .value,
                },
            );

            await updateSection(
                "tailscale",
                {
                    ipn_path:
                        config.tailscale.ipn_path.value,
                },
            );

            await updateSection(
                "storage",
                {
                    backup_retention:
                        config.storage.backup_retention.value,

                    archive_retention:
                        config.storage.archive_retention.value,
                },
            );

            await updateSection(
                "session",
                {
                    max_concurrent_sessions:
                        config.session
                            .max_concurrent_sessions
                            .value,

                    default_session_minutes:
                        config.session
                            .default_session_minutes
                            .value,

                    warning_before_minutes:
                        config.session
                            .warning_before_minutes
                            .value,

                    auto_cleanup:
                        config.session
                            .auto_cleanup
                            .value,

                    force_cleanup_timeout:
                        config.session
                            .force_cleanup_timeout
                            .value,
                },
            );

            await updateSection(
                "logging",
                {
                    log_level:
                        config.logging
                            .log_level
                            .value,

                    console_logging:
                        config.logging
                            .console_logging
                            .value,
                },
            );

            await updateSection(
                "host_agent",
                {
                    host_name:
                        config.host_agent
                            .host_name
                            .value,

                    environment:
                        config.host_agent
                            .environment
                            .value,

                    debug:
                        config.host_agent
                            .debug
                            .value,
                },
            );

            await loadConfig();

            toast.success(
                "Settings saved successfully."
            );

        } catch (error) {

            toast.error(

                error.response?.data?.detail ||

                error.message ||

                "Failed to save settings."

            );

        } finally {

            setSaving(false);
        }
    }

    async function handleSelectSunshine() {

        try {

            const result =
                await selectFile();

            if (!result.selected) {
                return;
            }

            setConfig({
                ...config,
                sunshine: {
                    ...config.sunshine,

                    path: {
                        ...config.sunshine.path,
                        value: result.path,
                    },
                },
            });

        } catch {

            toast.error(
                "Failed to select Sunshine executable."
            );
        }
    }

    async function handleSelectTailscaleIPN() {

        try {

            const result =
                await selectFile();

            if (!result.selected) {
                return;
            }

            setConfig({
                ...config,
                tailscale: {
                    ...config.tailscale,

                    ipn_path: {
                        ...config.tailscale.ipn_path,
                        value: result.path,
                    },
                },
            });

        } catch {

            toast.error(
                "Failed to select Tailscale IPN executable."
            );
        }
    }

    function validateSettings() {

        const errors = [];

        if (
            config.sunshine.path.value &&
            !config.sunshine.path.value
                .toLowerCase()
                .endsWith(".exe")
        ) {
            errors.push(
                "Sunshine path must be an executable."
            );
        }

        if (
            config.tailscale.ipn_path.value &&
            !config.tailscale.ipn_path.value
                .toLowerCase()
                .endsWith(".exe")
        ) {
            errors.push(
                "Tailscale path must be an executable."
            );
        }

        if (
            config.session.warning_before_minutes.value >=
            config.session.default_session_minutes.value
        ) {
            errors.push(
                "Warning time must be less than session duration."
            );
        }

        if (
            config.session.default_session_minutes.value < 5
        ) {
            errors.push(
                "Session duration must be greater than 5."
            );
        }

        if (
            config.session.warning_before_minutes.value < 0
        ) {
            errors.push(
                "Warning time cannot be negative."
            );
        }

        if (
            config.storage.backup_retention?.value < 1
        ) {
            errors.push(
                "Backup retention must be at least 1."
            );
        }

        return errors;
    }

    const hasChanges =
        JSON.stringify(config) !==
        JSON.stringify(originalConfig);

    if (!config) {

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: "16px",
                    color: colors.inkDim,
                    fontFamily: fonts.mono,
                    fontSize: "11.5px",
                }}
            >
                <Spinner size={14} />
                Loading settings...
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Sunshine */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Cloud size={12} strokeWidth={2} />} title="Sunshine" />

                <FieldLabel>Sunshine API URL</FieldLabel>
                <input
                    style={inputStyle}
                    placeholder="Api Url"
                    value={getValue(config.sunshine.api_url)}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            sunshine: {
                                ...config.sunshine,
                                api_url: {
                                    ...config.sunshine.api_url,
                                    value: e.target.value,
                                }
                            },
                        })
                    }
                />

                <FieldLabel>Sunshine Path</FieldLabel>
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                        value={getValue(config.sunshine.path)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                sunshine: {
                                    ...config.sunshine,
                                    path: {
                                        ...config.sunshine.path,
                                        value:
                                            e.target.value,
                                    },
                                },
                            })
                        }
                    />

                    <button
                        style={filePickerButton}
                        onClick={handleSelectSunshine}
                        title="Select Sunshine executable"
                        aria-label="Select Sunshine executable"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.brandDim;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(224,164,88,0.08)";
                        }}
                    >
                        <FileInput size={13} strokeWidth={2} />
                    </button>
                </div>

                <FieldGroup>
                    <div>
                        <FieldLabel>Sunshine Username</FieldLabel>
                        <input
                            style={inputStyle}
                            placeholder="Username"
                            value={getValue(config.sunshine.username)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    sunshine: {
                                        ...config.sunshine,
                                        username: {
                                            ...config.sunshine.username,
                                            value: e.target.value,
                                        }
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <FieldLabel>Sunshine Password</FieldLabel>
                        <input
                            type="password"
                            style={inputStyle}
                            placeholder="Password"
                            value={getValue(config.sunshine.password)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    sunshine: {
                                        ...config.sunshine,
                                        password: {
                                            ...config.sunshine.password,
                                            value: e.target.value,
                                        }
                                    },
                                })
                            }
                        />
                    </div>
                </FieldGroup>
            </Card>

            {/* Tailscale */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Network size={12} strokeWidth={2} />} title="Tailscale" />

                <FieldLabel>Tailscale IPN Path</FieldLabel>
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                        value={getValue(config.tailscale.ipn_path)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                tailscale: {
                                    ...config.tailscale,
                                    ipn_path: {
                                        ...config.tailscale.ipn_path,
                                        value:
                                            e.target.value,
                                    },
                                },
                            })
                        }
                    />

                    <button
                        style={filePickerButton}
                        onClick={handleSelectTailscaleIPN}
                        title="Select Tailscale IPN executable"
                        aria-label="Select Tailscale IPN executable"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.brandDim;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(224,164,88,0.08)";
                        }}
                    >
                        <FileInput size={13} strokeWidth={2} />
                    </button>
                </div>
            </Card>

            {/* Session */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Clock size={12} strokeWidth={2} />} title="Session" />

                <FieldGroup>
                    <div>
                        <FieldLabel>Default Session Minutes</FieldLabel>
                        <input
                            style={inputStyle}
                            type="number"
                            value={getValue(config.session.default_session_minutes)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    session: {
                                        ...config.session,
                                        default_session_minutes: {
                                            ...config.session.default_session_minutes,
                                            value: parseInt(
                                                e.target.value
                                            ) || 0,
                                        },
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <FieldLabel>Warning Before Minutes</FieldLabel>
                        <input
                            style={inputStyle}
                            type="number"
                            value={getValue(config.session.warning_before_minutes)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    session: {
                                        ...config.session,
                                        warning_before_minutes: {
                                            ...config.session.warning_before_minutes,
                                            value: parseInt(
                                                e.target.value
                                            ) || 0,
                                        },
                                    },
                                })
                            }
                        />
                    </div>
                </FieldGroup>
            </Card>

            {/* Logging */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<ClipboardList size={12} strokeWidth={2} />} title="Logging" />

                <FieldLabel>Log Level</FieldLabel>
                <SelectWrap>
                    <select
                        style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "34px" }}
                        value={getValue(config.logging.log_level)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                logging: {
                                    ...config.logging,
                                    log_level: {
                                        ...config.logging.log_level,
                                        value: e.target.value,
                                    }
                                },
                            })
                        }
                    >
                        <option value="DEBUG">DEBUG</option>
                        <option value="INFO">INFO</option>
                        <option value="WARNING">WARNING</option>
                        <option value="ERROR">ERROR</option>
                    </select>
                </SelectWrap>

                <ToggleSwitch
                    checked={!!getValue(config.logging.console_logging)}
                    label="Console Logging"
                    onChange={(next) =>
                        setConfig({
                            ...config,
                            logging: {
                                ...config.logging,
                                console_logging: {
                                    ...config.logging.console_logging,
                                    value: next,
                                },
                            },
                        })
                    }
                />
            </Card>

            {/* Host Agent */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Server size={12} strokeWidth={2} />} title="Host Agent" />

                <FieldLabel>Name</FieldLabel>
                <input
                    style={inputStyle}
                    placeholder="Host name"
                    value={getValue(config.host_agent.host_name)}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                    onChange={(e) =>
                        setConfig({
                            ...config,
                            host_agent: {
                                ...config.host_agent,
                                host_name: {
                                    ...config.host_agent.host_name,
                                    value: e.target.value,
                                }
                            },
                        })
                    }
                />

                <FieldLabel>Environment</FieldLabel>
                <SelectWrap>
                    <select
                        style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "34px" }}
                        value={getValue(config.host_agent.environment)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                host_agent: {
                                    ...config.host_agent,
                                    environment: {
                                        ...config.host_agent.environment,
                                        value: e.target.value,
                                    }
                                },
                            })
                        }
                    >
                        <option value="development">development</option>
                        <option value="production">production</option>
                    </select>
                </SelectWrap>
            </Card>

            {/* Storage (read only + editable retention) */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Database size={12} strokeWidth={2} />} title="Storage" />

                <FieldGroup>
                    <div>
                        <FieldLabel>Max Backup</FieldLabel>
                        <input
                            style={inputStyle}
                            placeholder="Backup Limit"
                            value={getValue(config.storage.backup_retention)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    storage: {
                                        ...config.storage,
                                        backup_retention: {
                                            ...config.storage.backup_retention,
                                            value: parseInt(
                                                e.target.value
                                            ) || 0,
                                        }
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <FieldLabel>Max Archive</FieldLabel>
                        <input
                            style={inputStyle}
                            placeholder="Archive Limit"
                            value={getValue(config.storage.archive_retention)}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    storage: {
                                        ...config.storage,
                                        archive_retention: {
                                            ...config.storage.archive_retention,
                                            value: parseInt(
                                                e.target.value
                                            ) || 0,
                                        }
                                    },
                                })
                            }
                        />
                    </div>
                </FieldGroup>

                <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: `1.5px solid ${colors.border}` }}>
                    <FieldLabel>Save Folder</FieldLabel>
                    <input
                        style={readOnlyStyle}
                        disabled
                        value={getValue(config.storage.saves_root)}
                    />

                    <FieldLabel>Host Backup Save Folder</FieldLabel>
                    <input
                        style={readOnlyStyle}
                        disabled
                        value={getValue(config.storage.temp_root)}
                    />

                    <FieldLabel>Game Config File</FieldLabel>
                    <input
                        style={readOnlyStyle}
                        disabled
                        value={getValue(config.storage.games_config_path)}
                    />
                </div>
            </Card>

            {/* Metadata (read only) */}
            <Card style={{ padding: "16px" }}>
                <SectionHeader icon={<Tags size={12} strokeWidth={2} />} title="Metadata" readOnly />

                <FieldLabel>Metadata Lock File Path</FieldLabel>
                <input
                    style={readOnlyStyle}
                    disabled
                    value={getValue(config.metadata.lock_file)}
                />
            </Card>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
                <div style={alertBox(colors.danger, "rgba(255,107,107,0.1)")}>
                    {validationErrors.map((error, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <XCircle size={11} strokeWidth={2} style={{ marginTop: "2px", flexShrink: 0 }} />
                            {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Restart required */}
            {restartRequired && (
                <div style={alertBox(colors.warning, colors.accentYellowDim)}>
                    <AlertTriangle size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                    Some changes require a backend restart.
                </div>
            )}

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: "10px" }}>
                <Button
                    variant="primary"
                    disabled={saving || !hasChanges}
                    onClick={saveSettings}
                    style={{ flex: 1 }}
                >
                    <Save size={12} strokeWidth={2} />
                    {saving ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                    variant="secondary"
                    disabled={saving}
                    onClick={() => {
                        setConfig(
                            JSON.parse(
                                JSON.stringify(
                                    originalConfig
                                )
                            )
                        );
                    }}
                    style={{ flex: 1 }}
                >
                    <RotateCcw size={11} strokeWidth={2} />
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function alertBox(color, wash) {
    return {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "flex-start",
        padding: "11px 14px",
        background: wash,
        border: `1.5px solid ${color}`,
        borderRadius: `${radius.sm}px`,
        color,
        fontSize: "11.5px",
        fontFamily: fonts.mono,
    };
}

const filePickerButton = {
    width: "42px",
    flexShrink: 0,
    borderRadius: `${radius.md}px`,
    border: `1.5px solid ${colors.brand}`,
    background: "rgba(224,164,88,0.08)",
    color: colors.brand,
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 150ms ease",
};
