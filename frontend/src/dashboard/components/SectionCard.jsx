import { RefreshCw } from "lucide-react";
import { colors, fonts, radius } from "../theme.js";
import "./feature-page.css";

export function SectionCard({ title, count, onRefresh, children, bare = false }) {
  return (
    <section className="pcgo-section-card" data-bare={bare ? "true" : "false"}>
      {title && (
        <div className="pcgo-section-card__header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px", columnGap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
            <h2 className="pcgo-section-card__title" style={{ margin: 0, fontSize: "17px", fontWeight: 650, color: colors.ink, fontFamily: fonts.display, overflowWrap: "break-word" }}>{title}</h2>
            {count != null && <span className="pcgo-section-card__count" style={{ color: colors.inkFaint, font: `600 10px/1 ${fonts.mono}`, padding: "4px 7px", border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.sm, flexShrink: 0 }}>{count}</span>}
          </div>
          {onRefresh && (
            <button type="button" onClick={onRefresh} style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "32px", flexShrink: 0, background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.inkFaint, fontSize: "10px", fontWeight: 700, fontFamily: fonts.mono, letterSpacing: "0.08em", padding: "5px 10px", cursor: "pointer", textTransform: "uppercase", transition: "color 160ms ease, border-color 160ms ease, background 160ms ease" }} onMouseEnter={(e) => { e.currentTarget.style.color = colors.ink; e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.background = colors.bgCardHover; }} onMouseLeave={(e) => { e.currentTarget.style.color = colors.inkFaint; e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.bgElevated; }}>
              <RefreshCw size={11} strokeWidth={2} /> Refresh
            </button>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
