/**
 * dashboard/components/NavigationCard.jsx
 *
 * A single tappable tile in the Home page's "Quick Navigation" grid.
 */

import { Chip } from "../../components/ui/primitives.jsx";
import { colors, fonts, radius } from "../theme.js";

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
        borderRadius: `${radius.lg}px`,
        border: `1.5px solid ${colors.border}`,
        background: colors.bgCard,
        cursor: "pointer",
        transition: "transform 150ms ease, border-color 150ms ease, background 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.borderStrong;
        e.currentTarget.style.background = colors.bgCardHover;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.background = colors.bgCard;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontSize: "20px", color: colors.ink, lineHeight: 1 }}>{icon}</span>
        {badge != null && <Chip tone="blue">{badge}</Chip>}
      </div>

      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: colors.ink,
            fontFamily: fonts.display,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: "11.5px",
              fontWeight: 500,
              color: colors.inkFaint,
              marginTop: "3px",
              fontFamily: fonts.body,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
