import {
    useEffect,
    useState,
} from "react";
import { FaFileImport } from "react-icons/fa";
import {
    getConfig,
    updateConfig,
    selectFile,
} from "../api/client";

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

    if (!config) {

        return (
            <div>
                Loading settings...
            </div>
        );
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
    return (
        <div
            style={formBox}
        >

            <h2>
                Settings
            </h2>

            <div style={cardStyle}>

                <h3>
                    Sunshine
                </h3>

                <label style={labelStyle}>
                    Sunshine Api Url
                </label>
                <input
                    style={input}
                    placeholder="Api Url"
                    value={
                        getValue(
                            config.sunshine.api_url
                        )
                    }
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
                
                <label style={labelStyle}>
                    Sunshine Path
                </label>
                <div style={pathRow}>

                    <input
                        style={pathInput}
                        value={
                            getValue(
                                config.sunshine.path
                            )
                        }
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
                        style={pickerButton}
                        onClick={
                            handleSelectSunshine
                        }
                        title="Select Sunshine executable"
                    >
                        <FaFileImport />
                    </button>

                </div>

                <label style={labelStyle}>
                    Sunshine Username
                </label>
                <input
                    style={input}
                    placeholder="Username"
                    value={
                        getValue(
                            config.sunshine.username
                        )
                    }
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

                <label style={labelStyle}>
                    Sunshine Password
                </label>
                <input
                    type="password"
                    style={input}
                    placeholder="Password"
                    value={
                        getValue(
                            config.sunshine.password
                        )
                    }
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
            <div style={cardStyle}>

                <h3>
                    Tailscale
                </h3>

                <label style={labelStyle}>
                    Tailscale IPN Path
                </label>
                <div style={pathRow}>

                    <input
                        style={pathInput}
                        value={
                            getValue(
                                config.tailscale.ipn_path
                            )
                        }
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
                        style={pickerButton}
                        onClick={
                            handleSelectTailscaleIPN
                        }
                        title="Select Tailscale IPN executable"
                    >
                        <FaFileImport />
                    </button>

                </div>
            </div>
            <div style={cardStyle}>

                <h3>
                    Session
                </h3>

                <label style={labelStyle}>
                    Default Session Minutes
                </label>

                <input
                    style={input}
                    type="number"
                    value={
                        getValue(
                            config.session.default_session_minutes
                        )
                    }
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

                <label style={labelStyle}>
                    Warning Before Minutes
                </label>

                <input
                    style={input}
                    type="number"
                    value={
                        getValue(
                            config.session.warning_before_minutes
                        )
                    }
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

            <div style={cardStyle}>

                <h3>
                    Logging
                </h3>

                <select
                    style={input}
                    value={
                        getValue(
                            config.logging.log_level
                        )
                    }
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
                    <option value="DEBUG">
                        DEBUG
                    </option>

                    <option value="INFO">
                        INFO
                    </option>

                    <option value="WARNING">
                        WARNING
                    </option>

                    <option value="ERROR">
                        ERROR
                    </option>
                </select>

                <label style={labelStyle}>
                    Console Logging
                </label>

                <label style={switchStyle}>

                    <input
                        type="checkbox"
                        checked={
                            getValue(
                                config.logging.console_logging
                            )
                        }
                        onChange={(e) =>
                            setConfig({
                                ...config,
                                logging: {
                                    ...config.logging,
                                    console_logging: {
                                        ...config.logging.console_logging,
                                        value:
                                            e.target.checked,
                                    },
                                },
                            })
                        }
                        style={{
                            display: "none",
                        }}
                    />

                    <span
                        style={{
                            ...sliderStyle,

                            background:
                                getValue(
                                    config.logging.console_logging
                                )
                                    ? "#21cc4c"
                                    : "#555",
                        }}
                    >
                        <span
                            style={{
                                ...knobStyle,

                                transform:
                                    getValue(
                                        config.logging.console_logging
                                    )
                                        ? "translateX(20px)"
                                        : "translateX(0)",
                            }}
                        />
                    </span>

                </label>
            </div>

            <div style={cardStyle}>

                <h3>
                    Host Agent
                </h3>

                <label style={labelStyle}>
                    Name
                </label>
                
                <input
                    style={input}
                    placeholder="Host name"
                    value={
                        getValue(
                            config.host_agent.host_name
                        )
                    }
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

                <label style={labelStyle}>
                    Environment
                </label>
                
                <select
                    style={input}
                    value={
                        getValue(
                            config.host_agent.environment
                        )
                    }
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
                    <option value="development">
                        development
                    </option>

                    <option value="production">
                        production
                    </option>
                </select>
            </div>

            <div style={cardStyle}>

                <h3>
                    Storage (Read Only)
                </h3>

                <label style={labelStyle}>
                    Max Backup
                </label>
                <input
                    style={input}
                    placeholder="Backup Limit"
                    value={
                        getValue(
                            config.storage.backup_retention
                        )
                    }
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

                <label style={labelStyle}>
                    Max Archive
                </label>
                <input
                    style={input}
                    placeholder="Archive Limit"
                    value={
                        getValue(
                            config.storage.archive_retention
                        )
                    }
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
                
                <label style={labelStyle}>
                    Save Folder(Read Only)
                </label>
                
                <input
                    style={readOnlyStyle}
                    disabled
                    value={
                        getValue(
                            config.storage.saves_root
                        )
                    }
                />

                <label style={labelStyle}>
                    Host Backup Save Folder(Read Only)
                </label>
                
                <input
                    style={readOnlyStyle}
                    disabled
                    value={
                        getValue(
                            config.storage.temp_root
                        )
                    }
                />

                <label style={labelStyle}>
                    Game Config File(Read Only)
                </label>
                
                <input
                    style={readOnlyStyle}
                    disabled
                    value={
                        getValue(
                            config.storage.games_config_path
                        )
                    }
                />

            </div>

            <div style={cardStyle}>

                <h3>
                    Metadata (Read Only)
                </h3>

                <label style={labelStyle}>
                    Metadata Path
                </label>
                
                <input
                    style={readOnlyStyle}
                    disabled
                    value={
                        getValue(
                            config.metadata.metadata_path
                        )
                    }
                />

                <label style={labelStyle}>
                    Metadata Lock File Path
                </label>
                
                <input
                    style={readOnlyStyle}
                    disabled
                    value={
                        getValue(
                            config.metadata.lock_file
                        )
                    }
                />

            </div>

            {
                validationErrors.length > 0 && (
                    <div style={validationBad}>
                        {
                            validationErrors.map(
                                (error, index) => (
                                    <div key={index}>
                                        {error}
                                    </div>
                                )
                            )
                        }
                    </div>
                )
            }
            
            {
                restartRequired && (
                    <div style={restartBox}>
                        Some changes require a backend restart.
                    </div>
                )
            }
            
            <div style={formActions}>
                <button
                    style={{
                        ...saveButton,

                        opacity:
                        saving ||
                        !hasChanges
                            ? 0.5
                            : 1,
                        
                        cursor:
                            saving ||
                            !hasChanges
                                ? "not-allowed"
                                : "pointer",
                    }}

                    disabled={
                        saving ||
                        !hasChanges
                    }

                    onClick={saveSettings}
                >
                    {
                        saving
                            ? "SAVING..."
                            : "SAVE CHANGES"
                    }
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
                >
                    CANCEL
                </button>
            </div>

            {message && 
            validationErrors.length === 0 && (
                <div
                    style={
                        messageType === "error"
                            ? errorStyle
                            : successStyle
                    }
                >
                    {message}
                </div>
            )}

        </div>
    );
}

const formBox = {
  marginTop: "14px",
  padding: "16px",
  background: "#080a0f",
  border: "1px solid #1c2130",
  borderRadius: "8px",
};

const input = {
  width: "100%",
  padding: "9px 12px",
  background: "#05070b",
  border: "1px solid #1c2130",
  borderRadius: "6px",
  color: "#e2e8f0",
  boxSizing: "border-box",
};

const readOnlyStyle = {
    ...input,
    background: "#05070b",
    color: "#888",
    cursor: "not-allowed",
};

const saveButton = {
  flex: 1,
  padding: "10px",
  background: "rgba(56,189,248,0.08)",
  border: "1px solid #38bdf8",
  color: "#38bdf8",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "'JetBrains Mono', monospace",
};

const cancelButton = {
  flex: 1,
  padding: "10px",
  background: "transparent",
  border: "1px solid #475569",
  color: "#94a3b8",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "'JetBrains Mono', monospace",
};

const pickerButton = {
  width: "40px",
  borderRadius: "6px",
  border: "1px solid #38bdf8",
  background: "transparent",
  color: "#38bdf8",
  cursor: "pointer",
  fontSize: "16px",
  transition: "0.2s",
};

const pathRow = {

  display: "flex",

  gap: "6px",

};


const pathInput = {

  ...input,

  flex: 1,

};

const successBox = {
  marginTop: "10px",
  padding: "10px",
  border: "1px solid #10d98a",
  borderRadius: "6px",
  color: "#10d98a",
  background: "rgba(16,217,138,0.08)",
  fontSize: "11px",
  fontFamily:
    "'JetBrains Mono', monospace",
};

const validationOk = {
  marginTop: "10px",
  color: "#10d98a",
  fontSize: "11px",
  fontFamily:
    "'JetBrains Mono', monospace",
};

const formActions = {
  display: "flex",
  gap: "8px",
  marginTop: "16px",
};

const cardStyle = {
    border: "1px solid #263041",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#080a0f",
};

const restartBox = {
    marginTop: "15px",
    padding: "10px",
    border: "1px solid #f59e0b",
    borderRadius: "6px",
    color: "#f59e0b",
    background: "rgba(245,158,11,0.08)",
    fontSize: "11px",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const labelStyle = {
    display: "block",
    marginBottom: "8px",
    marginTop: "15px",
    color: "#c0c0c0",
    fontSize: "14px",
};

const successStyle = {
    background:
        "rgba(16,217,138,0.08)",
    border:
        "1px solid #10d98a",
    color:
        "#10d98a",
    padding: "10px",
    borderRadius: "6px",
};

const errorStyle = {
    background:
        "rgba(239,68,68,0.08)",
    border:
        "1px solid #ef4444",
    color:
        "#ef4444",
    padding: "10px",
    borderRadius: "6px",
};

const validationBad = {
  marginTop: "10px",
  color: "#ef4444",
  fontSize: "11px",
  fontFamily:
    "'JetBrains Mono', monospace",
};

const switchStyle = {
    display: "inline-block",
};

const sliderStyle = {
    width: "44px",
    height: "24px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    padding: "3px",
    cursor: "pointer",
    transition: "0.3s",
};

const knobStyle = {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#fff",
    transition: "0.3s",
};