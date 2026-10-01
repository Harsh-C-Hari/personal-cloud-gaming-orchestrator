/**
 * components/ui/primitives.jsx
 *
 * Shared primitives: Button, IconButton, Card, Chip, EmptyState,
 *                    StatCard, KeyValueRow, DataTable.
 *
 * 3.1: Button rebuilt — CSS-only states, no GSAP/magnetic, no JS style mutation.
 *      radius.sm (8px), 14px/500, loading prop, scale(0.97) press.
 * 3.6: Card updated — radius.md (12px), no translateY hover lift, no JS hover.
 * 2.3: Chip updated — 12px sentence case (was 10px uppercase).
 * 3.7: StatCard — label-above-value tile, 28px tabular, no boxed icon well.
 * 3.8: KeyValueRow — spec-sheet row with dotted fill, compact variant.
 * 3.9: DataTable — real <table> with scope="col", overflow wrapper, tabular-nums.
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

    /* IconButton — square, centred icon */
    .pcgo-icon-btn {
      padding: 0;
      border-radius: 8px;
      position: relative;
    }
    /* sm IconButton: 32px visual, 40px hit area */
    .pcgo-icon-btn--sm::after {
      content: '';
      position: absolute;
      inset: -4px;
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
      {loading ? <Spinner size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

/* ─── IconButton ─────────────────────────────────────────────────────────── */
/**
 * Square icon-only button. Always requires aria-label.
 * Hit area is always ≥ 40px (visual may be 32px via ::after).
 *
 * @param {{
 *   "aria-label": string,
 *   variant?: "ghost"|"secondary"|"danger",
 *   size?: "md"|"sm",
 *   children: React.ReactNode,
 *   disabled?: boolean,
 *   style?: React.CSSProperties,
 * }} props
 */
export const IconButton = forwardRef(function IconButton(
  { "aria-label": label, variant = "ghost", size = "md", children, disabled = false, style, onClick, type = "button", ...rest },
  ref,
) {
  if (process.env.NODE_ENV !== "production" && !label) {
    console.warn("[IconButton] Missing aria-label. All icon-only buttons must have an accessible label.");
  }
  const dim = size === "sm" ? 32 : 40;
  const v = variant === "dangerFilled" ? "danger-solid" : variant;
  const cls = ["pcgo-btn", `pcgo-btn--${v}`, "pcgo-icon-btn", size === "sm" ? "pcgo-icon-btn--sm" : ""].filter(Boolean).join(" ");

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cls}
      style={{
        width:    dim,
        height:   dim,
        minHeight: dim,
        padding:  0,
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
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

/* ─── 3.7 StatCard ──────────────────────────────────────────────────────────
 * Label (12px faint, sentence case) above value (28px tabular, sans).
 * Optional unit suffix and sub-line. No boxed icon wells.
 * Usage: <StatCard label="Sessions today" value={42} unit="sessions" />
 * ────────────────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, unit, sub, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...style }}>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: colors.inkFaint,
          fontFamily: fonts.body,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
        <span
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: colors.ink,
            fontFamily: fonts.body,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {value ?? "--"}
        </span>
        {unit && (
          <span style={{ fontSize: "12px", fontWeight: 500, color: colors.inkFaint, fontFamily: fonts.body }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: "12px", fontWeight: 400, color: colors.inkFaint, fontFamily: fonts.body, lineHeight: 1.4 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ─── 3.8 KeyValueRow ───────────────────────────────────────────────────────
 * Spec-sheet row: label (mono, faint) — dotted fill — value (mono, ink).
 * `compact` reduces font sizes for tight contexts (Host Monitor stat grids).
 * Usage: <KeyValueRow label="Hostname" value="gaming-rig" />
 * ────────────────────────────────────────────────────────────────────────── */
export function KeyValueRow({ label, value, compact, action, style }) {
  return (
    <div
      className="pcgo-kv-row"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        minWidth: 0,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: compact ? "10px" : "10.5px",
          color: colors.inkFaint,
          whiteSpace: "nowrap",
          fontFamily: fonts.mono,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          borderBottom: `1px dotted ${colors.border}`,
          marginBottom: "3px",
        }}
      />
      <span
        style={{
          fontSize: compact ? "10.5px" : "11.5px",
          fontWeight: 600,
          color: colors.ink,
          fontFamily: fonts.mono,
          textAlign: "right",
          maxWidth: "60%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value ?? "--"}
      </span>
      {action && (
        <span style={{ flexShrink: 0 }}>{action}</span>
      )}
    </div>
  );
}

/* ─── 3.9 DataTable ─────────────────────────────────────────────────────────
 * Real <table> with scope="col", right-aligned numerics, overflow scroll.
 * Columns: [{ key, label, align?, render? }, ...]
 * Usage: <DataTable columns={cols} rows={data} keyField="id" />
 * ────────────────────────────────────────────────────────────────────────── */
export const DataTable = forwardRef(function DataTable(
  { columns, rows = [], keyField = "id", emptyMessage = "No data", "aria-label": ariaLabel, style },
  ref
) {
  return (
    <div
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel ?? "Data table"}
      style={{
        overflowX: "auto",
        borderRadius: `${radius.md}px`,
        border: `1px solid ${colors.borderSubtle}`,
        ...style,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: fonts.body,
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  padding: "10px 14px",
                  textAlign: col.align === "right" ? "right" : "left",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: colors.inkFaint,
                  fontFamily: fonts.mono,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                  whiteSpace: "nowrap",
                  background: colors.bgInset,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "32px 14px",
                  textAlign: "center",
                  color: colors.inkFaint,
                  fontSize: "13px",
                  fontFamily: fonts.body,
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row[keyField] ?? i}
                style={{
                  borderBottom: i < rows.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "10px 14px",
                      textAlign: col.align === "right" ? "right" : "left",
                      color: colors.ink,
                      fontVariantNumeric: col.align === "right" ? "tabular-nums" : undefined,
                      verticalAlign: "middle",
                      maxWidth: col.maxWidth ?? "240px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "--")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

