/**
 * components/ui/Toast.jsx
 *
 * Replaces native alert() popups with a themed, non-blocking toast stack.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Game added successfully.");
 *   toast.error(err.message);
 *   toast.warning("Game ID required");
 *   toast.info("Heads up...");
 *
 * Mounted once, high up the tree (see App.jsx) via <ToastProvider>.
 */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { colors, fonts, radius, shadow } from "../../dashboard/theme.js";

const TONE = {
  success: { color: colors.success, icon: <CheckCircle2 size={15} strokeWidth={2} /> },
  error: { color: colors.danger, icon: <XCircle size={15} strokeWidth={2} /> },
  warning: { color: colors.warning, icon: <AlertTriangle size={15} strokeWidth={2} /> },
  info: { color: colors.accentBlue, icon: <Info size={15} strokeWidth={2} /> },
};

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, opts = {}) => {
      const id = ++toastIdCounter;
      const duration = opts.duration ?? (tone === "error" ? 6000 : 4000);

      setToasts((prev) => [...prev, { id, tone, message }]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const api = useRef({
    success: (message, opts) => push("success", message, opts),
    error: (message, opts) => push("error", message, opts),
    warning: (message, opts) => push("warning", message, opts),
    info: (message, opts) => push("info", message, opts),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        style={{
          position: "fixed",
          top: "calc(16px + env(safe-area-inset-top, 0px))",
          right: "calc(16px + env(safe-area-inset-right, 0px))",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "8px",
          width: "min(340px, calc(100vw - 32px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const tone = TONE[t.tone] ?? TONE.info;
          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "flex-start",
                gap: "9px",
                padding: "11px 12px",
                borderRadius: `${radius.md}px`,
                background: colors.bgCard,
                border: `1.5px solid ${colors.border}`,
                borderLeft: `3px solid ${tone.color}`,
                boxShadow: shadow.overlay,
                animation: "toast-in 0.18s ease forwards",
              }}
            >
              <span style={{ color: tone.color, flexShrink: 0, marginTop: "1px" }}>{tone.icon}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: "12.5px",
                  color: colors.ink,
                  fontFamily: fonts.body,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  border: "none",
                  color: colors.inkFaint,
                  cursor: "pointer",
                  width: "28px",
                  height: "28px",
                  margin: "-6px -6px -6px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be used within a <ToastProvider>");
  }
  return ctx;
}
