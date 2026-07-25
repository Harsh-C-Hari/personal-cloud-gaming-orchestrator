import { SessionHistory } from "../../components/SessionHistory.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SessionHistoryPage({ refreshKey, onBack }) {
  return (
    <div>
      <PageHeader title="Session History" subtitle="Past sessions" onBack={onBack} />
      <SessionHistory refreshKey={refreshKey} />
    </div>
  );
}
