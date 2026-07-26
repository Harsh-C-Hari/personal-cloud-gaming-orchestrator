/**
 * components/ui/ConfirmDialog.jsx
 *
 * Replaces native window.confirm() popups with a themed modal.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm("Delete this game? This cannot be undone.", {
 *     danger: true,
 *     confirmLabel: "Delete",
 *   });
 *   if (!ok) return;
 *
 * Mounted once, high up the tree (see App.jsx) via <ConfirmDialogProvider>.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { FaExclamationTriangle, FaQuestionCircle } from "react-icons/fa";

const palette = {
  card: "#0b0e16",
  border: "#1c2130",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  accent: "#38bdf8",
  danger: "#f43f5e",
  mono: "'JetBrains Mono', monospace",
};

const ConfirmContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setDialog({
        message,
        title: opts.title ?? (opts.danger ? "Are you sure?" : "Confirm"),
        confirmLabel: opts.confirmLabel ?? "Confirm",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        danger: opts.danger ?? false,
        resolve,
      });
    });
  }, []);

  const close = useCallback(
    (result) => {
      dialog?.resolve(result);
      setDialog(null);
    },
    [dialog]
  );

  useEffect(() => {
    if (!dialog) return;
    function onKeyDown(e) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div
          role="presentation"
          onClick={() => close(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(2,6,23,0.7)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "confirm-backdrop-in 0.15s ease forwards",
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
              animation: "confirm-card-in 0.18s ease forwards",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  flexShrink: 0,
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dialog.danger ? "rgba(244,63,94,0.12)" : "rgba(56,189,248,0.12)",
                  border: `1px solid ${dialog.danger ? "rgba(244,63,94,0.35)" : "rgba(56,189,248,0.3)"}`,
                  color: dialog.danger ? palette.danger : palette.accent,
                }}
              >
                {dialog.danger ? <FaExclamationTriangle size={14} /> : <FaQuestionCircle size={14} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: palette.text,
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  {dialog.title}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11.5px",
                    color: palette.dim,
                    fontFamily: palette.mono,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                  }}
                >
                  {dialog.message}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                onClick={() => close(false)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "7px",
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.faint,
                  fontSize: "11px",
                  fontFamily: palette.mono,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148,163,184,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {dialog.cancelLabel}
              </button>

              <button
                onClick={() => close(true)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "7px",
                  border: `1px solid ${dialog.danger ? "rgba(244,63,94,0.45)" : "rgba(56,189,248,0.45)"}`,
                  background: dialog.danger ? "rgba(244,63,94,0.1)" : "rgba(56,189,248,0.1)",
                  color: dialog.danger ? palette.danger : palette.accent,
                  fontSize: "11px",
                  fontFamily: palette.mono,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = dialog.danger ? "rgba(244,63,94,0.18)" : "rgba(56,189,248,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = dialog.danger ? "rgba(244,63,94,0.1)" : "rgba(56,189,248,0.1)")
                }
                autoFocus
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confirm-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes confirm-card-in {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm() must be used within a <ConfirmDialogProvider>");
  }
  return ctx;
}
