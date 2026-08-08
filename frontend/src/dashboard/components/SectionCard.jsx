/**
 * dashboard/components/SectionCard.jsx
 *
 * Generic section wrapper: title + optional count badge + optional refresh
 * button + content. Same visual language as the old inline SectionHeader
 * from pages/Dashboard.jsx, generalized so every page can compose with it.
 */

import { RefreshCw } from "lucide-react";
import { colors, fonts, radius } from "../theme.js";

export function SectionCard({ title, count, onRefresh, children, bare = false }) {
  return (
    <section
      style={
        bare
          ? {}
          : {
              background: colors.bgCard,
              border: `1.5px solid ${colors.border}`,
              borderRadius: `${radius.lg}px`,
              padding: "20px",
            }
      }
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            rowGap: "8px",
            columnGap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: colors.ink,
                fontFamily: fonts.display,
                overflowWrap: "break-word",
              }}
            >
              {title}
            </h2>

            {count != null && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: colors.inkFaint,
                  fontFamily: fonts.mono,
                  padding: "1px 8px",
                  border: `1.5px solid ${colors.borderSubtle}`,
                  borderRadius: `${radius.full}px`,
                  flexShrink: 0,
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
                minHeight: "32px",
                flexShrink: 0,
                background: "transparent",
                border: `1.5px solid ${colors.borderSubtle}`,
                borderRadius: `${radius.full}px`,
                color: colors.inkFaint,
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: fonts.body,
                letterSpacing: "0.1em",
                padding: "4px 12px",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "color 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.ink;
                e.currentTarget.style.borderColor = colors.borderStrong;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.inkFaint;
                e.currentTarget.style.borderColor = colors.borderSubtle;
              }}
            >
              <RefreshCw size={10} strokeWidth={2} />
              Refresh
            </button>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
