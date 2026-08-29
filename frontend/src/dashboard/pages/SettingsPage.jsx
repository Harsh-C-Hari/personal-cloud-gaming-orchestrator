import { Check, ChevronRight, KeyRound, Palette, ScrollText } from "lucide-react";
import { SettingsPanel } from "../../components/SettingsPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { Card } from "../../components/ui/primitives.jsx";
import { useThemeMode } from "../ThemeContext.jsx";
import { colors, fonts } from "../theme.js";
// `radius` was previously imported but unused anywhere in this file
// (verified via grep) — dropped rather than carried forward silently.

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

function ThemeSwatchCard({ theme, selected, onClick }) {
  const swatchStyle = theme.swatchPreview ?? { background: theme.brand };
  const checkColor = theme.swatchPreview ? colors.ink : colors.bg;

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      hoverable
      style={{ padding: "12px", cursor: "pointer", border: `1px solid ${selected ? theme.brand : colors.border}`, display: "flex", alignItems: "center", gap: "9px" }}
    >
      <span aria-hidden="true" style={{ width: 25, height: 25, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", boxSizing: "border-box", ...swatchStyle }}>
        {selected && <Check size={13} strokeWidth={3} color={checkColor} />}
      </span>
      {/* 12px/650/display/lineHeight-1 doesn't land on any typeScale step:
          bodySmall is the only 12px step, but at 500 weight/body font/1.45
          line-height — a genuinely different, tighter swatch-label
          character than reading copy. Left literal; same reasoning applies
          to the two swatch-label spans below in CustomThemeSwatchCard. */}
      <span style={{ color: colors.ink, font: `650 12px/1 ${fonts.display}` }}>{theme.label}</span>
    </Card>
  );
}

function CustomThemeSwatchCard({ selected, customHex, onSelect, onPickColor }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      hoverable
      style={{ padding: "12px", cursor: "pointer", border: `1px solid ${selected ? customHex : colors.border}`, display: "flex", alignItems: "center", gap: "9px" }}
    >
      <span style={{ position: "relative", width: 25, height: 25, flexShrink: 0, display: "grid", placeItems: "center" }}>
        <input
          type="color"
          aria-label="Pick a custom accent color"
          title="Pick a custom accent color"
          value={customHex}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onPickColor(event.target.value)}
          style={{ width: 25, height: 25, padding: 0, border: "none", borderRadius: "50%", overflow: "hidden", cursor: "pointer", background: "none" }}
        />
        {selected && <Check size={12} strokeWidth={3} color={colors.bg} style={{ position: "absolute", pointerEvents: "none" }} />}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
        <span style={{ color: colors.ink, font: `650 12px/1 ${fonts.display}` }}>Custom</span>
        <span style={{ color: colors.inkFaint, font: `500 8.5px/1 ${fonts.mono}` }}>{customHex.toUpperCase()}</span>
      </span>
    </Card>
  );
}

function AppearanceCard() {
  const { themeId, setTheme, themes, customHex, setCustomBrand } = useThemeMode();

  return (
    <div className="pcgo-settings-appearance">
      <div className="pcgo-settings-appearance__heading">
        <div className="pcgo-settings-appearance__mark" aria-hidden="true"><Palette size={14} /></div>
        <div><h3>Appearance</h3><p>Client-side theme preference. Applies immediately and persists in this browser.</p></div>
      </div>
      <div className="pcgo-settings-appearance__themes">
        {themes.map((theme) => <ThemeSwatchCard key={theme.id} theme={theme} selected={theme.id === themeId} onClick={() => setTheme(theme.id)} />)}
        <CustomThemeSwatchCard selected={themeId === "custom"} customHex={customHex} onSelect={() => setTheme("custom")} onPickColor={setCustomBrand} />
      </div>
    </div>
  );
}

export function SettingsPage({ onBack, onNavigate }) {
  return (
    <div className="pcgo-feature-page pcgo-settings-page">
      <PageHeader title="Settings" subtitle="Configuration and application preferences" onBack={onBack} />

      <div className="pcgo-settings-overview">
        <div className="pcgo-settings-overview__eyebrow">CONTROL PLANE CONFIGURATION</div>
        <h2>Configure the host. Know what changes.</h2>
        <p>Host settings use a local draft and one explicit Save action. Appearance is a browser preference and applies immediately.</p>
      </div>

      <SectionCard title="Account access">
        <div className="pcgo-settings-link-list">
          <LinkRow icon={<KeyRound size={14} />} label="Change password" description="Update the password for your signed-in account." onClick={() => onNavigate("change-password")} />
        </div>
      </SectionCard>

      <SectionCard title="Operational evidence">
        <div className="pcgo-settings-link-list">
          <LinkRow icon={<ScrollText size={14} />} label="Logs" description="Inspect session and host activity evidence." onClick={() => onNavigate("logs")} />
        </div>
      </SectionCard>

      <SettingsPanel />

      <SectionCard title="Appearance">
        <AppearanceCard />
      </SectionCard>

      <SectionCard title="About">
        <div className="pcgo-settings-about">
          <div><span>PRODUCT</span><strong>Personal Cloud Gaming Orchestrator</strong></div>
          <div><span>VERSION</span><strong>0.1</strong></div>
        </div>
      </SectionCard>
    </div>
  );
}
