import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { fetchUsers, createUser, deleteUser, deleteAllUsers } from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { Button, Chip, EmptyState, Spinner } from "./ui/primitives.jsx";

export function UserPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const role = localStorage.getItem("role");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(role === "admin");
  const [loadError, setLoadError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [validationError, setValidationError] = useState("");

  const adminCount = users.filter((user) => user.role === "admin").length;
  const userCount = users.filter((user) => user.role !== "admin").length;
  const onlyOneAdminExists = adminCount === 1;
  const noUserExists = adminCount === 0;

  async function loadUsers() {
    try {
      setLoading(true);
      setLoadError("");
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.message || "Unable to load user accounts.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === "admin") loadUsers();
  }, []);

  function validateUserForm() {
    if (!username.trim()) return "Username required.";
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (!password.trim()) return "Password required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  }

  async function handleCreate() {
    const error = validateUserForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    try {
      setCreating(true);
      await createUser({ username, password, role: userRole });
      setUsername("");
      setPassword("");
      setUserRole("user");
      toast.success("User created.");
      await loadUsers();
    } catch (err) {
      toast.error(err.message || "Unable to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(target) {
    if (deletingId || deletingAll) return;

    const confirmed = await confirm(
      `You are about to remove ${target}. This account will no longer be able to access PCGO.`,
      { danger: true, title: "REMOVE USER", confirmLabel: "Remove user" },
    );
    if (!confirmed) return;

    try {
      setDeletingId(target);
      await deleteUser(target);
      toast.success("User removed.");
      await loadUsers();
    } catch (err) {
      toast.error(err.message || "Unable to remove user.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAll() {
    if (deletingId || deletingAll) return;

    const confirmed = await confirm(
      "You are about to remove every account except the oldest administrator. Use this only for deliberate account cleanup.",
      { danger: true, title: "REMOVE EXCESS ACCOUNTS", confirmLabel: "Remove accounts" },
    );
    if (!confirmed) return;

    try {
      setDeletingAll(true);
      await deleteAllUsers();
      toast.success("Accounts removed except the oldest admin.");
      await loadUsers();
    } catch (err) {
      toast.error(err.message || "Unable to remove accounts.");
    } finally {
      setDeletingAll(false);
    }
  }

  if (role !== "admin") return null;

  return (
    <section className="pcgo-users" aria-label="User Management">
      <div className="pcgo-users__toolbar">
        <div className="pcgo-users__heading">
          <div className="pcgo-users__heading-mark" aria-hidden="true">
            <UsersRound size={16} strokeWidth={1.8} />
          </div>
          <div>
            <div className="pcgo-users__eyebrow">IDENTITY DIRECTORY</div>
            <h2>User accounts</h2>
            <p>Control who can access the PCGO control plane.</p>
          </div>
        </div>

        <button
          type="button"
          className="pcgo-users__refresh"
          aria-label="Refresh user accounts"
          title="Refresh user accounts"
          disabled={loading}
          onClick={loadUsers}
        >
          <RefreshCw size={13} strokeWidth={1.9} className={loading ? "pcgo-users__spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="pcgo-users__scope-note">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>Admin-only directory. Account changes affect access, not session history or host state.</span>
      </div>

      <div className="pcgo-users__summary" aria-label="User account summary">
        <SummaryCell label="Accounts" value={users.length} />
        <SummaryCell label="Administrators" value={adminCount} tone="admin" />
        <SummaryCell label="Standard users" value={userCount} tone="user" />
      </div>

      <div className="pcgo-users__layout">
        <section className="pcgo-users__directory" aria-labelledby="pcgo-users-directory-title">
          <div className="pcgo-users__section-header">
            <div>
              <div className="pcgo-users__section-kicker">ACCESS CONTROL</div>
              <h3 id="pcgo-users-directory-title">User directory</h3>
            </div>
            <span className="pcgo-users__count">{users.length} loaded</span>
          </div>

          {loadError && users.length > 0 && (
            <div className="pcgo-users__stale-note" role="status">
              <AlertTriangle size={13} aria-hidden="true" />
              <span>Refresh failed. Showing the last loaded directory.</span>
              <button type="button" onClick={loadUsers}>Retry</button>
            </div>
          )}

          {loading && users.length === 0 ? (
            <UserDirectoryLoading />
          ) : loadError && users.length === 0 ? (
            <div className="pcgo-users__error" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <strong>Directory unavailable</strong>
              <p>{loadError}</p>
              <Button variant="secondary" onClick={loadUsers} disabled={loading}>
                <RefreshCw size={13} /> Retry loading users
              </Button>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              message="No user accounts found"
              subtext="Create the first account to give an operator access to PCGO."
              style={{ padding: "38px 18px" }}
            />
          ) : (
            <>
              <div className="pcgo-users__columns" aria-hidden="true">
                <span>Identity</span>
                <span>Role</span>
                <span>Added</span>
                <span>Action</span>
              </div>
              <div className="pcgo-users__list" role="list" aria-label="PCGO user accounts">
                {users.map((user) => {
                  const isProtectedAdmin = user.role === "admin" && onlyOneAdminExists;
                  const busy = deletingId === user.username || deletingAll;
                  return (
                    <div className="pcgo-users__row" role="listitem" key={user.username}>
                      <div className="pcgo-users__identity">
                        <span className="pcgo-users__identity-mark" aria-hidden="true">
                          {(user.username || "?").slice(0, 1).toUpperCase()}
                        </span>
                        <div className="pcgo-users__identity-copy">
                          <strong title={user.username}>{user.username}</strong>
                          {isProtectedAdmin && (
                            <span className="pcgo-users__protected"><ShieldCheck size={10} /> Last admin protected</span>
                          )}
                        </div>
                      </div>

                      <div className="pcgo-users__cell" data-label="Role">
                        <Chip tone={user.role === "admin" ? "yellow" : "blue"}>{user.role}</Chip>
                      </div>

                      <div className="pcgo-users__cell pcgo-users__date" data-label="Added">
                        <CalendarDays size={12} aria-hidden="true" />
                        {formatUserDate(user.created_at)}
                      </div>

                      <div className="pcgo-users__cell pcgo-users__action" data-label="Action">
                        <button
                          type="button"
                          className="pcgo-users__delete"
                          aria-label={`Remove ${user.username}`}
                          title={isProtectedAdmin ? "Last remaining admin cannot be removed" : `Remove ${user.username}`}
                          disabled={isProtectedAdmin || busy}
                          onClick={() => handleDelete(user.username)}
                        >
                          {deletingId === user.username ? <Spinner size={12} /> : <Trash2 size={13} strokeWidth={1.8} />}
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pcgo-users__bulk-action">
                <div>
                  <div className="pcgo-users__bulk-title">Bulk account cleanup</div>
                  <p>Removes every account except the oldest administrator.</p>
                </div>
                <Button variant="danger" disabled={noUserExists || deletingAll || !!deletingId} onClick={handleDeleteAll}>
                  {deletingAll ? <RefreshCw size={13} className="pcgo-users__spin" /> : <Trash2 size={13} />}
                  {deletingAll ? "Removing…" : "Remove excess accounts"}
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="pcgo-users__create" aria-labelledby="pcgo-users-create-title">
          <div className="pcgo-users__section-header">
            <div>
              <div className="pcgo-users__section-kicker">ADMIN ACTION</div>
              <h3 id="pcgo-users-create-title">Create user</h3>
            </div>
            <UserPlus size={16} aria-hidden="true" />
          </div>
          <p className="pcgo-users__form-intro">Add an account with the minimum access details required by the existing server contract.</p>

          <div className="pcgo-users__field">
            <label htmlFor="pcgo-user-username">Username</label>
            <input
              id="pcgo-user-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={!!validationError && !username.trim()}
            />
          </div>

          <div className="pcgo-users__field">
            <label htmlFor="pcgo-user-password">Password</label>
            <input
              id="pcgo-user-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!validationError && (!password.trim() || password.length < 6)}
            />
            <span className="pcgo-users__field-help">At least 6 characters, matching current client validation.</span>
          </div>

          <div className="pcgo-users__field">
            <label htmlFor="pcgo-user-role">Role</label>
            <select id="pcgo-user-role" name="role" value={userRole} onChange={(event) => setUserRole(event.target.value)}>
              <option value="user">USER — standard access</option>
              <option value="admin">ADMIN — control-plane access</option>
            </select>
          </div>

          {validationError && (
            <div className="pcgo-users__validation" role="alert">
              <AlertTriangle size={13} aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          <Button
            variant="primary"
            disabled={!username.trim() || !password.trim() || creating}
            onClick={handleCreate}
            aria-busy={creating}
            style={{ width: "100%", marginTop: "16px" }}
          >
            {creating ? <RefreshCw size={13} className="pcgo-users__spin" /> : <Check size={13} />}
            {creating ? "Creating user…" : "Create user"}
          </Button>

          <div className="pcgo-users__form-note">
            <User size={13} aria-hidden="true" />
            <span>User editing and password changes remain separate flows; this page only exposes the supported create and removal operations.</span>
          </div>
        </section>
      </div>
    </section>
  );
}

function SummaryCell({ label, value, tone = "neutral" }) {
  return (
    <div className={`pcgo-users__summary-cell pcgo-users__summary-cell--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UserDirectoryLoading() {
  return (
    <div className="pcgo-users__loading" aria-label="Loading user directory" role="status">
      {[1, 2, 3].map((item) => (
        <div className="pcgo-users__loading-row" key={item}>
          <span className="pcgo-users__loading-identity" />
          <span className="pcgo-users__loading-role" />
          <span className="pcgo-users__loading-date" />
          <span className="pcgo-users__loading-action" />
        </div>
      ))}
    </div>
  );
}

function formatUserDate(value) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(Number(value) * 1000));
}
