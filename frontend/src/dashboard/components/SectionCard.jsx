import { RefreshCw } from "lucide-react";
import { colors, motion, radius, surface, typeScale } from "../theme.js";
import "./feature-page.css";

export function SectionCard({ title, count, onRefresh, children, bare = false }) {
  return (
    <section className="pcgo-section-card" data-bare={bare ? "true" : "false"}>
      {title && (
        <div className="pcgo-section-card__header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px", columnGap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
            {/* Card title -> typeScale.subheading (same 17px step). fontWeight
                kept at 650 (subheading's default is 600) and letterSpacing
                kept at the existing -0.02em (subheading's default is -0.01em,
                already set by the .pcgo-section-card__title CSS rule) so this
                is a zero-visual-change token substitution, not a redesign —
                same pattern P2-T01 used to preserve brand/badge character. */}
            <h2 className="pcgo-section-card__title" style={{ margin: 0, ...typeScale.subheading, fontWeight: 650, letterSpacing: "-0.02em", color: colors.ink, overflowWrap: "break-word" }}>{title}</h2>
            {count != null && (
              /* Count badge -> typeScale.meta (same 10px/mono step). fontWeight
                 kept at 600 (meta's default is 700) and lineHeight kept at 1
                 (meta's default is 1.3) to preserve the tight numeric-badge
                 look; letterSpacing/uppercase from meta are no-ops on digits. */
              <span className="pcgo-section-card__count" style={{ color: colors.inkFaint, ...typeScale.meta, fontWeight: 600, lineHeight: 1, padding: "4px 7px", border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.sm, flexShrink: 0 }}>{count}</span>
            )}
          </div>
          {onRefresh && (
            <button type="button" onClick={onRefresh} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "32px", flexShrink: 0, background: surface.l2, border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.inkFaint, ...typeScale.meta, letterSpacing: "0.08em", padding: "5px 10px", cursor: "pointer", transition: `color ${motion.base}, border-color ${motion.base}, background ${motion.base}` }} onMouseEnter={(e) => { e.currentTarget.style.color = colors.ink; e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.background = surface.l4; }} onMouseLeave={(e) => { e.currentTarget.style.color = colors.inkFaint; e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = surface.l2; }}>
              <RefreshCw size={11} strokeWidth={2} /> Refresh
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
