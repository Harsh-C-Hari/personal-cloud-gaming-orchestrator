/**
 * components/ui/primitives.jsx
 *
 * Shared, reusable presentational building blocks for the
 * "Chalkboard Neo-Brutalist" design system (see DESIGN_SYSTEM.md §5).
 *
 * Everything here is self-styled from `dashboard/theme.js` tokens using
 * inline styles (this codebase's convention — no Tailwind classes, despite
 * Tailwind being installed). Nothing in this file holds app state or talks
 * to the API; these are pure UI primitives meant to be composed by pages
 * and feature components in later phases.
 */

import { forwardRef, useState } from "react";
import { Inbox } from "lucide-react";
import { colors, fonts, radius } from "../../dashboard/theme.js";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const BUTTON_VARIANTS = {
  primary: {
    background: colors.ink,
    color: colors.bg,
    border: "1.5px solid transparent",
  },
  secondary: {
    background: "transparent",
    color: colors.ink,
    border: `1.5px solid ${colors.borderInk}`,
  },
  ghost: {
    background: "transparent",
    color: colors.inkDim,
    border: "1.5px solid transparent",
  },
  danger: {
    background: "transparent",
    color: colors.danger,
    border: `1.5px solid ${colors.danger}`,
  },
  dangerFilled: {
    background: colors.danger,
    color: colors.bg,
    border: "1.5px solid transparent",
  },
};

const BUTTON_HOVER_BG = {
  secondary: "rgba(237,235,227,0.08)",
  ghost: "rgba(237,235,227,0.06)",
  danger: "rgba(255,107,107,0.1)",
};

/**
 * Flat pill button. Variants: primary (filled), secondary (outline),
 * ghost (no border), danger (outline), dangerFilled (solid, destructive
 * confirm only). See DESIGN_SYSTEM.md §5.
 *
 * @param {{ variant?: 'primary'|'secondary'|'ghost'|'danger'|'dangerFilled', disabled?: boolean }} props
 */
export const Button = forwardRef(function Button(
  { variant = "primary", disabled = false, children, style, onClick, type = "button", ...rest },
  ref
) {
  const base = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary;
  const hoverBg = BUTTON_HOVER_BG[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.filter = "brightness(1.06)";
        } else if (hoverBg) {
          e.currentTarget.style.background = hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.filter = "none";
        } else if (hoverBg) {
          e.currentTarget.style.background = base.background;
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.97)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px 20px",
        minHeight: "44px",
        borderRadius: `${radius.full}px`,
        fontFamily: fonts.body,
        fontSize: "13.5px",
        fontWeight: 600,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "filter 150ms ease, background 150ms ease, transform 100ms ease",
        userSelect: "none",
        whiteSpace: "nowrap",
        ...base,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/**
 * Flat bordered card. `hoverable` brightens the border and lifts 1px on
 * hover — the only "lift" effect in the system (no drop shadows).
 *
 * @param {{ hoverable?: boolean }} props
 */
export function Card({ children, hoverable = false, style, ...rest }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        background: colors.bgCard,
        border: `1.5px solid ${hover ? colors.borderStrong : colors.border}`,
        borderRadius: `${radius.lg}px`,
        padding: "20px",
        transition: "border-color 150ms ease, transform 150ms ease",
        transform: hoverable && hover ? "translateY(-1px)" : "translateY(0)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

const CHIP_TONES = {
  neutral: { color: colors.inkDim, bg: "rgba(237,235,227,0.08)" },
  lilac: { color: colors.accentLilac, bg: colors.accentLilacDim },
  pink: { color: colors.accentPink, bg: colors.accentPinkDim },
  blue: { color: colors.accentBlue, bg: colors.accentBlueDim },
  green: { color: colors.accentGreen, bg: colors.accentGreenDim },
  yellow: { color: colors.accentYellow, bg: colors.accentYellowDim },
  success: { color: colors.success, bg: "rgba(110,231,176,0.14)" },
  warning: { color: colors.warning, bg: "rgba(245,215,110,0.14)" },
  danger: { color: colors.danger, bg: "rgba(255,107,107,0.14)" },
  info: { color: colors.info, bg: "rgba(126,200,242,0.14)" },
};

/**
 * Flat pill tag — colored bg wash + solid text, no border. For status pills
 * with a dot + outline, see StatusBadge instead.
 *
 * @param {{ tone?: keyof typeof CHIP_TONES }} props
 */
export function Chip({ children, tone = "neutral", icon, style, ...rest }) {
  const t = CHIP_TONES[tone] ?? CHIP_TONES.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: `${radius.full}px`,
        background: t.bg,
        color: t.color,
        fontFamily: fonts.body,
        fontSize: "10.5px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        userSelect: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Squiggle divider
// ---------------------------------------------------------------------------

/**
 * Thin hand-drawn wavy inline SVG divider — TinkerHub's signature motif,
 * used between major sections on top-to-bottom pages instead of a plain
 * <hr>. See DESIGN_SYSTEM.md §5.
 *
 * @param {{ width?: number }} props
 */
export function Squiggle({ width = 120, style }) {
  return (
    <svg
      width={width}
      height={16}
      viewBox="0 0 120 16"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path
        d="M2 8 C 12 2, 22 14, 32 8 S 52 2, 62 8 S 82 14, 92 8 S 112 2, 118 8"
        stroke={colors.borderStrong}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

/**
 * Thin-stroke circular spinner (border-box trick — one side colored,
 * rotating). No glow, no gradient conic-spinner.
 *
 * @param {{ size?: number }} props
 */
export function Spinner({ size = 20, style }) {
  return (
    <>
      <span
        role="status"
        aria-label="Loading"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid rgba(237,235,227,0.15)",
          borderTopColor: colors.ink,
          animation: "cgo-spin 0.7s linear infinite",
          flexShrink: 0,
          ...style,
        }}
      />
      <style>{`
        @keyframes cgo-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

/**
 * Centered icon-in-a-circle + message + optional sub-text + optional
 * secondary action. Uses lucide-react icons.
 *
 * @param {{ icon?: React.ComponentType, message: string, subtext?: string, actionLabel?: string, onAction?: () => void }} props
 */
export function EmptyState({ icon: Icon = Inbox, message, subtext, actionLabel, onAction, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        gap: "12px",
        ...style,
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(237,235,227,0.06)",
          color: colors.inkDim,
          flexShrink: 0,
        }}
      >
        <Icon size={24} strokeWidth={1.5} />
      </div>

      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: "14.5px",
          color: colors.ink,
        }}
      >
        {message}
      </div>

      {subtext && (
        <div
          style={{
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: "12.5px",
            color: colors.inkFaint,
            maxWidth: "320px",
            lineHeight: 1.5,
          }}
        >
          {subtext}
        </div>
      )}

      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} style={{ marginTop: "4px" }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
