/**
 * components/GameLibrary.jsx
 *
 * Same props (games, selectedGameId, onSelectGame) and same selection
 * logic as before — only the presentation was reworked to match
 * GameManager.jsx's card grid (Chalkboard Neo-Brutalist tokens, flat
 * borders instead of shadows, icon-labeled meta rows), since this is the
 * same "browse games" pattern used in a different context (game
 * *selection* here vs game *management* there).
 *
 * Also fixes a real contrast bug: the old empty-state text color
 * (#080b0f) was nearly black on a near-black background, making it
 * effectively invisible.
 */

import { Gamepad2, Hash, FileInput, Cpu, CheckCircle2 } from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

export function GameLibrary({ games, selectedGameId, onSelectGame }) {
    const entries = Object.entries(games || {});

    if (entries.length === 0) {
        return (
            <div style={emptyBox}>
                <Gamepad2 size={20} strokeWidth={1.5} style={{ color: colors.inkFaint }} />
                <div style={{ fontSize: "11px", color: colors.inkDim, fontFamily: fonts.mono }}>No games found</div>
            </div>
        );
    }

    return (
        <div style={grid}>
            {entries.map(([gameId, game]) => {
                const selected = gameId === selectedGameId;

                return (
                    <button
                        key={gameId}
                        type="button"
                        onClick={() => onSelectGame(gameId)}
                        style={{
                            ...card,
                            borderColor: selected ? colors.borderInk : colors.border,
                            background: selected ? colors.brandDim : colors.bgCard,
                        }}
                        onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.background = colors.bgCardHover;
                        }}
                        onMouseLeave={(e) => {
                            if (!selected) e.currentTarget.style.background = colors.bgCard;
                        }}
                    >
                        <div style={cardHeader}>
                            <div style={cardTitle}>{game.name || gameId}</div>
                            {selected && <CheckCircle2 size={14} strokeWidth={2} style={{ color: colors.brand, flexShrink: 0 }} />}
                        </div>

                        <div style={cardMeta}>
                            <Hash size={9} strokeWidth={2} style={{ opacity: 0.7 }} /> {gameId}
                        </div>
                        <div style={cardMeta}>
                            <FileInput size={9} strokeWidth={2} style={{ opacity: 0.7 }} /> {game.exe_name || "unknown"}
                        </div>
                        <div style={cardMeta}>
                            <Cpu size={9} strokeWidth={2} style={{ opacity: 0.7 }} /> {game.process_name || "unknown"}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "14px",
};

const card = {
    position: "relative",
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "16px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    color: colors.ink,
    cursor: "pointer",
    overflow: "hidden",
    boxSizing: "border-box",
    // P6-T06 motion audit: real `transition:`, two properties sharing one
    // duration/easing. 150ms doesn't exactly match any `motion` step
    // (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier).
    // Left as the original literal.
    transition: "border-color 150ms ease, background 150ms ease",
};

const cardHeader = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "6px",
    gap: "8px",
    marginBottom: "10px",
};

const cardTitle = {
    fontSize: "15px",
    fontWeight: 700,
    color: colors.ink,
    fontFamily: fonts.display,
};

const cardMeta = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: fonts.mono,
    fontSize: "10px",
    color: colors.inkFaint,
    marginTop: "5px",
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "24px",
    border: `1.5px dashed ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    textAlign: "center",
};
