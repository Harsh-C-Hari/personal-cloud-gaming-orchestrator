/**
 * pages/Login.jsx
 *
 * Same state, same bootstrap-check effect, same handleSubmit logic
 * (login / bootstrapAdmin, setToken, localStorage username/role, reload)
 * as before — only the presentation was reworked to match the shared
 * dark/mono design language used across the dashboard (StartSessionForm /
 * ChangePasswordPage / SettingsPanel): icon-badge brand mark, FieldLabel +
 * icon inputs with focus-glow, colored status boxes, gradient submit
 * button. No longer pulls in the old neumorphic styles/Login.css.
 */

import { useEffect, useState } from "react";
import { FaUser, FaLock, FaSignInAlt, FaUserShield, FaInfoCircle, FaExclamationTriangle } from "react-icons/fa";
import { login, setToken, bootstrapRequired, bootstrapAdmin } from "../api/client";
import { useToast } from "../components/ui/Toast.jsx";

const palette = {
    bg: "#000000a4",
    card: "rgb(0, 0, 0)",
    border: "#111620",
    borderSubtle: "#1c2130",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    danger: "#f43f5e",
    mono: "'JetBrains Mono', monospace",
    display: "'Rajdhani', sans-serif",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px 10px 34px",
    background: "#080a0f",
    border: `1px solid ${palette.borderSubtle}`,
    borderRadius: "7px",
    color: palette.text,
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

function focusBorder(e) {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
}
function blurBorder(e) {
    e.target.style.borderColor = palette.borderSubtle;
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

export default function Login() {
    const toast = useToast();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [bootstrapMode, setBootstrapMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function checkBootstrap() {
            try {
                const result = await bootstrapRequired();
                setBootstrapMode(result.required);
            } catch {
                setBootstrapMode(false);
            }
        }

        checkBootstrap();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setError("");

        try {
            setSubmitting(true);
            let result;

            if (bootstrapMode) {
                result = await bootstrapAdmin(username, password);
            } else {
                result = await login(username, password);
            }

            if (result.access_token) {
                setToken(result.access_token);
                localStorage.setItem("username", result.username);
                localStorage.setItem("role", result.role);

                window.location.reload();
            } else {
                setBootstrapMode(false);
                toast.success("Admin created successfully. Please login.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000000",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    maxWidth: "380px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: "12px",
                    background: "rgba(10,12,18,0.6)",
                    overflow: "hidden",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "10px",
                        padding: "28px 24px 20px",
                        borderBottom: `1px solid ${palette.border}`,
                        background: "rgba(56,189,248,0.04)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: "3px",
                                    height: `${10 + i * 5}px`,
                                    background: palette.accent,
                                    borderRadius: "1px",
                                    opacity: 0.6 + i * 0.2,
                                    boxShadow: "0 0 6px rgba(56,189,248,0.5)",
                                }}
                            />
                        ))}
                    </div>

                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: palette.text,
                            textAlign: "center",
                        }}
                    >
                        CLOUD GAMING <span style={{ color: palette.accent }}>ORCHESTRATOR</span>
                    </div>

                    <div
                        style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: palette.dim,
                            fontFamily: palette.display,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            marginTop: "4px",
                        }}
                    >
                        {bootstrapMode ? "Register Admin" : "Sign In"}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "22px 24px" }}>
                    {bootstrapMode && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "9px",
                                padding: "11px 14px",
                                borderRadius: "8px",
                                background: "rgba(56,189,248,0.06)",
                                border: "1px solid rgba(56,189,248,0.25)",
                                color: palette.dim,
                                fontSize: "11px",
                                fontFamily: palette.mono,
                            }}
                        >
                            <FaInfoCircle size={12} style={{ marginTop: "1px", flexShrink: 0, color: palette.accent }} />
                            No admin account detected. Create the first administrator.
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <FieldLabel icon={<FaUser size={10} />}>Username</FieldLabel>
                        <div style={{ position: "relative" }}>
                            <FaUser
                                size={12}
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: palette.muted,
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Enter your username"
                                autoComplete="off"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={inputStyle}
                                onFocus={focusBorder}
                                onBlur={blurBorder}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <FieldLabel icon={<FaLock size={10} />}>Password</FieldLabel>
                        <div style={{ position: "relative" }}>
                            <FaLock
                                size={12}
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: palette.muted,
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={inputStyle}
                                onFocus={focusBorder}
                                onBlur={blurBorder}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "9px",
                                padding: "11px 14px",
                                borderRadius: "8px",
                                background: "rgba(244,63,94,0.07)",
                                border: "1px solid rgba(244,63,94,0.3)",
                                color: palette.danger,
                                fontSize: "11.5px",
                                fontFamily: palette.mono,
                            }}
                        >
                            <FaExclamationTriangle size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "9px",
                            padding: "13px",
                            marginTop: "4px",
                            background: submitting
                                ? "rgba(56,189,248,0.06)"
                                : "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
                            border: "1px solid rgba(56,189,248,0.4)",
                            borderRadius: "8px",
                            color: palette.accent,
                            fontSize: "12px",
                            fontFamily: palette.mono,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.6 : 1,
                            textShadow: "0 0 14px rgba(56,189,248,0.4)",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            if (submitting) return;
                            e.currentTarget.style.background =
                                "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = submitting
                                ? "rgba(56,189,248,0.06)"
                                : "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
                        }}
                    >
                        {bootstrapMode ? <FaUserShield size={12} /> : <FaSignInAlt size={12} />}
                        {submitting
                            ? bootstrapMode
                                ? "Registering…"
                                : "Signing In…"
                            : bootstrapMode
                                ? "Register Admin"
                                : "Sign In"}
                    </button>
                </div>
            </form>
        </div>
    );
}
