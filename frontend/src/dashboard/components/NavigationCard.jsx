/**
 * dashboard/components/NavigationCard.jsx
 *
 * A single tappable tile in the Home page's "Quick Navigation" grid.
 */

import { colors, fonts } from "../theme.js";

export function NavigationCard({ icon, label, description, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        textAlign: "left",
        padding: "18px",
        borderRadius: "10px",
        border: `1px solid ${colors.border}`,
        background: colors.bgCard,
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.borderStrong;
        e.currentTarget.style.background = colors.bgCardHover;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.background = colors.bgCard;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontSize: "20px",color: colors.text , lineHeight: 1 }}>{icon}</span>
        {badge != null && (
          <span
            style={{
              fontSize: "9px",
              fontFamily: fonts.mono,
              color: colors.accent,
              border: `1px solid ${colors.accentDim}`,
              background: colors.accentDim,
              borderRadius: "10px",
              padding: "1px 7px",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: colors.text,
            fontFamily: fonts.display,
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: "10.5px",
              color: colors.textFaint,
              marginTop: "3px",
              fontFamily: fonts.mono,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
