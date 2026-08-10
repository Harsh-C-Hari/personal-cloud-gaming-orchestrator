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

import { Check, ChevronRight } from "lucide-react";
import { SettingsPanel } from "../../components/SettingsPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { Card } from "../../components/ui/primitives.jsx";
import { useThemeMode } from "../ThemeContext.jsx";
import { colors, fonts, radius } from "../theme.js";

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
        borderRadius: `${radius.md}px`,
        border: `1.5px solid ${colors.borderSubtle}`,
        background: colors.bgInset,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 150ms ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.borderSubtle)}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: colors.ink, fontFamily: fonts.display, fontWeight: 600 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: "10.5px", color: colors.inkFaint, marginTop: "3px", fontFamily: fonts.mono }}>
            {description}
          </div>
        )}
      </div>
      <ChevronRight size={14} strokeWidth={2} color={colors.inkFaint} style={{ flexShrink: 0, marginLeft: "10px" }} />
    </button>
  );
}

function PlaceholderCard({ label, description }) {
  return (
    <Card style={{ padding: "14px 16px", opacity: 0.5 }}>
      <div style={{ fontSize: "13px", color: colors.inkDim, fontFamily: fonts.display, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: "10.5px", color: colors.inkFaint, marginTop: "3px", fontFamily: fonts.mono }}>
        {description} · Coming soon
      </div>
    </Card>
  );
}

function ThemeSwatchCard({ theme, selected, onClick }) {
  const swatchStyle = theme.swatchPreview ?? { background: theme.brand };
  // The checkmark needs to contrast against whichever fill is showing —
  // normally that's colors.bg (dark) against a light brand fill, but an
  // override like OLED's black swatch needs a light checkmark instead.
  const checkColor = theme.swatchPreview ? colors.ink : colors.bg;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      hoverable
      style={{
        padding: "14px 16px",
        cursor: "pointer",
        border: `1.5px solid ${selected ? theme.brand : colors.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          ...swatchStyle,
        }}
      >
        {selected && <Check size={15} strokeWidth={3} color={checkColor} />}
      </span>
      <span style={{ fontSize: "13px", color: colors.ink, fontFamily: fonts.display, fontWeight: 600 }}>
        {theme.label}
      </span>
    </Card>
  );
}

function CustomThemeSwatchCard({ selected, customHex, onSelect, onPickColor }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      hoverable
      style={{
        padding: "14px 16px",
        cursor: "pointer",
        border: `1.5px solid ${selected ? customHex : colors.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span
        style={{
          position: "relative",
          width: "28px",
          height: "28px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* The swatch circle IS the native color input — clicking it opens
            the OS picker directly and picking a color both sets the hex
            and selects the custom theme (see setCustomBrand). Native
            <input type="color"> styling is intentionally minimal so it
            renders as a clean circle across browsers. */}
        <input
          type="color"
          aria-label="Pick a custom accent color"
          title="Pick a custom accent color"
          value={customHex}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onPickColor(e.target.value)}
          style={{
            width: "28px",
            height: "28px",
            padding: 0,
            border: "none",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            background: "none",
          }}
        />
        {selected && (
          <Check
            size={13}
            strokeWidth={3}
            color={colors.bg}
            style={{ position: "absolute", pointerEvents: "none" }}
          />
        )}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
        <span style={{ fontSize: "13px", color: colors.ink, fontFamily: fonts.display, fontWeight: 600 }}>
          Custom
        </span>
        <span style={{ fontSize: "9.5px", color: colors.inkFaint, fontFamily: fonts.mono }}>
          {customHex.toUpperCase()}
        </span>
      </span>
    </Card>
  );
}

function AppearanceCard() {
  const { themeId, setTheme, themes, customHex, setCustomBrand } = useThemeMode();

  return (
    <Card style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: "13px", color: colors.ink, fontFamily: fonts.display, fontWeight: 600 }}>
        Appearance
      </div>
      <div style={{ fontSize: "10.5px", color: colors.inkFaint, marginTop: "3px", marginBottom: "14px", fontFamily: fonts.mono }}>
        Choose a theme, or pick your own accent color
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        {themes.map((theme) => (
          <ThemeSwatchCard
            key={theme.id}
            theme={theme}
            selected={theme.id === themeId}
            onClick={() => setTheme(theme.id)}
          />
        ))}
        <CustomThemeSwatchCard
          selected={themeId === "custom"}
          customHex={customHex}
          onSelect={() => setTheme("custom")}
          onPickColor={setCustomBrand}
        />
      </div>
    </Card>
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
          <AppearanceCard />
          <PlaceholderCard label="Notifications" description="Alerts and email preferences" />
        </div>
      </SectionCard>

      <SectionCard title="About">
        <div style={{ display: "grid", gap: "6px", fontSize: "11.5px", color: colors.inkDim, fontFamily: fonts.mono }}>
          <div>Personal Cloud Gaming Orchestrator</div>
          <div style={{ color: colors.inkFaint }}>Version 0.1</div>
        </div>
      </SectionCard>
    </div>
  );
}
