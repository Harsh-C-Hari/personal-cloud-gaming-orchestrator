import {
    useEffect,
    useState,
} from "react";
import {
    FaFileImport,
    FaCloud,
    FaNetworkWired,
    FaClock,
    FaClipboardList,
    FaServer,
    FaDatabase,
    FaTags,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaSave,
    FaUndo,
    FaChevronDown,
    FaLock,
} from "react-icons/fa";
import {
    getConfig,
    updateConfig,
    selectFile,
} from "../api/client";

// ── Shared design tokens (matches Home / Recovery / SessionHistory /
// HostMonitor / StartSessionForm) ───────────────────────────────────────

const palette = {
    bg: "#080a0f",
    card: "rgb(0, 0, 0)",
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

const readOnlyStyle = {
    ...inputStyle,
    color: palette.faint,
    cursor: "not-allowed",
    background: "rgba(2,6,23,0.5)",
};

const cardSection = {
    padding: "16px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    background: palette.card,
};

const focusBorder = (e) => {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
};
const blurBorder = (e) => {
    e.target.style.borderColor = palette.border;
    e.target.style.boxShadow = "none";
};

function SectionHeader({ icon, title, readOnly }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
            <div
                style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    color: palette.accent,
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
                    color: palette.text,
                    fontFamily: palette.mono,
                    textTransform: "uppercase",
                }}
            >
                {title}
            </h3>
            {readOnly && (
                <span
                    style={{
                        marginLeft: "2px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "8.5px",
                        color: palette.muted,
                        border: `1px solid ${palette.border}`,
                        borderRadius: "10px",
                        padding: "2px 8px",
                        fontFamily: palette.mono,
                        letterSpacing: "0.08em",
                    }}
                >
                    <FaLock size={7} /> READ ONLY
                </span>
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

function FieldGroup({ children }) {
    return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>{children}</div>;
}

function SelectWrap({ children }) {
    return (
        <div style={{ position: "relative" }}>
            {children}
            <FaChevronDown
                size={10}
                style={{
                    position: "absolute",
                    right: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: palette.muted,
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
            }}
        >
            <div
                style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    background: checked ? "rgba(56,189,248,0.15)" : "#111620",
                    border: `1px solid ${checked ? "rgba(56,189,248,0.5)" : palette.border}`,
                    position: "relative",
                    transition: "all 0.25s",
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
                        background: checked ? palette.accent : "#2d3748",
                        boxShadow: checked ? "0 0 8px rgba(56,189,248,0.6)" : "none",
                        transition: "all 0.25s",
                    }}
                />
            </div>
            <span style={{ fontSize: "12px", color: palette.dim, fontFamily: palette.mono }}>{label}</span>
        </div>
    );
}

export function SettingsPanel() {

    const [config, setConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [messageType, setMessageType] = useState("success");
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

            setMessage(
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

            setMessageType("error");

            setMessage(
                errors.join(" ")
            );

            return;
        }
        
        setSaving(true);
        setMessage(null);

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

            setMessageType("success");

            setMessage(
                "Settings saved successfully."
            );

            setTimeout(() => {

                setMessage(null);

            }, 3000);

        } catch (error) {

            setMessageType("error");
            setMessage(

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

            setMessageType("error");
            setMessage(
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

            setMessageType("error");
            setMessage(
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
                    color: palette.dim,
                    fontFamily: palette.mono,
                    fontSize: "11.5px",
                }}
            >
                <span
                    style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: palette.accent,
                        animation: "settings-pulse 1.4s ease-in-out infinite",
                    }}
                />
                Loading settings...
                <style>{`@keyframes settings-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Sunshine */}
            <div style={cardSection}>
                <SectionHeader icon={<FaCloud size={12} />} title="Sunshine" />

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
                        style={{ ...inputStyle, flex: 1 }}
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(56,189,248,0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(56,189,248,0.08)";
                        }}
                    >
                        <FaFileImport size={13} />
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
            </div>

            {/* Tailscale */}
            <div style={cardSection}>
                <SectionHeader icon={<FaNetworkWired size={12} />} title="Tailscale" />

                <FieldLabel>Tailscale IPN Path</FieldLabel>
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        style={{ ...inputStyle, flex: 1 }}
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(56,189,248,0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(56,189,248,0.08)";
                        }}
                    >
                        <FaFileImport size={13} />
                    </button>
                </div>
            </div>

            {/* Session */}
            <div style={cardSection}>
                <SectionHeader icon={<FaClock size={12} />} title="Session" />

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
            </div>

            {/* Logging */}
            <div style={cardSection}>
                <SectionHeader icon={<FaClipboardList size={12} />} title="Logging" />

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
            </div>

            {/* Host Agent */}
            <div style={cardSection}>
                <SectionHeader icon={<FaServer size={12} />} title="Host Agent" />

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
            </div>

            {/* Storage (read only + editable retention) */}
            <div style={cardSection}>
                <SectionHeader icon={<FaDatabase size={12} />} title="Storage" />

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

                <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${palette.border}` }}>
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
            </div>

            {/* Metadata (read only) */}
            <div style={cardSection}>
                <SectionHeader icon={<FaTags size={12} />} title="Metadata" readOnly />

                <FieldLabel>Metadata Path</FieldLabel>
                <input
                    style={readOnlyStyle}
                    disabled
                    value={getValue(config.metadata.metadata_path)}
                />

                <FieldLabel>Metadata Lock File Path</FieldLabel>
                <input
                    style={readOnlyStyle}
                    disabled
                    value={getValue(config.metadata.lock_file)}
                />
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
                <div style={alertBox(palette.danger)}>
                    {validationErrors.map((error, index) => (
                        <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <FaTimesCircle size={11} style={{ marginTop: "2px", flexShrink: 0 }} />
                            {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Restart required */}
            {restartRequired && (
                <div style={alertBox(palette.warning)}>
                    <FaExclamationTriangle size={11} style={{ flexShrink: 0 }} />
                    Some changes require a backend restart.
                </div>
            )}

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: "10px" }}>
                <button
                    style={{
                        ...saveButton,
                        opacity: saving || !hasChanges ? 0.5 : 1,
                        cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                    }}
                    disabled={saving || !hasChanges}
                    onClick={saveSettings}
                    onMouseEnter={(e) => {
                        if (!saving && hasChanges) {
                            e.currentTarget.style.background =
                                "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
                    }}
                >
                    <FaSave size={12} />
                    {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>

                <button
                    style={cancelButton}
                    disabled={saving}
                    onClick={() => {
                        setConfig(
                            JSON.parse(
                                JSON.stringify(
                                    originalConfig
                                )
                            )
                        );
                        setMessage(null);
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = palette.borderStrong;
                        e.currentTarget.style.color = palette.text;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = palette.border;
                        e.currentTarget.style.color = palette.dim;
                    }}
                >
                    <FaUndo size={11} />
                    CANCEL
                </button>
            </div>

            {/* Save result message */}
            {message && validationErrors.length === 0 && (
                <div style={alertBox(messageType === "error" ? palette.danger : palette.success)}>
                    {messageType === "error" ? (
                        <FaTimesCircle size={12} style={{ flexShrink: 0 }} />
                    ) : (
                        <FaCheckCircle size={12} style={{ flexShrink: 0 }} />
                    )}
                    {message}
                </div>
            )}
        </div>
    );
}

function alertBox(color) {
    return {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        alignItems: "flex-start",
        padding: "11px 14px",
        background: `${color}12`,
        border: `1px solid ${color}4d`,
        borderRadius: "8px",
        color,
        fontSize: "11.5px",
        fontFamily: palette.mono,
    };
}

const filePickerButton = {
    width: "42px",
    flexShrink: 0,
    borderRadius: "7px",
    border: "1px solid rgba(56,189,248,0.35)",
    background: "rgba(56,189,248,0.08)",
    color: palette.accent,
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
};

const saveButton = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "13px",
    background: "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
    border: "1px solid rgba(56,189,248,0.4)",
    borderRadius: "8px",
    color: palette.accent,
    fontSize: "12px",
    fontFamily: palette.mono,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textShadow: "0 0 14px rgba(56,189,248,0.4)",
    transition: "background 0.2s",
};

const cancelButton = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "13px",
    background: "transparent",
    border: `1px solid ${palette.border}`,
    borderRadius: "8px",
    color: palette.dim,
    fontSize: "12px",
    fontFamily: palette.mono,
    fontWeight: 700,
    letterSpacing: "0.14em",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
};
