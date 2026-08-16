import { useState } from "react";
import { CheckCircle2, KeyRound, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { changePassword } from "../../api/client.js";
import { PageHeader } from "../components/PageHeader.jsx";
import { Button } from "../../components/ui/primitives.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

export function ChangePasswordPage({ onBack }) {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validationError = (() => {
    if (!oldPassword || !newPassword || !confirmPassword) return null;
    if (newPassword.length < 6) return "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword) return "New password and confirmation do not match.";
    if (newPassword === oldPassword) return "New password must be different from the current password.";
    return null;
  })();

  const newPasswordError = newPassword && newPassword.length < 6
    ? "New password must be at least 6 characters."
    : newPassword && oldPassword && newPassword === oldPassword
      ? "New password must be different from the current password."
      : "";
  const confirmationError = confirmPassword && newPassword && newPassword !== confirmPassword
    ? "New password and confirmation do not match."
    : "";
  function updateField(setter) {
    return (event) => {
      setter(event.target.value);
      setSubmitError("");
      setSuccessMessage("");
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setAttempted(true);
    setSubmitError("");

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
      const result = await changePassword({ old_password: oldPassword, new_password: newPassword });
      const message = result?.message || "Password changed successfully.";
      toast.success(message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAttempted(false);
      setSuccessMessage("Password changed successfully. Your current session remains active.");
    } catch (error) {
      const message = error.message || "Failed to change password.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pcgo-feature-page pcgo-change-password-page">
      <PageHeader title="Change password" subtitle="Account security" onBack={onBack} />

      <main className="pcgo-change-password-shell">
        <section className="pcgo-change-password-card" aria-labelledby="change-password-title">
          <header className="pcgo-change-password-card__header">
            <div className="pcgo-change-password-card__mark" aria-hidden="true"><ShieldCheck size={17} /></div>
            <div>
              <div className="pcgo-change-password__eyebrow">ACCOUNT SECURITY</div>
              <h2 id="change-password-title">Set a new password</h2>
              <p>PCGO verifies your current password before updating the stored password for this account.</p>
            </div>
          </header>

          <div className="pcgo-change-password__context">
            <LockKeyhole size={13} aria-hidden="true" />
            <span>Your current session remains active after a successful change.</span>
          </div>

          <form className="pcgo-change-password-form" onSubmit={handleSubmit} noValidate>
            <PasswordField
              id="current-password"
              label="Current password"
              icon={<LockKeyhole size={13} />}
              value={oldPassword}
              onChange={updateField(setOldPassword)}
              autoComplete="current-password"
              description="Enter the password currently protecting this account."
              required
              requiredError={attempted && !oldPassword}
              error=""
            />

            <PasswordField
              id="new-password"
              label="New password"
              icon={<KeyRound size={13} />}
              value={newPassword}
              onChange={updateField(setNewPassword)}
              autoComplete="new-password"
              description="Minimum 6 characters, and different from your current password."
              required
              requiredError={attempted && !newPassword}
              error={newPasswordError}
            />

            <PasswordField
              id="confirm-new-password"
              label="Confirm new password"
              icon={<ShieldCheck size={13} />}
              value={confirmPassword}
              onChange={updateField(setConfirmPassword)}
              autoComplete="new-password"
              description="Re-enter the new password to confirm the change."
              required
              requiredError={attempted && !confirmPassword}
              error={confirmationError}
            />

            {(submitError || (attempted && validationError && !newPasswordError && !confirmationError)) && (
              <div className="pcgo-change-password__error" role="alert">
                <TriangleAlert size={14} aria-hidden="true" />
                <span>{submitError || validationError}</span>
              </div>
            )}

            {successMessage && (
              <div className="pcgo-change-password__success" role="status">
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting} className="pcgo-change-password__submit">
              <KeyRound size={14} />
              {submitting ? "Updating password…" : "Change password"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

function PasswordField({ id, label, icon, value, onChange, autoComplete, description, error, required, requiredError }) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const fieldError = error || (requiredError ? "Required" : "");
  const describedBy = fieldError ? `${descriptionId} ${errorId}` : descriptionId;

  return (
    <div className={`pcgo-change-password-field ${fieldError ? "has-error" : ""}`}>
      <label htmlFor={id}>
        <span className="pcgo-change-password-field__label">{icon}{label}</span>
        <span className="pcgo-change-password-field__required">{required ? "REQUIRED" : ""}</span>
      </label>
      <input
        id={id}
        name={id}
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-describedby={describedBy}
        aria-invalid={fieldError ? "true" : "false"}
        required={required}
      />
      <p id={descriptionId}>{description}</p>
      {fieldError && <div id={errorId} className="pcgo-change-password-field__error" role="alert"><TriangleAlert size={12} />{fieldError}</div>}
    </div>
  );
}
