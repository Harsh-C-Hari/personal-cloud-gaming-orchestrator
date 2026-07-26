import { SunshineStreamHistory } from "../../components/SunshineStreamHistory.jsx";
import { SunshineClientManager } from "../../components/SunshineClientManager.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SunshinePage({ streamHistory, streamHistoryLoading, hostStatus, streamStatus, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Sunshine" subtitle="Client pairing, stream control, and streaming history" onBack={onBack} />
      <SunshineClientManager hostStatus={hostStatus} streamStatus={streamStatus} />
      <SunshineStreamHistory streams={streamHistory} loading={streamHistoryLoading} />
    </div>
  );
}
