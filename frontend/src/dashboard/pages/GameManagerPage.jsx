import { GameManager } from "../../components/GameManager.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function GameManagerPage({ games, loadGames, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Game Manager" subtitle="Add, edit, and remove Games" onBack={onBack} />
      <GameManager games={games} refreshGames={loadGames} />
    </div>
  );
}
