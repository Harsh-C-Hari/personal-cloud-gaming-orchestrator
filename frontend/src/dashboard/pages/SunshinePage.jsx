import { SunshineStreamHistory } from "../../components/SunshineStreamHistory.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function SunshinePage({ streamHistory, streamHistoryLoading, onBack }) {
  return (
    <div>
      <PageHeader title="Sunshine Stream" subtitle="Streaming session history" onBack={onBack} />
      <SunshineStreamHistory streams={streamHistory} loading={streamHistoryLoading} />
    </div>
  );
}
