import { SaveLibrary } from "../../components/SaveLibrary.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SaveLibraryPage({ games, gamesLoading, refreshKey, onBack }) {
  return (
    <div className="pcgo-feature-page pcgo-save-library-page">
      <PageHeader
        title="Save Library"
        subtitle="Latest, backup, and archive saves for your account, game by game."
        onBack={onBack}
      />
      <SaveLibrary games={games} gamesLoading={gamesLoading} refreshKey={refreshKey} />
    </div>
  );
}
