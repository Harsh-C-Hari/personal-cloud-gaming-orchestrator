import { ArrowLeft } from "lucide-react";
import { colors, fonts } from "../theme.js";
import "./feature-page.css";

export function PageHeader({ title, subtitle, onBack, backLabel = "Back", actions }) {
  return (
    <div className="pcgo-feature-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px", minWidth: 0 }}>
        {onBack && (
          <button type="button" onClick={onBack} className="pcgo-feature-back" style={{ display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", background: "transparent", border: `1px solid transparent`, color: colors.inkFaint, fontSize: "10px", fontFamily: fonts.mono, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: "5px 7px", marginLeft: "-7px", transition: "color 160ms ease, background 160ms ease, border-color 160ms ease" }} onMouseEnter={(e) => { e.currentTarget.style.color = colors.ink; e.currentTarget.style.background = colors.bgElevated; e.currentTarget.style.borderColor = colors.border; }} onMouseLeave={(e) => { e.currentTarget.style.color = colors.inkFaint; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
            <ArrowLeft size={12} strokeWidth={2} /> {backLabel}
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 650, letterSpacing: "-0.03em", color: colors.ink, fontFamily: fonts.display }}>{title}</h1>
          {subtitle && <p style={{ margin: "6px 0 0", fontSize: "12.5px", fontWeight: 500, color: colors.inkFaint, fontFamily: fonts.body, lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="pcgo-page-toolbar__actions">{actions}</div>}
    </div>
  );
}
