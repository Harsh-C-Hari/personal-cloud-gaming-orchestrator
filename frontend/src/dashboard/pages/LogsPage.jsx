import { LogPanel } from "../../components/LogPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function LogsPage({ onBack }) {
  return (
    <div className="pcgo-feature-page">
      <PageHeader title="Logs" subtitle="Raw operational evidence and debugging context" onBack={onBack} />
      <LogPanel />
    </div>
  );
}
