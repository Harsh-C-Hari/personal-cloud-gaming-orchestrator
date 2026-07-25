/**
 * dashboard/Dashboard.jsx
 *
 * Replaces the old pages/Dashboard.jsx monolith. Contains NO business
 * logic — its only job is picking which dashboard to render, exactly like
 * the old file's `role === "admin"` checks did inline.
 */

import { AdminDashboard } from "./AdminDashboard.jsx";
import { UserDashboard } from "./UserDashboard.jsx";

export function Dashboard() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  return isAdmin ? <AdminDashboard username={username} /> : <UserDashboard username={username} />;
}
