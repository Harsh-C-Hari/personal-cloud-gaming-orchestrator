import { SessionAnalytics } from "../../components/SessionAnalytics.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function AnalyticsPage({ refreshKey, onBack }) {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Session usage and performance trends" onBack={onBack} />
      <SessionAnalytics refreshKey={refreshKey} />
    </div>
  );
}
