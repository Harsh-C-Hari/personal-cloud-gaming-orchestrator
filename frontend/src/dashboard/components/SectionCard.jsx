/**
 * dashboard/components/SectionCard.jsx
 *
 * Generic section wrapper: title + optional count badge + optional refresh
 * button + content. Same visual language as the old inline SectionHeader
 * from pages/Dashboard.jsx, generalized so every page can compose with it.
 */

import { FaSyncAlt } from "react-icons/fa";
import { colors, fonts } from "../theme.js";

export function SectionCard({ title, count, onRefresh, children, bare = false }) {
  return (
    <section
      style={
        bare
          ? {}
          : {
              ...{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: "10px" },
              padding: "20px 22px",
            }
      }
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "9.5px",
                color: colors.textMuted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: fonts.mono,
              }}
            >
              {title}
            </span>

            {count != null && (
              <span
                style={{
                  fontSize: "9px",
                  color: colors.textGhost,
                  fontFamily: fonts.mono,
                  padding: "1px 7px",
                  border: `1px solid ${colors.borderSubtle}`,
                  borderRadius: "10px",
                }}
              >
                {count}
              </span>
            )}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "4px",
                color: colors.textGhost,
                fontSize: "9px",
                fontFamily: fonts.mono,
                letterSpacing: "0.1em",
                padding: "3px 10px",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.textMuted;
                e.currentTarget.style.borderColor = colors.textGhost;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textGhost;
                e.currentTarget.style.borderColor = colors.borderSubtle;
              }}
            >
              <FaSyncAlt size={8} />
              REFRESH
            </button>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
