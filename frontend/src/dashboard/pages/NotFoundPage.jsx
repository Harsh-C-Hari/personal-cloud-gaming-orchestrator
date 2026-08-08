/**
 * dashboard/pages/NotFoundPage.jsx
 *
 * Rendered by AdminDashboard / UserDashboard whenever the current pathname
 * doesn't match any route available to the signed-in role, instead of
 * silently falling back to Home. Purely presentational — no routing/auth
 * logic lives here; it's wired in exactly like every other page.
 */

import { Compass, Home as HomeIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader.jsx";
import { Card, Button } from "../../components/ui/primitives.jsx";
import { colors, fonts, radius } from "../theme.js";

export function NotFoundPage({ path, onGoHome }) {
  return (
    <div>
      <PageHeader title="Page Not Found" subtitle="The page you're looking for doesn't exist" />

      <Card
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "18px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: `${radius.md}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: colors.accentYellowDim,
            color: colors.warning,
          }}
        >
          <Compass size={24} strokeWidth={1.5} />
        </div>

        <div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: colors.ink,
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
              color: colors.inkDim,
              fontFamily: fonts.mono,
            }}
          >
            Nothing lives at{" "}
            <code
              style={{
                color: colors.inkFaint,
                background: colors.bgInset,
                border: `1.5px solid ${colors.borderSubtle}`,
                borderRadius: `${radius.sm}px`,
                padding: "1px 6px",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              /{path}
            </code>
          </div>
        </div>

        <Button variant="secondary" onClick={onGoHome} style={{ marginTop: "6px" }}>
          <HomeIcon size={13} strokeWidth={2} />
          Go To Home
        </Button>
      </Card>
    </div>
  );
}
