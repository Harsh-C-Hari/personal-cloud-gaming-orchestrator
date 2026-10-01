/**
 * components/ui/primitives.jsx
 *
 * Shared primitives: Button, Card, Chip, Spinner, EmptyState.
 *
 * 3.1: Button rebuilt — CSS-only states, no GSAP/magnetic, no JS style mutation.
 *      radius.sm (8px), 14px/500, loading prop, scale(0.97) press.
 * 3.6: Card updated — radius.md (12px), no translateY hover lift, no JS hover.
 * 2.3: Chip updated — 12px sentence case (was 10px uppercase).
 */

import { forwardRef } from "react";
import { Inbox } from "lucide-react";
import { colors, fonts, radius, shadow, motion } from "../../dashboard/theme.js";
import { Spinner } from "./Spinner.jsx";
// Re-export so existing `import { Spinner } from "./ui/primitives.jsx"` still works
export { Spinner };

/* ─── CSS injected once ─────────────────────────────────────────────────── */
// Injecting via a module-level side-effect so we don't pay a React render.
if (typeof document !== "undefined" && !document.getElementById("pcgo-btn-styles")) {
  const s = document.createElement("style");
  s.id = "pcgo-btn-styles";
  s.textContent = `
    .pcgo-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 40px;
      padding: 9px 16px;
      border-radius: 8px;
      font-family: 'IBM Plex Sans', system-ui, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
      cursor: pointer;
      touch-action: manipulation;
      transition:
        background-color 160ms ease,
        border-color     160ms ease,
        color            160ms ease,
        transform        100ms ease,
        opacity          160ms ease;
    }
    /* Sizes */
    .pcgo-btn--sm {
      min-height: 32px;
      padding: 6px 12px;
      font-size: 13px;
      position: relative;
    }
    /* ::after expands hit area to 40px on small buttons */
    .pcgo-btn--sm::after {
      content: '';
      position: absolute;
      inset: -4px;
    }

    /* Press */
    @media (hover: hover) {
      .pcgo-btn:not(:disabled):hover { opacity: 0.88; }
    }
    .pcgo-btn:not(:disabled):active {
      transform: scale(0.97);
      opacity: 1;
    }

    /* Disabled */
    .pcgo-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading */
    .pcgo-btn[aria-busy="true"] {
      cursor: wait;
      pointer-events: none;
      opacity: 0.75;
    }

    /* Variants */
    .pcgo-btn--primary   { background: #ffffff; color: #0a0a0a; border: 1px solid transparent; }
    .pcgo-btn--secondary { background: transparent; color: #e8e6e1; border: 1px solid rgba(255,255,255,0.28); }
    .pcgo-btn--ghost     { background: transparent; color: #a8a49e; border: 1px solid transparent; }
    .pcgo-btn--danger    { background: transparent; color: #f07f83; border: 1px solid rgba(240,127,131,0.45); }
    .pcgo-btn--danger-solid { background: #f07f83; color: #0a0a0a; border: 1px solid transparent; }

    @media (hover: hover) {
      .pcgo-btn--primary:not(:disabled):hover   { background: #f0ece4; opacity: 1; }
      .pcgo-btn--secondary:not(:disabled):hover { background: rgba(241,240,236,0.08); border-color: rgba(255,255,255,0.45); opacity: 1; }
      .pcgo-btn--ghost:not(:disabled):hover     { background: rgba(241,240,236,0.06); color: #e8e6e1; opacity: 1; }
      .pcgo-btn--danger:not(:disabled):hover    { background: rgba(240,127,131,0.12); opacity: 1; }
      .pcgo-btn--danger-solid:not(:disabled):hover { background: #e87077; opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

/* ─── Button ────────────────────────────────────────────────────────────── */
/**
 * @param {{
 *   variant?: "primary"|"secondary"|"ghost"|"danger"|"dangerFilled"|"danger-solid",
 *   size?: "md"|"sm",
 *   loading?: boolean,
 *   disabled?: boolean,
 *   children: React.ReactNode,
 *   style?: React.CSSProperties,
 *   onClick?: (e: MouseEvent) => void,
 *   type?: string,
 * }} props
 */
export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, disabled = false, children, style, onClick, type = "button", className = "", ...rest },
  ref,
) {
  // Support legacy "dangerFilled" alias from call sites
  const v = variant === "dangerFilled" ? "danger-solid" : variant;
  const cls = [
    "pcgo-btn",
    `pcgo-btn--${v}`,
    size === "sm" ? "pcgo-btn--sm" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      onClick={disabled || loading ? undefined : onClick}
      className={cls}
      style={style}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
});

/* ─── Card ──────────────────────────────────────────────────────────────── */
/**
 * Base surface card. Cards separate with borders + surface steps, not shadows.
 * Hover lift removed (3.6) — only genuinely clickable cards should lift.
 */
export function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background:   colors.bgCard,
        border:       `1px solid ${colors.border}`,
        borderRadius: `${radius.md}px`,
        boxShadow:    shadow.flat,
        padding:      "20px",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── Chip ──────────────────────────────────────────────────────────────── */
const CHIP_TONES = {
  neutral: { color: colors.inkDim,       bg: "rgba(241,240,236,0.08)" },
  blue:    { color: colors.accentBlue,   bg: colors.accentBlueDim     },
  green:   { color: colors.accentGreen,  bg: colors.accentGreenDim    },
  yellow:  { color: colors.accentYellow, bg: colors.accentYellowDim   },
  success: { color: colors.success,      bg: "rgba(123,215,167,0.13)" },
  warning: { color: colors.warning,      bg: "rgba(235,203,115,0.13)" },
  danger:  { color: colors.danger,       bg: "rgba(240,127,131,0.13)" },
  info:    { color: colors.info,         bg: "rgba(140,196,232,0.13)" },
};

export function Chip({ children, tone = "neutral", icon, style, ...rest }) {
  const t = CHIP_TONES[tone] ?? CHIP_TONES.neutral;
  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          "6px",
        padding:      "3px 8px",
        borderRadius: `${radius.tight}px`,
        background:   t.bg,
        color:        t.color,
        fontFamily:   fonts.body,
        fontSize:     "12px",
        fontWeight:   500,
        userSelect:   "none",
        whiteSpace:   "nowrap",
        flexShrink:   0,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

/* ─── EmptyState ────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, message, subtext, actionLabel, onAction, style }) {
  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        textAlign:      "center",
        padding:        "44px 20px",
        gap:            "12px",
        ...style,
      }}
    >
      {/* Unboxed icon per 3.11 — remove icon wells in empty states */}
      <Icon size={28} strokeWidth={1.75} aria-hidden="true" style={{ color: colors.inkFaint }} />
      <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: "15px", color: colors.ink }}>{message}</div>
      {subtext && (
        <div style={{ fontFamily: fonts.body, fontWeight: 400, fontSize: "13px", color: colors.inkFaint, maxWidth: "340px", lineHeight: 1.55 }}>
          {subtext}
        </div>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} style={{ marginTop: "4px" }}>{actionLabel}</Button>
      )}
    </div>
  );
}
