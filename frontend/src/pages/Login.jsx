/**
 * pages/Login.jsx
 *
 * Same state, same bootstrap-check effect, same handleSubmit logic
 * (login / bootstrapAdmin, setToken, localStorage username/role, reload)
 * as before — only the presentation was reworked to match
 * DESIGN_SYSTEM.md: flat "Chalkboard Neo-Brutalist" tokens from theme.js,
 * the shared Button primitive, lucide-react icons, no gradients/glow.
 */

import { useEffect, useState } from "react";
import { User, Lock, LogIn, ShieldCheck, Info, TriangleAlert } from "lucide-react";
import { login, setToken, bootstrapRequired, bootstrapAdmin } from "../api/client";
import { useToast } from "../components/ui/Toast.jsx";
import { Button } from "../components/ui/primitives.jsx";
import { colors, fonts, radius, shadow } from "../dashboard/theme.js";

const inputStyle = {
  width: "100%",
  padding: "10px 12px 10px 36px",
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
  borderRadius: `${radius.md}px`,
  color: colors.ink,
  fontSize: "13.5px",
  fontFamily: fonts.body,
  outline: "none",
  boxSizing: "border-box",
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
        fontSize: "10px",
        fontWeight: 700,
        color: colors.inkFaint,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: fonts.body,
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
        maxHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        padding: "20px",
        paddingTop: "calc(20px + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          border: `1.5px solid ${colors.border}`,
          borderRadius: `${radius.lg}px`,
          background: colors.bgCard,
          overflow: "hidden",
          boxShadow: shadow.overlay,
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
            borderBottom: `1.5px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: `${10 + i * 5}px`,
                  background: colors.brand,
                  borderRadius: "1px",
                  opacity: 0.6 + i * 0.2,
                }}
              />
            ))}
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: colors.ink,
              fontFamily: fonts.display,
              textAlign: "center",
            }}
          >
            CLOUD GAMING <span style={{ color: colors.brand }}>ORCHESTRATOR</span>
          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: colors.inkDim,
              fontFamily: fonts.display,
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
                borderRadius: `${radius.md}px`,
                background: colors.accentBlueDim,
                border: `1.5px solid rgba(126,200,242,0.3)`,
                color: colors.inkDim,
                fontSize: "12px",
                fontFamily: fonts.body,
              }}
            >
              <Info size={13} strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0, color: colors.accentBlue }} />
              No admin account detected. Create the first administrator.
            </div>
          )}

          {/* Username */}
          <div>
            <FieldLabel icon={<User size={11} strokeWidth={2} />}>Username</FieldLabel>
            <div style={{ position: "relative" }}>
              <User
                size={13}
                strokeWidth={2}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.inkFaint,
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
            <FieldLabel icon={<Lock size={11} strokeWidth={2} />}>Password</FieldLabel>
            <div style={{ position: "relative" }}>
              <Lock
                size={13}
                strokeWidth={2}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.inkFaint,
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
                borderRadius: `${radius.md}px`,
                background: "rgba(255,107,107,0.10)",
                border: `1.5px solid rgba(255,107,107,0.3)`,
                color: colors.danger,
                fontSize: "12px",
                fontFamily: fonts.body,
              }}
            >
              <TriangleAlert size={13} strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            style={{ width: "100%", padding: "12px", marginTop: "4px" }}
          >
            {bootstrapMode ? <ShieldCheck size={14} strokeWidth={2} /> : <LogIn size={14} strokeWidth={2} />}
            {submitting
              ? bootstrapMode
                ? "Registering…"
                : "Signing In…"
              : bootstrapMode
                ? "Register Admin"
                : "Sign In"}
          </Button>
        </div>
      </form>
    </div>
  );
}
