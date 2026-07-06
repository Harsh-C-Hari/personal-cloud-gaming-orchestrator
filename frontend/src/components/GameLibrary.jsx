export function GameLibrary({
  games,
  selectedGameId,
  onSelectGame,
}) {
  const entries = Object.entries(games || {});

  if (entries.length === 0) {
    return (
      <div style={emptyBox}>
        No games found
      </div>
    );
  }

  return (
    <div style={grid}>
      {entries.map(([gameId, game]) => {
        const selected =
          gameId === selectedGameId;

        return (
          <button
            key={gameId}
            onClick={() => onSelectGame(gameId)}
            style={{
              ...card,
              borderColor: selected
                ? "#38bdf8"
                : "#1c2130",
              boxShadow: selected
                ? "0 0 20px rgba(56,189,248,0.18)"
                : "none",
            }}
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                "rgba(56,189,248,0.08)"
            }

            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                "transparent"
            }
          >
            <div style={title}>
              {game.name || gameId}
            </div>

            <div style={meta}>
              ID: {gameId}
            </div>

            <div style={meta}>
              EXE: {game.exe_name || "unknown"}
            </div>

            <div style={meta}>
              Process: {game.process_name || "unknown"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "14px",
};

const card = {
  textAlign: "left",
  padding: "16px",
  background: "#080a0f",
  border: "1px solid #1c2130",
  borderRadius: "8px",
  color: "#e2e8f0",
  cursor: "pointer",
};

const title = {
  fontSize: "17px",
  fontWeight: 700,
  marginBottom: "10px",
};

const meta = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10px",
  color: "#64748b",
  marginTop: "5px",
};

const emptyBox = {
  padding: "24px",
  border: "1px dashed #1c2130",
  borderRadius: "8px",
  color: "#475569",
  textAlign: "center",
};