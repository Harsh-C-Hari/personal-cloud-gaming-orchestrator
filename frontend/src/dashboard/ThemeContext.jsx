/**
 * dashboard/ThemeContext.jsx
 *
 * Multi-theme support (DESIGN_SYSTEM.md §8). This is the one place in the
 * app where a React Context is the right tool — unlike an app-wide
 * "give me the current colors" Context (audited and rejected: 42 files
 * import theme.js, many building style objects at module scope where
 * hooks can't run), this Context carries only the *theme id* + a setter.
 * The actual color values are CSS custom properties set on
 * `document.documentElement`, so every existing `colors.brand` call site
 * keeps working completely unchanged — this hook is purely for the
 * Settings UI (and anything else that wants to read/change the theme).
 *
 * Also handles the "custom" theme: the user picks one accent color, and
 * the full palette (backgrounds/ink/borders too) is derived from it via
 * theme-derive.js's HSL math — same algorithm the 5 built-in themes were
 * generated from, so a custom pick can't produce an illegible/low-contrast
 * result. See theme-derive.js's file comment for the index.html sync note.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { applyCustomPalette, clearCustomPalette } from "./theme-derive.js";

const STORAGE_KEY = "cgo-theme";
const CUSTOM_HEX_STORAGE_KEY = "cgo-theme-custom-hex";
const DEFAULT_CUSTOM_HEX = "#E0A458"; // starting point if the user has never picked one

/**
 * Available built-in themes. `brand`/`brandDim` here are the literal
 * per-theme values (kept in sync with the `:root` / `[data-theme]` blocks
 * in App.jsx's GLOBAL_CSS) — used by the Settings swatch picker to render
 * each option's own color without needing the theme to be active first.
 * "custom" is intentionally NOT in this list — it doesn't have fixed
 * brand/brandDim values to preview, since those come from user input.
 */
export const THEMES = [
  { id: "amber", label: "Amber", brand: "#E0A458", brandDim: "rgba(224,164,88,0.14)" },
  { id: "verdant", label: "Verdant", brand: "#4FAE7E", brandDim: "rgba(79,174,126,0.14)" },
  { id: "ember", label: "Ember", brand: "#D97757", brandDim: "rgba(217,119,87,0.14)" },
  { id: "classic", label: "Classic", brand: "#7EC8F2", brandDim: "rgba(126,200,242,0.14)" },
  { id: "mono", label: "Mono", brand: "#FFFFFF", brandDim: "rgba(255,255,255,0.14)" },
];

const BUILT_IN_IDS = THEMES.map((t) => t.id);
const ALL_THEME_IDS = [...BUILT_IN_IDS, "custom"];
const DEFAULT_THEME = "amber";

function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return ALL_THEME_IDS.includes(stored) ? stored : DEFAULT_THEME;
  } catch {
    // localStorage unavailable (private mode, etc) — fall back silently.
    return DEFAULT_THEME;
  }
}

function readStoredCustomHex() {
  try {
    const stored = window.localStorage.getItem(CUSTOM_HEX_STORAGE_KEY);
    return /^#[0-9a-fA-F]{6}$/.test(stored || "") ? stored : DEFAULT_CUSTOM_HEX;
  } catch {
    return DEFAULT_CUSTOM_HEX;
  }
}

function applyTheme(themeId, customHex) {
  if (themeId === "custom") {
    document.documentElement.dataset.theme = "custom";
    applyCustomPalette(customHex);
    return;
  }
  clearCustomPalette();
  if (themeId === DEFAULT_THEME) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = themeId;
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Read the same localStorage values the index.html inline script already
  // used to paint before mount — not re-derived/guessed — so this stays in
  // sync with what's already on screen.
  const [themeId, setThemeId] = useState(readStoredTheme);
  const [customHex, setCustomHex] = useState(readStoredCustomHex);

  useEffect(() => {
    applyTheme(themeId, customHex);
    try {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // localStorage unavailable — theme still applies for this session,
      // it just won't persist across reloads.
    }
    // customHex is intentionally not a dependency here beyond its use
    // inside applyTheme — see the dedicated effect below for live picker
    // updates while already on the custom theme.
  }, [themeId]);

  // If the user is actively on the custom theme and adjusts the color
  // picker, re-apply immediately without requiring a theme "switch."
  useEffect(() => {
    if (themeId !== "custom") return;
    applyCustomPalette(customHex);
    try {
      window.localStorage.setItem(CUSTOM_HEX_STORAGE_KEY, customHex);
    } catch {
      // localStorage unavailable — still applies for this session.
    }
  }, [customHex, themeId]);

  function setTheme(nextId) {
    setThemeId(ALL_THEME_IDS.includes(nextId) ? nextId : DEFAULT_THEME);
  }

  function setCustomBrand(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setCustomHex(hex);
    if (themeId !== "custom") {
      setThemeId("custom");
    }
  }

  return (
    <ThemeContext.Provider
      value={{ themeId, setTheme, themes: THEMES, customHex, setCustomBrand }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * @returns {{
 *   themeId: string,
 *   setTheme: (id: string) => void,
 *   themes: typeof THEMES,
 *   customHex: string,
 *   setCustomBrand: (hex: string) => void,
 * }}
 */
export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return ctx;
}
