import { LogPanel } from "../../components/LogPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function LogsPage({ onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Logs" subtitle="Session and host activity log" onBack={onBack} />
      <LogPanel />
    </div>
  );
}
