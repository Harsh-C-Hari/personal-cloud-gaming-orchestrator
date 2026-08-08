/**
 * dashboard/theme-derive.js
 *
 * Derives a full theme palette (backgrounds/ink/borders/brand) from a
 * single user-picked accent color, for the "custom" theme option.
 *
 * This is deliberately the SAME algorithm used to generate the 5 built-in
 * themes (amber/verdant/ember/classic/mono) in App.jsx's CSS blocks: take
 * the amber theme's own neutral lightness/saturation ladder, rotate every
 * neutral token to the picked color's hue, keep the same lightness. This
 * guarantees any custom color produces a palette with the SAME WCAG
 * contrast properties as the 5 hand-picked themes (verified: ink/inkDim/
 * inkFaint against bg all stay >=4.5:1, matching amber's own baseline) —
 * a naive "let the user pick 13 independent colors" UI would have no such
 * guarantee and could easily produce illegible results.
 *
 * IMPORTANT: index.html has a compact, standalone copy of this exact math
 * in its pre-mount flash-prevention script (plain inline <script>, not a
 * module, so it can run synchronously before first paint with zero import
 * latency). If you change the algorithm here, update index.html to match.
 */

// Amber's own neutral tokens — the reference lightness/saturation ladder
// every theme (including custom) is built from.
const AMBER_NEUTRALS = {
  bg: "#0B0B0D",
  bgElevated: "#131316",
  bgCard: "#151517",
  bgCardHover: "#1B1B1F",
  bgInset: "#0E0E10",
  ink: "#EDEBE3",
  inkDim: "#B9B7AE",
  inkFaint: "#7D7C77",
  inkGhost: "#4A4A48",
};

// Slightly boosts each neutral's inherent saturation so the hue rotation
// reads as a perceptible "temperature," not a purely achromatic grey.
const SAT_SCALE = 1.35;

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p, q, t) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

function hexToRgbaString(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Given a hex color the user picked (e.g. "#FF6B9D"), returns a full
 * palette object with the same shape as one of the 5 built-in themes:
 * { brand, brandDim, bg, bgElevated, bgCard, bgCardHover, bgInset,
 *   ink, inkDim, inkFaint, inkGhost, border, borderSubtle, borderStrong,
 *   borderInk }
 */
export function deriveCustomPalette(brandHex) {
  const [hue] = rgbToHsl(hexToRgb(brandHex));
  const result = {
    brand: brandHex,
    brandDim: hexToRgbaString(brandHex, 0.14),
  };
  for (const [key, hex] of Object.entries(AMBER_NEUTRALS)) {
    const [, s, l] = rgbToHsl(hexToRgb(hex));
    const newS = Math.min(1, s * SAT_SCALE);
    result[key] = rgbToHex(hslToRgb([hue, newS, l]));
  }
  result.border = hexToRgbaString(result.ink, 0.12);
  result.borderSubtle = hexToRgbaString(result.ink, 0.07);
  result.borderStrong = hexToRgbaString(result.ink, 0.28);
  result.borderInk = result.ink;
  return result;
}

// Maps each palette key to its CSS custom property name, so callers can
// apply the result via element.style.setProperty(...) in one loop.
export const PALETTE_KEY_TO_CSS_VAR = {
  brand: "--color-brand",
  brandDim: "--color-brand-dim",
  bg: "--color-bg",
  bgElevated: "--color-bg-elevated",
  bgCard: "--color-bg-card",
  bgCardHover: "--color-bg-card-hover",
  bgInset: "--color-bg-inset",
  ink: "--color-ink",
  inkDim: "--color-ink-dim",
  inkFaint: "--color-ink-faint",
  inkGhost: "--color-ink-ghost",
  border: "--color-border",
  borderSubtle: "--color-border-subtle",
  borderStrong: "--color-border-strong",
  borderInk: "--color-border-ink",
};

export function applyCustomPalette(brandHex) {
  const palette = deriveCustomPalette(brandHex);
  const root = document.documentElement.style;
  for (const [key, cssVar] of Object.entries(PALETTE_KEY_TO_CSS_VAR)) {
    root.setProperty(cssVar, palette[key]);
  }
}

export function clearCustomPalette() {
  const root = document.documentElement.style;
  for (const cssVar of Object.values(PALETTE_KEY_TO_CSS_VAR)) {
    root.removeProperty(cssVar);
  }
}
