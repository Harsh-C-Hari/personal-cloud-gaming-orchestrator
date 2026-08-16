import { SessionAnalytics } from "../../components/SessionAnalytics.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function AnalyticsPage({ refreshKey, onBack }) {
  return (
    <div className="pcgo-feature-page">
      <PageHeader title="Analytics" subtitle="Aggregate patterns across session history" onBack={onBack} />
      <SessionAnalytics refreshKey={refreshKey} />
    </div>
  );
}
