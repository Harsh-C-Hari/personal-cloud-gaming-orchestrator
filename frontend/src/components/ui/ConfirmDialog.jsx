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
import { AlertTriangle, HelpCircle } from "lucide-react";
import { colors, fonts, radius, shadow } from "../../dashboard/theme.js";

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
            background: "rgba(0,0,0,0.6)",
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
              maxHeight: "min(85vh, 85dvh)",
              overflowY: "auto",
              background: colors.bgCard,
              border: `1.5px solid ${colors.border}`,
              borderRadius: `${radius.lg}px`,
              padding: "20px",
              boxShadow: shadow.overlay,
              animation: "confirm-card-in 0.18s ease forwards",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  flexShrink: 0,
                  width: "34px",
                  height: "34px",
                  borderRadius: `${radius.sm}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dialog.danger ? "rgba(255,107,107,0.14)" : "rgba(224,164,88,0.14)",
                  border: `1.5px solid ${dialog.danger ? "rgba(255,107,107,0.35)" : "rgba(224,164,88,0.3)"}`,
                  color: dialog.danger ? colors.danger : colors.brand,
                }}
              >
                {dialog.danger ? <AlertTriangle size={16} strokeWidth={2} /> : <HelpCircle size={16} strokeWidth={2} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14.5px",
                    fontWeight: 700,
                    color: colors.ink,
                    fontFamily: fonts.display,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {dialog.title}
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12.5px",
                    color: colors.inkDim,
                    fontFamily: fonts.body,
                    fontWeight: 500,
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
                  minHeight: "44px",
                  borderRadius: `${radius.full}px`,
                  border: `1.5px solid ${colors.borderInk}`,
                  background: "transparent",
                  color: colors.ink,
                  fontSize: "12px",
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,235,227,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {dialog.cancelLabel}
              </button>

              <button
                onClick={() => close(true)}
                style={{
                  flex: 1,
                  padding: "9px",
                  minHeight: "44px",
                  borderRadius: `${radius.full}px`,
                  border: "1.5px solid transparent",
                  background: dialog.danger ? colors.danger : colors.ink,
                  color: colors.bg,
                  fontSize: "12px",
                  fontFamily: fonts.body,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
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
