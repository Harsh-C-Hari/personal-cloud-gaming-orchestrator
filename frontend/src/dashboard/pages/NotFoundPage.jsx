/**
 * dashboard/pages/NotFoundPage.jsx
 *
 * Rendered by AdminDashboard / UserDashboard whenever the current pathname
 * doesn't match any route available to the signed-in role, instead of
 * silently falling back to Home. Purely presentational — no routing/auth
 * logic lives here; it's wired in exactly like every other page.
 */

import { FaCompass, FaHome } from "react-icons/fa";
import { PageHeader } from "../components/PageHeader.jsx";
import { colors, fonts } from "../theme.js";

export function NotFoundPage({ path, onGoHome }) {
  return (
    <div>
      <PageHeader title="Page Not Found" subtitle="The page you're looking for doesn't exist" />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "18px",
          padding: "56px 24px",
          border: `1px solid ${colors.border}`,
          borderRadius: "10px",
          background: colors.bgCard,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(245,165,36,0.1)",
            border: "1px solid rgba(245,165,36,0.3)",
            color: colors.warning,
            fontSize: "22px",
          }}
        >
          <FaCompass />
        </div>

        <div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: colors.text,
              fontFamily: fonts.display,
              lineHeight: 1,
            }}
          >
            404
          </div>
          <div
            style={{
              marginTop: "10px",
              fontSize: "12px",
              color: colors.textDim,
              fontFamily: fonts.mono,
            }}
          >
            Nothing lives at{" "}
            <code
              style={{
                color: colors.textFaint,
                background: "rgba(2,6,23,0.5)",
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: "4px",
                padding: "1px 6px",
              }}
            >
              /{path}
            </code>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            marginTop: "6px",
            background: "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
            border: "1px solid rgba(56,189,248,0.4)",
            borderRadius: "8px",
            color: colors.accent,
            fontSize: "11px",
            fontFamily: fonts.mono,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
          }}
        >
          <FaHome size={11} />
          Go To Home
        </button>
      </div>
    </div>
  );
}
