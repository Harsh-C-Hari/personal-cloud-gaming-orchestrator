import { ChevronRight, KeyRound, ScrollText } from "lucide-react";
import { SettingsPanel } from "../../components/SettingsPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { colors } from "../theme.js";
// Check, Palette, and useThemeMode removed — all were only used by the
// Appearance section (ThemeSwatchCard / CustomThemeSwatchCard /
// AppearanceCard), which has been deleted alongside the multi-theme system.
// Card import removed — only used inside the deleted swatch card components.

function LinkRow({ icon, label, description, onClick }) {
  return (
    <button type="button" className="pcgo-settings-link-row" onClick={onClick}>
      <span className="pcgo-settings-link-row__icon" aria-hidden="true">{icon}</span>
      <span className="pcgo-settings-link-row__copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </span>
      <ChevronRight size={14} aria-hidden="true" />
    </button>
  );
}

export function SettingsPage({ onBack, onNavigate }) {
  return (
    <div className="pcgo-feature-page pcgo-settings-page">
      <PageHeader title="Settings" subtitle="Configuration and application preferences" onBack={onBack} />

      <div className="pcgo-settings-overview">
        <div className="pcgo-settings-overview__eyebrow">CONTROL PLANE CONFIGURATION</div>
        <h2>Configure the host. Know what changes.</h2>
        <p>Host settings use a local draft and one explicit Save action.</p>
      </div>

      <SectionCard title="Account access">
        <div className="pcgo-settings-link-list">
          <LinkRow icon={<KeyRound size={14} aria-hidden="true" />} label="Change password" description="Update the password for your signed-in account." onClick={() => onNavigate("change-password")} />
        </div>
      </SectionCard>

      <SectionCard title="Operational evidence">
        <div className="pcgo-settings-link-list">
          <LinkRow icon={<ScrollText size={14} aria-hidden="true" />} label="Logs" description="Inspect session and host activity evidence." onClick={() => onNavigate("logs")} />
        </div>
      </SectionCard>

      <SettingsPanel />

      <SectionCard title="About">
        <div className="pcgo-settings-about">
          <div><span>PRODUCT</span><strong>Personal Cloud Gaming Orchestrator</strong></div>
          <div><span>VERSION</span><strong>0.1</strong></div>
        </div>
      </SectionCard>
    </div>
  );
}
