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
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

const palette = {
  card: "#0b0e16",
  border: "#1c2130",
  text: "#e2e8f0",
  faint: "#64748b",
  mono: "'JetBrains Mono', monospace",
};

const TONE = {
  success: { color: "#10d98a", icon: <FaCheckCircle size={13} /> },
  error: { color: "#f43f5e", icon: <FaTimesCircle size={13} /> },
  warning: { color: "#f5a524", icon: <FaExclamationTriangle size={13} /> },
  info: { color: "#38bdf8", icon: <FaInfoCircle size={13} /> },
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
          top: "16px",
          right: "16px",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "340px",
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
                borderRadius: "8px",
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderLeft: `3px solid ${tone.color}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                animation: "toast-in 0.18s ease forwards",
              }}
            >
              <span style={{ color: tone.color, flexShrink: 0, marginTop: "1px" }}>{tone.icon}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: "11.5px",
                  color: palette.text,
                  fontFamily: palette.mono,
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
                  color: palette.faint,
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                }}
              >
                <FaTimes size={10} />
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
