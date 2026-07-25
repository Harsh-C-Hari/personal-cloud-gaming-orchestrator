/**
 * dashboard/pages/SettingsPage.jsx
 *
 * Contains:
 *  - Change Password (links to ChangePasswordPage)
 *  - Logs (links to LogsPage)
 *  - Host Configuration — the existing, unmodified SettingsPanel component
 *  - About (static info)
 *  - Appearance / Notifications — placeholder cards, no functionality yet
 */

import { SettingsPanel } from "../../components/SettingsPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { colors, fonts, cardStyle } from "../theme.js";

function LinkRow({ label, description, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderRadius: "8px",
        border: `1px solid ${colors.borderSubtle}`,
        background: "rgb(5, 6, 8)",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.borderSubtle)}
    >
      <div>
        <div style={{ fontSize: "13px", color: colors.text, fontFamily: fonts.display, fontWeight: 600 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: "10.5px", color: colors.textFaint, marginTop: "3px", fontFamily: fonts.mono }}>
            {description}
          </div>
        )}
      </div>
      <span style={{ color: colors.textFaint, fontFamily: fonts.mono }}>›</span>
    </button>
  );
}

function PlaceholderCard({ label, description }) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "14px 16px",
        opacity: 0.5,
      }}
    >
      <div style={{ fontSize: "13px", color: colors.textDim, fontFamily: fonts.display, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: "10.5px", color: colors.textMuted, marginTop: "3px", fontFamily: fonts.mono }}>
        {description} · Coming soon
      </div>
    </div>
  );
}

export function SettingsPage({ onBack, onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <PageHeader title="Settings" subtitle="Account, configuration, and app preferences" onBack={onBack} />

      <SectionCard title="Account">
        <div style={{ display: "grid", gap: "10px" }}>
          <LinkRow
            label="Change Password"
            description="Update the password for your account"
            onClick={() => onNavigate("change-password")}
          />
          <LinkRow label="Logs" description="View session and host activity log" onClick={() => onNavigate("logs")} />
        </div>
      </SectionCard>

      <SectionCard title="Host Configuration">
        <SettingsPanel />
      </SectionCard>

      <SectionCard title="Preferences">
        <div style={{ display: "grid", gap: "10px" }}>
          <PlaceholderCard label="Appearance" description="Theme and layout options" />
          <PlaceholderCard label="Notifications" description="Alerts and email preferences" />
        </div>
      </SectionCard>

      <SectionCard title="About">
        <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: colors.textDim, fontFamily: fonts.mono }}>
          <div>Personal Cloud Gaming Orchestrator</div>
          <div style={{ color: colors.textFaint }}>Version 0.1</div>
        </div>
      </SectionCard>
    </div>
  );
}
