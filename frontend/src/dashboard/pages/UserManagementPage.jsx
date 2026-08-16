import { UserPanel } from "../../components/UserPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function UserManagementPage({ onBack }) {
  return (
    <div className="pcgo-feature-page">
      <PageHeader title="User Management" subtitle="Identity and access administration" onBack={onBack} />
      <UserPanel />
    </div>
  );
}
