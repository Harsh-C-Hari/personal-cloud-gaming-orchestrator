import { ArrowLeft } from "lucide-react";
import { colors, fonts, typeScale } from "../theme.js";
import { Eyebrow } from "../../components/ui/Eyebrow.jsx";
import "./feature-page.css";

// PageHeader is imported by all 12 dashboard/pages/*.jsx files — highest
// blast radius of any file in P5-T01, so token substitutions below are
// held to a zero-visual-change bar wherever practical (see CURRENT_TASK.md).
//
// `eyebrow` is optional (ReactNode or string). When present, renders a
// <Eyebrow> above the <h1> for pages that want a section-level kicker.
export function PageHeader({ title, subtitle, onBack, backLabel = "Back", actions, eyebrow }) {
  return (
    <div className="pcgo-feature-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>
        {onBack && (
          // 3.9: back button uses pcgo-btn CSS class instead of onMouseEnter/Leave style mutation
          <button
            type="button"
            onClick={onBack}
            className="pcgo-btn pcgo-btn--ghost pcgo-feature-back"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              alignSelf: "flex-start",
              minHeight: "auto",
              padding: "5px 7px",
              marginLeft: "-7px",
              fontSize: "10px",
              fontFamily: fonts.mono,
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
          >
            <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" /> {backLabel}
          </button>
        )}
        <div>
          {eyebrow && <Eyebrow style={{ marginBottom: 8 }}>{eyebrow}</Eyebrow>}
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
