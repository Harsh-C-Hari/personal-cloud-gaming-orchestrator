import { colors, fonts } from "../theme.js";

export function LoadingState({ label = "Connecting to host agent…" }) {
  return (
    <div
      style={{
        fontSize: "11px",
        color: colors.textGhost,
        fontFamily: fonts.mono,
        padding: "20px 0",
      }}
    >
      {label}
    </div>
  );
}
