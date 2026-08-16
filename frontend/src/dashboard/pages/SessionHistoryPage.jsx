import { SessionHistory } from "../../components/SessionHistory.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SessionHistoryPage({ refreshKey, onBack }) {
  return (
    <div className="pcgo-feature-page">
      <PageHeader title="Session History" subtitle="Authoritative record of completed and failed sessions" onBack={onBack} />
      <SessionHistory refreshKey={refreshKey} />
    </div>
  );
}
