import { UserPanel } from "../../components/UserPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";

export function UserManagementPage({ onBack }) {
  return (
    <div>
      <PageHeader title="User Management" subtitle="Create, edit, and remove user accounts" onBack={onBack} />
      <UserPanel />
    </div>
  );
}
