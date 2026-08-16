import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Cloud,
  Database,
  FileInput,
  Lock,
  Network,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Tags,
  XCircle,
} from "lucide-react";
import { getConfig, selectFile, updateConfig } from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { Button, Spinner } from "./ui/primitives.jsx";

export function SettingsPanel() {
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [configError, setConfigError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  function getValue(field) {
    return field?.value;
  }

  function requiresRestartChanged(section, key) {
    const current = config?.[section]?.[key];
    const original = originalConfig?.[section]?.[key];
    return Boolean(current?.requires_restart && original && current.value !== original.value);
  }

  const restartRequired = Boolean(
    config && originalConfig && (
      requiresRestartChanged("host_agent", "environment") ||
      requiresRestartChanged("host_agent", "debug") ||
      requiresRestartChanged("storage", "backup_retention") ||
      requiresRestartChanged("storage", "archive_retention") ||
      requiresRestartChanged("storage", "enable_archives") ||
      requiresRestartChanged("storage", "enable_integrity_hashing") ||
      requiresRestartChanged("logging", "console_logging")
    )
  );

  const hasChanges = Boolean(config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig));

  async function loadConfig() {
    try {
      setLoadingConfig(true);
      setConfigError("");
      const data = await getConfig();
      setConfig(data);
      setOriginalConfig(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      const message = error.message || "Failed to load settings.";
      setConfigError(message);
      toast.error(message);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function updateSection(section, data) {
    await updateConfig(section, data);
  }

  async function saveSettings() {
    setValidationErrors([]);
    setSaveError("");
    const errors = validateSettings();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    setSaving(true);
    try {
      await updateSection("sunshine", {
        api_url: config.sunshine.api_url.value,
        username: config.sunshine.username.value,
        password: config.sunshine.password.value,
        path: config.sunshine.path.value,
        verify_ssl: config.sunshine.verify_ssl.value,
        close_stream_on_game_exit: config.sunshine.close_stream_on_game_exit.value,
      });

      await updateSection("tailscale", {
        ipn_path: config.tailscale.ipn_path.value,
      });

      await updateSection("storage", {
        backup_retention: config.storage.backup_retention.value,
        archive_retention: config.storage.archive_retention.value,
      });

      await updateSection("session", {
        max_concurrent_sessions: config.session.max_concurrent_sessions.value,
        default_session_minutes: config.session.default_session_minutes.value,
        warning_before_minutes: config.session.warning_before_minutes.value,
        auto_cleanup: config.session.auto_cleanup.value,
        force_cleanup_timeout: config.session.force_cleanup_timeout.value,
      });

      await updateSection("logging", {
        log_level: config.logging.log_level.value,
        console_logging: config.logging.console_logging.value,
      });

      await updateSection("host_agent", {
        host_name: config.host_agent.host_name.value,
        environment: config.host_agent.environment.value,
        debug: config.host_agent.debug.value,
      });

      await loadConfig();
      toast.success("Settings saved successfully.");
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Failed to save settings.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectSunshine() {
    try {
      const result = await selectFile();
      if (!result.selected) return;
      setConfig({
        ...config,
        sunshine: {
          ...config.sunshine,
          path: { ...config.sunshine.path, value: result.path },
        },
      });
    } catch (error) {
      toast.error(error.message || "Failed to select Sunshine executable.");
    }
  }

  async function handleSelectTailscaleIPN() {
    try {
      const result = await selectFile();
      if (!result.selected) return;
      setConfig({
        ...config,
        tailscale: {
          ...config.tailscale,
          ipn_path: { ...config.tailscale.ipn_path, value: result.path },
        },
      });
    } catch (error) {
      toast.error(error.message || "Failed to select Tailscale IPN executable.");
    }
  }

  function validateSettings() {
    const errors = [];

    if (config.sunshine.path.value && !config.sunshine.path.value.toLowerCase().endsWith(".exe")) {
      errors.push("Sunshine path must be an executable.");
    }
    if (config.tailscale.ipn_path.value && !config.tailscale.ipn_path.value.toLowerCase().endsWith(".exe")) {
      errors.push("Tailscale path must be an executable.");
    }
    if (config.session.warning_before_minutes.value >= config.session.default_session_minutes.value) {
      errors.push("Warning time must be less than session duration.");
    }
    if (config.session.default_session_minutes.value < 5) {
      errors.push("Session duration must be greater than 5.");
    }
    if (config.session.warning_before_minutes.value < 0) {
      errors.push("Warning time cannot be negative.");
    }
    if (config.storage.backup_retention?.value < 1) {
      errors.push("Backup retention must be at least 1.");
    }

    return errors;
  }

  function updateValue(section, key, value) {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: {
          ...config[section][key],
          value,
        },
      },
    });
  }

  if (!config) {
    return configError ? (
      <div className="pcgo-settings__unavailable" role="alert">
        <AlertTriangle size={18} aria-hidden="true" />
        <strong>Configuration unavailable</strong>
        <p>{configError}</p>
        <Button variant="secondary" onClick={loadConfig} disabled={loadingConfig}>
          <RefreshCw size={13} /> Retry loading settings
        </Button>
      </div>
    ) : (
      <SettingsLoading />
    );
  }

  return (
    <section className="pcgo-settings-workspace" aria-labelledby="pcgo-settings-workspace-title">
      <div className="pcgo-settings-workspace__toolbar">
        <div>
          <div className="pcgo-settings__eyebrow">HOST CONFIGURATION</div>
          <h2 id="pcgo-settings-workspace-title">Configuration workspace</h2>
          <p>Draft changes locally, then apply the supported configuration sections together.</p>
        </div>
        <button
          type="button"
          className="pcgo-settings__refresh"
          onClick={loadConfig}
          disabled={loadingConfig || saving}
          aria-label="Reload host configuration"
        >
          <RefreshCw size={13} className={loadingConfig ? "pcgo-settings__spin" : ""} />
          {loadingConfig ? "Refreshing" : "Reload"}
        </button>
      </div>

      <div className="pcgo-settings__status-row" aria-label="Settings state">
        <div className={`pcgo-settings__state ${hasChanges ? "is-dirty" : "is-saved"}`}>
          {hasChanges ? <CircleHelp size={13} /> : <CheckCircle2 size={13} />}
          <span>{hasChanges ? "DRAFT CHANGES" : "SAVED SNAPSHOT"}</span>
        </div>
        <span className="pcgo-settings__state-help">
          {hasChanges ? "Changes stay local until Save Changes is applied." : "Values match the latest server snapshot."}
        </span>
        {restartRequired && <span className="pcgo-settings__restart-tag"><AlertTriangle size={12} /> RESTART REQUIRED</span>}
      </div>

      {configError && (
        <div className="pcgo-settings__stale-note" role="status">
          <AlertTriangle size={13} />
          <span>Refresh failed. The last loaded configuration remains visible.</span>
          <button type="button" onClick={loadConfig}>Retry</button>
        </div>
      )}

      <div className="pcgo-settings__groups">
        <SettingsGroup icon={<Cloud size={14} />} title="Sunshine" description="Connection details for the Sunshine streaming service.">
          <SettingRow label="Sunshine API URL" description="Endpoint used by PCGO to reach the Sunshine control API.">
            <input aria-label="Sunshine API URL" value={getValue(config.sunshine.api_url)} onChange={(event) => updateValue("sunshine", "api_url", event.target.value)} />
          </SettingRow>
          <SettingRow label="Sunshine executable" description="Windows executable path used when PCGO starts or restarts Sunshine.">
            <PathControl ariaLabel="Sunshine executable path" value={getValue(config.sunshine.path)} onChange={(value) => updateValue("sunshine", "path", value)} onSelect={handleSelectSunshine} selectLabel="Select Sunshine executable" />
          </SettingRow>
          <div className="pcgo-settings__split-row">
            <SettingRow label="Username" description="Credential used for Sunshine API access.">
              <input aria-label="Sunshine username" value={getValue(config.sunshine.username)} onChange={(event) => updateValue("sunshine", "username", event.target.value)} />
            </SettingRow>
            <SettingRow label="Password" description="Credential used for Sunshine API access.">
              <input aria-label="Sunshine password" type="password" autoComplete="new-password" value={getValue(config.sunshine.password)} onChange={(event) => updateValue("sunshine", "password", event.target.value)} />
            </SettingRow>
          </div>
        </SettingsGroup>

        <SettingsGroup icon={<Network size={14} />} title="Tailscale" description="Executable path used by the host networking integration.">
          <SettingRow label="Tailscale IPN executable" description="Windows executable path for the Tailscale IPN process.">
            <PathControl ariaLabel="Tailscale IPN executable path" value={getValue(config.tailscale.ipn_path)} onChange={(value) => updateValue("tailscale", "ipn_path", value)} onSelect={handleSelectTailscaleIPN} selectLabel="Select Tailscale IPN executable" />
          </SettingRow>
        </SettingsGroup>

        <SettingsGroup icon={<Server size={14} />} title="Host agent" description="Identity and runtime environment for the host agent." >
          <SettingRow label="Host name" description="Display name used to identify this host in the control plane.">
            <input aria-label="Host name" value={getValue(config.host_agent.host_name)} onChange={(event) => updateValue("host_agent", "host_name", event.target.value)} />
          </SettingRow>
          <div className="pcgo-settings__split-row">
            <SettingRow label="Environment" description="Runtime profile used by the host agent." restartRequired={requiresRestartChanged("host_agent", "environment")}>
              <SelectControl ariaLabel="Host environment" value={getValue(config.host_agent.environment)} onChange={(value) => updateValue("host_agent", "environment", value)} options={["development", "production"]} />
            </SettingRow>
            <SettingRow label="Debug mode" description="Current value is preserved by the existing save contract." restartRequired={requiresRestartChanged("host_agent", "debug")}>
              <ReadOnlyValue value={String(Boolean(getValue(config.host_agent.debug)))} />
            </SettingRow>
          </div>
        </SettingsGroup>

        <SettingsGroup icon={<ClockIcon />} title="Session" description="Default timing rules applied when a session is started.">
          <div className="pcgo-settings__split-row">
            <SettingRow label="Default session minutes" description="Default duration assigned to a new session.">
              <input aria-label="Default session minutes" type="number" min="0" value={getValue(config.session.default_session_minutes)} onChange={(event) => updateValue("session", "default_session_minutes", parseInt(event.target.value, 10) || 0)} />
            </SettingRow>
            <SettingRow label="Warning before minutes" description="Time before expiry when the session warning is shown.">
              <input aria-label="Warning before minutes" type="number" min="0" value={getValue(config.session.warning_before_minutes)} onChange={(event) => updateValue("session", "warning_before_minutes", parseInt(event.target.value, 10) || 0)} />
            </SettingRow>
          </div>
          <div className="pcgo-settings__info-note"><CircleHelp size={13} /> Warning time must remain below the default session duration.</div>
        </SettingsGroup>

        <SettingsGroup icon={<ClipboardList size={14} />} title="Logging" description="Control the host-agent log stream and its runtime verbosity.">
          <SettingRow label="Log level" description="The host-agent logger applies this level immediately." immediate>
            <SelectControl ariaLabel="Log level" value={getValue(config.logging.log_level)} onChange={(value) => updateValue("logging", "log_level", value)} options={["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]} />
          </SettingRow>
          <SettingRow label="Console logging" description="Keep console output enabled for the host agent." restartRequired={requiresRestartChanged("logging", "console_logging")}>
            <ToggleSwitch checked={Boolean(getValue(config.logging.console_logging))} onChange={(value) => updateValue("logging", "console_logging", value)} label="Console output enabled" />
          </SettingRow>
        </SettingsGroup>

        <SettingsGroup icon={<Database size={14} />} title="Storage" description="Retention controls and immutable server paths for save data.">
          <div className="pcgo-settings__split-row">
            <SettingRow label="Backup retention" description="Number of backup sets retained by the host agent." restartRequired={requiresRestartChanged("storage", "backup_retention")}>
              <input aria-label="Backup retention" type="number" min="1" value={getValue(config.storage.backup_retention)} onChange={(event) => updateValue("storage", "backup_retention", parseInt(event.target.value, 10) || 0)} />
            </SettingRow>
            <SettingRow label="Archive retention" description="Number of archive sets retained by the host agent." restartRequired={requiresRestartChanged("storage", "archive_retention")}>
              <input aria-label="Archive retention" type="number" min="0" value={getValue(config.storage.archive_retention)} onChange={(event) => updateValue("storage", "archive_retention", parseInt(event.target.value, 10) || 0)} />
            </SettingRow>
          </div>
          <div className="pcgo-settings__readonly-block">
            <div className="pcgo-settings__readonly-heading"><Lock size={12} /> SERVER PATHS <span>READ ONLY</span></div>
            <ReadOnlyRow label="Save folder" value={getValue(config.storage.saves_root)} />
            <ReadOnlyRow label="Host backup folder" value={getValue(config.storage.temp_root)} />
            <ReadOnlyRow label="Game config file" value={getValue(config.storage.games_config_path)} />
          </div>
        </SettingsGroup>

        <SettingsGroup icon={<Tags size={14} />} title="Metadata" description="Internal coordination files used by the host agent.">
          <ReadOnlyRow label="Metadata lock file" value={getValue(config.metadata.lock_file)} />
        </SettingsGroup>
      </div>

      {(validationErrors.length > 0 || saveError) && (
        <div className="pcgo-settings__errors" role="alert">
          {saveError && <div><XCircle size={13} /> {saveError}</div>}
          {validationErrors.map((error) => <div key={error}><XCircle size={13} /> {error}</div>)}
        </div>
      )}

      {restartRequired && (
        <div className="pcgo-settings__restart-note" role="status">
          <AlertTriangle size={14} />
          <div><strong>Restart required</strong><span>Some saved changes take effect only after the backend is restarted.</span></div>
        </div>
      )}

      <div className="pcgo-settings__actions">
        <Button variant="primary" disabled={saving || !hasChanges} onClick={saveSettings} aria-busy={saving}>
          {saving ? <RefreshCw size={13} className="pcgo-settings__spin" /> : <Save size={13} />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="secondary" disabled={saving || !hasChanges} onClick={() => { setConfig(JSON.parse(JSON.stringify(originalConfig))); setValidationErrors([]); setSaveError(""); }}>
          <RotateCcw size={12} /> Cancel draft
        </Button>
        <span className="pcgo-settings__action-help">{hasChanges ? "Unsaved draft values" : "No pending changes"}</span>
      </div>
    </section>
  );
}

function SettingsGroup({ icon, title, description, children }) {
  return (
    <section className="pcgo-settings-group" aria-labelledby={`settings-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="pcgo-settings-group__header">
        <div className="pcgo-settings-group__mark" aria-hidden="true">{icon}</div>
        <div><h3 id={`settings-group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{title}</h3><p>{description}</p></div>
      </div>
      <div className="pcgo-settings-group__body">{children}</div>
    </section>
  );
}

function SettingRow({ label, description, children, restartRequired = false, immediate = false }) {
  return (
    <div className="pcgo-settings-row">
      <div className="pcgo-settings-row__copy"><div className="pcgo-settings-row__label">{label}</div><p>{description}</p><div className="pcgo-settings-row__meta">{restartRequired ? "RESTART REQUIRED" : immediate ? "IMMEDIATE" : "APPLIES ON SAVE"}</div></div>
      <div className="pcgo-settings-row__control">{children}</div>
    </div>
  );
}

function ReadOnlyRow({ label, value }) {
  return <div className="pcgo-settings-readonly-row"><span>{label}</span><strong title={value}>{value || "—"}</strong></div>;
}

function ReadOnlyValue({ value }) {
  return <div className="pcgo-settings-readonly-value" aria-label={`Read-only value ${value}`}>{value}</div>;
}

function PathControl({ ariaLabel, value, onChange, onSelect, selectLabel }) {
  return <div className="pcgo-settings-path-control"><input aria-label={ariaLabel} value={value || ""} onChange={(event) => onChange(event.target.value)} /><button type="button" aria-label={selectLabel} title={selectLabel} onClick={onSelect}><FileInput size={14} /></button></div>;
}

function SelectControl({ ariaLabel, value, onChange, options }) {
  return <div className="pcgo-settings-select-control"><select aria-label={ariaLabel} value={value || ""} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={12} aria-hidden="true" /></div>;
}

function ToggleSwitch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`pcgo-settings-switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}><span aria-hidden="true" /><strong>{checked ? "ON" : "OFF"}</strong></button>;
}

function SettingsLoading() {
  return <div className="pcgo-settings-loading" role="status" aria-label="Loading settings"><div className="pcgo-settings-loading__toolbar"><span /><i /></div><div className="pcgo-settings-loading__group"><span /><i /><b /><b /><b /></div><div className="pcgo-settings-loading__group"><span /><i /><b /><b /></div></div>;
}

function ClockIcon() {
  return <span className="pcgo-settings-clock" aria-hidden="true">◷</span>;
}
