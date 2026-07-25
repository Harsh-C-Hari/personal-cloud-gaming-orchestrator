/**
 * components/GameLibrary.jsx
 *
 * Same props (games, selectedGameId, onSelectGame) and same selection
 * logic as before — only the presentation was reworked to match
 * GameManager.jsx's card grid exactly (same palette, card/meta/top-accent
 * styles, icon-labeled meta rows), since this is the same "browse games"
 * pattern used in a different context (game *selection* here vs game
 * *management* there).
 *
 * Also fixes a real contrast bug: the old empty-state text color
 * (#080b0f) was nearly black on a near-black background, making it
 * effectively invisible.
 */

import { FaGamepad, FaHashtag, FaFileImport, FaMicrochip, FaCheckCircle } from "react-icons/fa";

const palette = {
    bg: "#000000",
    border: "#1c2130",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    mono: "'JetBrains Mono', monospace",
};

export function GameLibrary({ games, selectedGameId, onSelectGame }) {
    const entries = Object.entries(games || {});

    if (entries.length === 0) {
        return (
            <div style={emptyBox}>
                <FaGamepad size={20} style={{ color: palette.muted, opacity: 0.6 }} />
                <div style={{ fontSize: "11px", color: palette.dim, fontFamily: palette.mono }}>No games found</div>
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
                            borderColor: selected ? "rgba(56,189,248,0.5)" : palette.border,
                            background: selected ? "rgba(56,189,248,0.06)" : palette.bg,
                            boxShadow: selected ? "0 0 20px rgba(56,189,248,0.12)" : "none",
                        }}
                        onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.background = "rgba(56,189,248,0.04)";
                        }}
                        onMouseLeave={(e) => {
                            if (!selected) e.currentTarget.style.background = palette.bg;
                        }}
                    >
                        {selected && <div style={cardTopAccent} />}

                        <div style={cardHeader}>
                            <div style={cardTitle}>{game.name || gameId}</div>
                            {selected && <FaCheckCircle size={14} style={{ color: palette.accent, flexShrink: 0 }} />}
                        </div>

                        <div style={cardMeta}>
                            <FaHashtag size={9} style={{ opacity: 0.7 }} /> {gameId}
                        </div>
                        <div style={cardMeta}>
                            <FaFileImport size={9} style={{ opacity: 0.7 }} /> {game.exe_name || "unknown"}
                        </div>
                        <div style={cardMeta}>
                            <FaMicrochip size={9} style={{ opacity: 0.7 }} /> {game.process_name || "unknown"}
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
    border: `1px solid ${palette.border}`,
    borderRadius: "10px",
    color: palette.text,
    cursor: "pointer",
    overflow: "hidden",
    boxSizing: "border-box",
    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
};

const cardTopAccent = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
    opacity: 0.8,
};

const cardHeader = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "10px",
};

const cardTitle = {
    fontSize: "15px",
    fontWeight: 700,
    color: palette.text,
    fontFamily: "'Rajdhani', sans-serif",
};

const cardMeta = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: palette.mono,
    fontSize: "10px",
    color: palette.faint,
    marginTop: "5px",
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "24px",
    border: `1px dashed ${palette.border}`,
    borderRadius: "10px",
    textAlign: "center",
};
