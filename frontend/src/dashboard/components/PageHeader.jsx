import { ArrowLeft } from "lucide-react";
import { colors, fonts, motion, surface, typeScale } from "../theme.js";
import "./feature-page.css";

// PageHeader is imported by all 12 dashboard/pages/*.jsx files — highest
// blast radius of any file in P5-T01, so token substitutions below are
// held to a zero-visual-change bar wherever practical (see CURRENT_TASK.md).
export function PageHeader({ title, subtitle, onBack, backLabel = "Back", actions }) {
  return (
    <div className="pcgo-feature-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>
        {onBack && (
          // typeScale.meta (10px/mono/uppercase) is an exact fontSize/
          // fontFamily/textTransform match for this button's existing
          // values. fontWeight kept at 500 (the actual inherited weight —
          // `button { font: inherit }` from body's 500, since no
          // fontWeight was ever set here, not meta's default 700) and
          // letterSpacing kept at the existing 0.1em (meta's default is
          // 0.12em) so this is a zero-visual-change substitution, same
          // pattern SectionCard.jsx (P4-T01) used.
          <button type="button" onClick={onBack} className="pcgo-feature-back" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", background: "transparent", border: `1px solid transparent`, color: colors.inkFaint, ...typeScale.meta, fontWeight: 500, letterSpacing: "0.1em", cursor: "pointer", padding: "5px 7px", marginLeft: "-7px", transition: `color ${motion.base}, background ${motion.base}, border-color ${motion.base}` }} onMouseEnter={(e) => { e.currentTarget.style.color = colors.ink; e.currentTarget.style.background = surface.l2; e.currentTarget.style.borderColor = colors.border; }} onMouseLeave={(e) => { e.currentTarget.style.color = colors.inkFaint; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
            <ArrowLeft size={12} strokeWidth={2} /> {backLabel}
          </button>
        )}
        <div>
          {/* typeScale.heading is an exact match for this h1's pre-existing
              28px/650/-0.03em/display values (it's literally where D-009
              derived the `heading` step from) — pure alias, no overrides
              needed. */}
          <h1 style={{ margin: 0, ...typeScale.heading, color: colors.ink }}>{title}</h1>
          {/* Left as a literal value, not typeScale.bodySmall: this
              subtitle's existing 12.5px/1.5 doesn't land exactly on
              bodySmall's 12px/1.45 (the defining fontSize itself differs,
              not just a weight/letter-spacing detail SectionCard-style
              overrides could restore) — see CURRENT_TASK.md for the
              full reasoning. Given this component's site-wide blast
              radius, a ~4% size/line-height change on every page's
              subtitle wasn't treated as "close enough" to alias. */}
          {subtitle && <p style={{ margin: "6px 0 0", fontSize: "12.5px", fontWeight: 500, color: colors.inkFaint, fontFamily: fonts.body, lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="pcgo-page-toolbar__actions">{actions}</div>}
    </div>
  );
}
