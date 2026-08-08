import { SessionAnalytics } from "../../components/SessionAnalytics.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function AnalyticsPage({ refreshKey, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Analytics" subtitle="Session usage and performance trends" onBack={onBack} />
      <SessionAnalytics refreshKey={refreshKey} />
    </div>
  );
}
