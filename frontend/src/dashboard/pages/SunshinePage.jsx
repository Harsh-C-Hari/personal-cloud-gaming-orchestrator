import { SunshineStreamHistory } from "../../components/SunshineStreamHistory.jsx";
import { SunshineClientManager } from "../../components/SunshineClientManager.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SunshinePage({ streamHistory, streamHistoryLoading, hostStatus, streamStatus, onBack }) {
  return (
    <div className="pcgo-feature-page pcgo-sunshine-page">
      <PageHeader title="Sunshine" subtitle="Operational status, paired clients, and stream history" onBack={onBack} />
      <div className="pcgo-sunshine-layout">
        <SunshineClientManager hostStatus={hostStatus} streamStatus={streamStatus} />
        <SunshineStreamHistory streams={streamHistory} loading={streamHistoryLoading} />
      </div>
    </div>
  );
}
