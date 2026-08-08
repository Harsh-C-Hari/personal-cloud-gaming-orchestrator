/**
 * dashboard/pages/ChangePasswordPage.jsx
 *
 * Uses the existing, already-implemented backend endpoint via the
 * existing api/client.js `changePassword({ old_password, new_password })`
 * call. No API/request/response shape changes — this page only adds a
 * production-quality UI in front of it.
 *
 * Visual language: flat "Chalkboard Neo-Brutalist" tokens — bgInset input
 * fields, bordered sections, no gradients/glow/text-shadow. Composes
 * PageHeader + the shared Card/Button primitives instead of hand-rolled
 * styles.
 */

import { useState } from "react";
import { Key, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { changePassword } from "../../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Card, Button } from "../../components/ui/primitives.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { colors, fonts, radius } from "../theme.js";

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

function focusBorder(e) {
  e.target.style.borderColor = colors.borderInk;
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

      <Card style={{ padding: 0, overflow: "hidden", maxWidth: "460px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px 20px",
            borderBottom: `1.5px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: `${radius.sm}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: colors.brandDim,
              color: colors.brand,
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={15} strokeWidth={2} />
          </div>
          <div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: colors.ink,
                fontFamily: fonts.display,
              }}
            >
              Account Security
            </div>
            <div style={{ fontSize: "10px", color: colors.inkFaint, fontFamily: fonts.mono, marginTop: "1px" }}>
              Set a new password for this account
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
          {/* Current password */}
          <div>
            <FieldLabel icon={<Lock size={11} strokeWidth={2} />}>Current Password</FieldLabel>
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
          <div>
            <FieldLabel icon={<Key size={11} strokeWidth={2} />}>New Password</FieldLabel>
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
                color: colors.inkFaint,
                fontFamily: fonts.mono,
              }}
            >
              Minimum 6 characters, and different from your current password.
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <FieldLabel icon={<ShieldCheck size={11} strokeWidth={2} />}>Confirm New Password</FieldLabel>
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
                display: "flex",
                alignItems: "flex-start",
                gap: "9px",
                padding: "11px 14px",
                borderRadius: `${radius.sm}px`,
                fontSize: "11.5px",
                fontFamily: fonts.mono,
                background: colors.accentYellowDim,
                border: `1.5px solid rgba(245,215,110,0.3)`,
                color: colors.warning,
              }}
            >
              <TriangleAlert size={13} strokeWidth={2} style={{ marginTop: "1px", flexShrink: 0 }} />
              {validationError}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" variant="primary" disabled={submitting || !!validationError} style={{ width: "100%" }}>
            <Key size={13} strokeWidth={2} />
            {submitting ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
