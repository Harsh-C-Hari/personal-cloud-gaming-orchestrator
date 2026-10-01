/**
 * components/ui/Toast.jsx
 *
 * Replaces native alert() popups with a themed, non-blocking toast stack.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Game added successfully.");
 *   toast.error(err.message);
 *   toast.warning("Heads up...");
 *   toast.info("Heads up...");
 *
 * Mounted once, high up the tree (see App.jsx) via <ToastProvider>.
 *
 * 1.7 accessibility rules (D6):
 *   - error toasts → role="alert" (assertive); all others → role="status"
 *   - timers pause while the toast is hovered or focused
 *   - success/info auto-dismiss after 4 s; warnings after 5 s
 *   - errors persist until the user closes them (duration: 0)
 *   - close button always present; no focus stealing
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { colors, fonts, radius, shadow, zIndex } from "../../dashboard/theme.js";

const TONE = {
  success: { color: colors.success, icon: <CheckCircle2 size={15} strokeWidth={2} />, role: "status", duration: 4000 },
  error:   { color: colors.danger,  icon: <XCircle size={15} strokeWidth={2} />,       role: "alert",  duration: 0     },
  warning: { color: colors.warning, icon: <AlertTriangle size={15} strokeWidth={2} />, role: "status", duration: 5000 },
  info:    { color: colors.accentBlue, icon: <Info size={15} strokeWidth={2} />,       role: "status", duration: 4000 },
};

const ToastContext = createContext(null);

let toastIdCounter = 0;

/** Individual toast — handles its own hover/focus pause. */
function Toast({ t, dismiss }) {
  const tone = TONE[t.tone] ?? TONE.info;
  const timerRef = useRef(null);
  const remaining = useRef(t.duration);
  const startedAt = useRef(null);

  const startTimer = useCallback(() => {
    if (remaining.current <= 0) return; // persistent (errors)
    startedAt.current = Date.now();
    timerRef.current = setTimeout(() => dismiss(t.id), remaining.current);
  }, [t.id, dismiss]);

  const pauseTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    remaining.current -= Date.now() - (startedAt.current ?? Date.now());
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [startTimer]);

  return (
    <div
      role={tone.role}
      aria-live={tone.role === "alert" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onFocus={pauseTimer}
      onBlur={startTimer}
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
        // Canonical toast-in keyframe defined in base.css (1.1).
        animation: "card-in 0.18s ease forwards",
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
        aria-label="Dismiss notification"
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
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, opts = {}) => {
      const id = ++toastIdCounter;
      const defaultDuration = (TONE[tone] ?? TONE.info).duration;
      const duration = opts.duration ?? defaultDuration;

      setToasts((prev) => [...prev, { id, tone, message, duration }]);
      return id;
    },
    []
  );

  const api = useRef({
    success: (message, opts) => push("success", message, opts),
    error:   (message, opts) => push("error",   message, opts),
    warning: (message, opts) => push("warning", message, opts),
    info:    (message, opts) => push("info",    message, opts),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: "calc(16px + env(safe-area-inset-top, 0px))",
          right: "calc(16px + env(safe-area-inset-right, 0px))",
          zIndex: zIndex.toast,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: "8px",
          width: "min(340px, calc(100vw - 32px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} t={t} dismiss={dismiss} />
        ))}
      </div>
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
