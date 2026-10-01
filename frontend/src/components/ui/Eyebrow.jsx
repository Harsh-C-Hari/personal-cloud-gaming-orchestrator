/**
 * components/ui/Eyebrow.jsx
 *
 * The mono uppercase tracked-out label pattern — used in Login's hero section
 * and as the section-level kicker throughout the dashboard. Reuses
 * `typeScale.meta` (10px/700/.12em/uppercase/mono) rather than re-inventing
 * literal values, matching the ~30+ existing occurrences of this pattern
 * across the app. Color is `colors.brand` to match Login's eyebrow treatment.
 *
 * Props:
 *   icon      ReactNode (optional) — prepended icon, e.g. <Activity size={14} aria-hidden="true" />
 *   children  The eyebrow label text
 *   style     Optional style overrides
 */
import { colors, typeScale } from "../../dashboard/theme.js";

export function Eyebrow({ icon, children, style }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: colors.brand,
        ...typeScale.meta,
        // typeScale.meta sets fontWeight: 700, letterSpacing: "0.12em",
        // textTransform: "uppercase", fontFamily: fonts.mono — all correct.
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  );
}
