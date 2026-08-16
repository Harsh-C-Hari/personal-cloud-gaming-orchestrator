import { GameManager } from "../../components/GameManager.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function GameManagerPage({ games, gamesLoading, loadGames, onBack }) {
  return (
    <div className="pcgo-feature-page pcgo-game-manager-page">
      <PageHeader title="Game Manager" subtitle="Add, edit, and remove configured launch targets" onBack={onBack} />
      <GameManager games={games} gamesLoading={gamesLoading} refreshGames={loadGames} />
    </div>
  );
}
