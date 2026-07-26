/**
 * dashboard/pages/ChangePasswordPage.jsx
 *
 * Uses the existing, already-implemented backend endpoint via the
 * existing api/client.js `changePassword({ old_password, new_password })`
 * call. No API/request/response shape changes — this page only adds a
 * production-quality UI in front of it.
 *
 * Visual language matches StartSessionForm.jsx / SettingsPage.jsx / PageHeader.jsx:
 * icon-badge card header, sectioned fields with icon labels, focus-glow inputs,
 * colored status boxes, gradient accent submit button.
 */

import { useState } from "react";
import { FaKey, FaLock, FaShieldAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import { changePassword } from "../../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { colors, fonts } from "../theme.js";

const palette = {
  bg: "#000000",
  card: "rgba(0, 0, 0, 0.55)",
  border: colors.borderSubtle,
  text: colors.text,
  dim: colors.textDim,
  faint: colors.textFaint,
  muted: colors.textMuted,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: "#fb7185",
  mono: fonts.mono,
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

const cardSection = {
  padding: "16px",
  borderRadius: "10px",
  border: `1px solid ${palette.border}`,
  background: palette.card,
};

const statusBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "9px",
  padding: "11px 14px",
  borderRadius: "8px",
  fontSize: "11.5px",
  fontFamily: palette.mono,
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

export function ChangePasswordPage({ onBack }) {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validationError = (() => {
    if (!oldPassword || !newPassword || !confirmPassword) return null;
    if (newPassword.length < 6) return "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword) return "New password and confirmation do not match.";
    if (newPassword === oldPassword) return "New password must be different from the current password.";
    return null;
  })();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warning("All fields are required.");
      return;
    }
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setSubmitting(true);
      const result = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success(result?.message || "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Change Password" subtitle="Update the password for your account" onBack={onBack} />

      <form
        onSubmit={handleSubmit}
        style={{
          border: `1px solid ${palette.border}`,
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          maxWidth: "460px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 20px",
            borderBottom: `1px solid ${palette.border}`,
            background: "rgba(0, 0, 0, 0.61)",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.3)",
              color: palette.accent,
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaShieldAlt />
          </div>
          <div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: palette.text,
                fontFamily: fonts.display,
                letterSpacing: "0.02em",
              }}
            >
              Account Security
            </div>
            <div style={{ fontSize: "10px", color: palette.faint, fontFamily: palette.mono, marginTop: "1px" }}>
              Set a new password for this account
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          {/* Current password */}
          <div style={cardSection}>
            <FieldLabel icon={<FaLock size={10} />}>Current Password</FieldLabel>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
              required
            />
          </div>

          {/* New password */}
          <div style={cardSection}>
            <FieldLabel icon={<FaKey size={10} />}>New Password</FieldLabel>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
              required
            />
            <div
              style={{
                marginTop: "9px",
                fontSize: "10px",
                color: palette.faint,
                fontFamily: palette.mono,
              }}
            >
              Minimum 6 characters, and different from your current password.
            </div>
          </div>

          {/* Confirm new password */}
          <div style={cardSection}>
            <FieldLabel icon={<FaShieldAlt size={10} />}>Confirm New Password</FieldLabel>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
              required
            />
          </div>

          {/* Validation hint */}
          {validationError && (
            <div
              style={{
                ...statusBox,
                background: "rgba(245,165,36,0.08)",
                border: "1px solid rgba(245,165,36,0.3)",
                color: palette.warning,
              }}
            >
              <FaExclamationTriangle size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
              {validationError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !!validationError}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              padding: "13px",
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
              cursor: submitting || validationError ? "not-allowed" : "pointer",
              textShadow: "0 0 14px rgba(56,189,248,0.4)",
              transition: "background 0.2s",
              opacity: submitting || validationError ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submitting && !validationError) {
                e.currentTarget.style.background =
                  "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = submitting
                ? "rgba(56,189,248,0.06)"
                : "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
            }}
          >
            <FaKey size={12} />
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
