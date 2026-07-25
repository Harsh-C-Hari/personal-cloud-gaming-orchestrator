import { LogPanel } from "../../components/LogPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function LogsPage({ onBack }) {
  return (
    <div>
      <PageHeader title="Logs" subtitle="Session and host activity log" onBack={onBack} />
      <LogPanel />
    </div>
  );
}
