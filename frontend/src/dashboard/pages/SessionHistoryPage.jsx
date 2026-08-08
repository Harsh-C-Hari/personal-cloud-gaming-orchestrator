import { SessionHistory } from "../../components/SessionHistory.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SessionHistoryPage({ refreshKey, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Session History" subtitle="Past sessions" onBack={onBack} />
      <SessionHistory refreshKey={refreshKey} />
    </div>
  );
}
