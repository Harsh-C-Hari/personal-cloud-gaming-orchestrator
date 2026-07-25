/**
 * dashboard/components/PageHeader.jsx
 *
 * Every feature page renders this at the top:
 *   ‹ Back    Title                                  [optional actions]
 */

import { FaArrowLeft } from "react-icons/fa";
import { colors, fonts } from "../theme.js";

export function PageHeader({ title, subtitle, onBack, backLabel = "Back", actions }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "28px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              alignSelf: "flex-start",
              background: "transparent",
              border: "none",
              color: colors.textFaint,
              fontSize: "10px",
              fontFamily: fonts.mono,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textFaint)}
          >
            <FaArrowLeft size={9} />
            {backLabel}
          </button>
        )}

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: colors.text,
              fontFamily: fonts.display,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "11.5px",
                color: colors.textFaint,
                fontFamily: fonts.mono,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>{actions}</div>}
    </div>
  );
}
