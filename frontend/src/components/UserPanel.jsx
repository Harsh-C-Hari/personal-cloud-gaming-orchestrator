/**
 * components/UserPanel.jsx
 *
 * Same API calls / validation / business logic as before (fetchUsers,
 * createUser, deleteUser, deleteAllUsers, validateUserForm, admin/oldest-admin
 * guard rails) — only the UI was redesigned to match DESIGN_SYSTEM.md:
 *   - Existing-users and create-user sections now use the shared `Card`
 *     primitive instead of a hand-rolled bordered div.
 *   - Role badges use the shared `Chip` primitive (flat wash, no border)
 *     instead of a custom pill.
 *   - "No users found" uses the shared `EmptyState` primitive.
 *   - Loading uses the shared `Spinner` primitive instead of a pulsing dot.
 *   - Create / Delete-all use the shared `Button` primitive (flat, no
 *     gradient, no glow) instead of custom cyan-gradient / red buttons.
 *   - The gradient top-accent bar on user cards is gone (gradients are
 *     banned by the design system) — cards separate via border only.
 *   - Icons migrated from `react-icons/fa` to `lucide-react`, per
 *     DESIGN_SYSTEM.md §7.
 *   - All colors/fonts/radius now come from `dashboard/theme.js` — the old
 *     local `palette` (cyan accent, Rajdhani display font) is gone.
 *
 * No functional change: every handler, state variable, validation rule,
 * and API call below is untouched from the previous implementation.
 */

import {
    useEffect,
    useState,
} from "react";

import {
    UsersRound,
    UserPlus,
    ShieldCheck,
    User,
    RefreshCw,
    Trash2,
    CalendarDays,
    ChevronDown,
    AlertTriangle,
    Ban,
} from "lucide-react";

import {
    fetchUsers,
    createUser,
    deleteUser,
    deleteAllUsers,
} from "../api/client";
import { useToast } from "./ui/Toast.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { Card, Button, Chip, Spinner, EmptyState } from "./ui/primitives.jsx";
import { colors, fonts, radius } from "../dashboard/theme.js";

export function UserPanel() {

    const toast = useToast();
    const confirm = useConfirm();

    const role =
        localStorage.getItem(
            "role"
        );

    const [
        users,
        setUsers,
    ] = useState([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        userRole,
        setUserRole,
    ] = useState("user");

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        deletingId,
        setDeletingId,
    ] = useState(null);

    const [
        deletingAll,
        setDeletingAll,
    ] = useState(false);

    const adminCount =
        users.filter(
            (user) =>
                user.role === "admin"
        ).length;

    const userCount =
        users.filter(
            (user) =>
                user.role != "admin"
        ).length;

    const onlyOneAdminExists =
        adminCount === 1;

    const noUserExists =
        adminCount === 0;

    const [
        validationError,
        setValidationError,
    ] = useState("");

    async function loadUsers() {

        try {

            setLoading(true);

            const data =
                await fetchUsers();

            setUsers(data);

        } catch (err) {

            toast.error(err.message);

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {

        if (
            role === "admin"
        ) {
            loadUsers();
        }

    }, []);

    async function handleCreate() {

        const error =
            validateUserForm();

        if (error) {

            setValidationError(
                error
            );

            return;
        }

        setValidationError("");

        try {

            setCreating(true);

            await createUser({
                username,
                password,
                role: userRole,
            });

            setUsername("");
            setPassword("");
            setUserRole(
                "user"
            );

            await loadUsers();

        } catch (err) {

            toast.error(err.message);

        } finally {

            setCreating(false);

        }
    }

    async function handleDelete(
        target,
    ) {

        if (deletingId || deletingAll) return;

        if (
            !(await confirm(`Delete ${target}?`, { danger: true, confirmLabel: "Delete" }))
        ) {
            return;
        }

        try {

            setDeletingId(target);

            await deleteUser(
                target
            );

            await loadUsers();

        } catch (err) {

            toast.error(err.message);

        } finally {

            setDeletingId(null);

        }
    }

    async function handleDeleteAll() {

        if (deletingId || deletingAll) return;

        if (
            !(await confirm("Delete all users except oldest admin?", { danger: true, confirmLabel: "Delete All" }))
        ) {
            return;
        }

        try {

            setDeletingAll(true);

            await deleteAllUsers();

            await loadUsers();

        } catch (err) {

            toast.error(err.message);

        } finally {

            setDeletingAll(false);

        }
    }

    if (
        role !== "admin"
    ) {
        return null;
    }

    const canCreate =
        username.trim().length > 0 &&
        password.trim().length > 0 &&
        !creating;

    function validateUserForm() {

        if (!username.trim()) {
            return "Username required.";
        }

        if (username.length < 3) {
            return "Username must be at least 3 characters.";
        }

        if (!password.trim()) {
            return "Password required.";
        }

        if (password.length < 6) {
            return "Password must be at least 6 characters.";
        }

        return "";
    }

    return (
        <div style={outerWrap}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={headerBar}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={headerIconBadge}>
                        <UsersRound size={13} strokeWidth={2} />
                    </div>
                    <div>
                        <div style={headerTitle}>User Management</div>
                        <div style={headerSubtitle}>
                            {users.length} account{users.length === 1 ? "" : "s"} &middot;{" "}
                            {adminCount} admin{adminCount === 1 ? "" : "s"} &middot; {userCount} user{userCount === 1 ? "" : "s"}
                        </div>
                    </div>
                </div>

                <button
                    title="Reload users"
                    aria-label="Reload users"
                    disabled={loading}
                    style={{ ...iconGhostButton, opacity: loading ? 0.5 : 1 }}
                    onClick={loadUsers}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.brandDim)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <RefreshCw size={12} strokeWidth={2} style={loading ? { animation: "up-spin 0.8s linear infinite" } : undefined} />
                </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Existing users */}
                <Card style={{ padding: "16px" }}>

                    <div style={sectionHeadRow}>
                        <span style={sectionLabel}>Existing Users</span>
                        <span style={countBadge}>{users.length}</span>
                    </div>

                    {
                        loading
                            ? (
                                <div style={loadingRow}>
                                    <Spinner size={14} />
                                    Loading users...
                                </div>
                            )
                            : users.length === 0
                                ? (
                                    <EmptyState
                                        icon={UsersRound}
                                        message="No users found"
                                        style={{ padding: "32px 20px" }}
                                    />
                                )
                                : (
                                    <div style={grid}>
                                        {
                                            users.map(
                                                (
                                                    user,
                                                ) => {
                                                    const isProtectedAdmin =
                                                        user.role === "admin" &&
                                                        onlyOneAdminExists;

                                                    return (
                                                        <div
                                                            key={user.username}
                                                            style={userCard}
                                                        >
                                                            <div style={cardHeaderRow}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                                                                    <div
                                                                        style={{
                                                                            ...avatarBadge,
                                                                            background:
                                                                                user.role === "admin"
                                                                                    ? colors.accentYellowDim
                                                                                    : colors.brandDim,
                                                                            borderColor:
                                                                                user.role === "admin"
                                                                                    ? colors.accentYellow
                                                                                    : colors.brand,
                                                                            color:
                                                                                user.role === "admin"
                                                                                    ? colors.accentYellow
                                                                                    : colors.brand,
                                                                        }}
                                                                    >
                                                                        {user.role === "admin" ? <ShieldCheck size={13} strokeWidth={2} /> : <User size={13} strokeWidth={2} />}
                                                                    </div>

                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={userName} title={user.username}>
                                                                            {user.username}
                                                                        </div>
                                                                        <div style={cardMeta}>
                                                                            <CalendarDays size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                                                                            {new Date(user.created_at * 1000).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    title={isProtectedAdmin ? "Last remaining admin cannot be deleted" : `Delete ${user.username}`}
                                                                    aria-label={`Delete ${user.username}`}
                                                                    style={{
                                                                        ...cardDeleteButton,
                                                                        opacity: isProtectedAdmin || deletingId === user.username || deletingAll ? 0.4 : 1,
                                                                        cursor: isProtectedAdmin || deletingId === user.username || deletingAll ? "not-allowed" : "pointer",
                                                                    }}
                                                                    disabled={isProtectedAdmin || deletingId === user.username || deletingAll}
                                                                    onClick={() => handleDelete(user.username)}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isProtectedAdmin && deletingId !== user.username && !deletingAll) {
                                                                            e.currentTarget.style.background = "rgba(255,107,107,0.15)";
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "transparent";
                                                                    }}
                                                                >
                                                                    {deletingId === user.username ? (
                                                                        <RefreshCw size={10} strokeWidth={2} style={{ animation: "up-spin 0.8s linear infinite" }} />
                                                                    ) : (
                                                                        <Trash2 size={11} strokeWidth={2} />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            <Chip
                                                                tone={user.role === "admin" ? "yellow" : "blue"}
                                                                style={{ marginTop: "11px" }}
                                                            >
                                                                {user.role}
                                                            </Chip>

                                                            {isProtectedAdmin && (
                                                                <div style={protectedNote}>
                                                                    <Ban size={9} strokeWidth={2} style={{ flexShrink: 0 }} />
                                                                    Last admin &mdash; protected
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )
                                        }
                                    </div>
                                )
                    }

                    <Button
                        variant="danger"
                        disabled={noUserExists || deletingAll || !!deletingId}
                        onClick={handleDeleteAll}
                        style={{ width: "100%", marginTop: "4px" }}
                    >
                        {deletingAll ? (
                            <RefreshCw size={11} strokeWidth={2} style={{ animation: "up-spin 0.8s linear infinite" }} />
                        ) : (
                            <Trash2 size={11} strokeWidth={2} />
                        )}
                        {deletingAll ? "Deleting…" : "Delete All Except Oldest Admin"}
                    </Button>

                </Card>

                {/* Create user */}
                <Card style={{ padding: "16px" }}>

                    <div style={sectionHeadRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={sectionIconBadge}>
                                <UserPlus size={12} strokeWidth={2} />
                            </div>
                            <span style={sectionLabel}>Create User</span>
                        </div>
                    </div>

                    <FieldLabel>Username</FieldLabel>
                    <input
                        style={inputStyle}
                        placeholder="Username"
                        value={username}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                    />

                    <FieldLabel>Password</FieldLabel>
                    <input
                        type="password"
                        style={inputStyle}
                        placeholder="Password"
                        value={password}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />

                    <FieldLabel>Role</FieldLabel>
                    <div style={{ position: "relative" }}>
                        <select
                            style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "34px" }}
                            value={userRole}
                            onFocus={focusBorder}
                            onBlur={blurBorder}
                            onChange={(e) =>
                                setUserRole(
                                    e.target.value
                                )
                            }
                        >
                            <option value="user">
                                USER
                            </option>

                            <option value="admin">
                                ADMIN
                            </option>
                        </select>
                        <ChevronDown
                            size={10}
                            style={{
                                position: "absolute",
                                right: "13px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: colors.inkFaint,
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    {
                        validationError && (
                            <div style={validationBad}>
                                <AlertTriangle size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
                                {validationError}
                            </div>
                        )
                    }

                    <Button
                        variant="primary"
                        disabled={!canCreate}
                        onClick={handleCreate}
                        style={{ width: "100%", marginTop: validationError ? "12px" : "16px" }}
                    >
                        <UserPlus size={12} strokeWidth={2} />
                        {
                            creating
                                ? "Creating..."
                                : "Create User"
                        }
                    </Button>

                </Card>

            </div>

            <style>{`@keyframes up-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <label
            style={{
                display: "block",
                fontSize: "9.5px",
                color: colors.inkFaint,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: fonts.mono,
                fontWeight: 700,
                marginBottom: "7px",
                marginTop: "14px",
            }}
        >
            {children}
        </label>
    );
}

const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
};
const blurBorder = (e) => {
    e.target.style.borderColor = colors.border;
};

// ── Style primitives (matches GameManager / SettingsPanel) ─────────────

const outerWrap = {
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.lg}px`,
    background: colors.bgCard,
    overflow: "hidden",
    marginTop: "14px",
};

const headerBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "8px",
    gap: "10px",
    padding: "16px 20px",
    borderBottom: `1.5px solid ${colors.border}`,
    background: colors.bgElevated,
};

const headerIconBadge = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brandDim,
    border: `1.5px solid ${colors.brand}`,
    color: colors.brand,
    fontSize: "13px",
    flexShrink: 0,
};

const headerTitle = {
    fontSize: "13.5px",
    fontWeight: 700,
    color: colors.ink,
    fontFamily: fonts.display,
    letterSpacing: "0.02em",
};

const headerSubtitle = {
    fontSize: "10px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
    marginTop: "1px",
    letterSpacing: "0.02em",
};

const iconGhostButton = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    background: "transparent",
    border: `1.5px solid ${colors.border}`,
    color: colors.brand,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 150ms ease",
    flexShrink: 0,
};

const sectionHeadRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "6px",
    marginBottom: "14px",
};

const sectionLabel = {
    fontSize: "9.5px",
    color: colors.inkFaint,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontFamily: fonts.mono,
    fontWeight: 700,
};

const sectionIconBadge = {
    width: "24px",
    height: "24px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.brandDim,
    border: `1.5px solid ${colors.brand}`,
    color: colors.brand,
    flexShrink: 0,
};

const countBadge = {
    fontSize: "9px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
    fontWeight: 700,
    padding: "1px 7px",
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.full}px`,
};

const loadingRow = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "16px 4px",
    color: colors.inkDim,
    fontFamily: fonts.mono,
    fontSize: "11.5px",
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
};

const userCard = {
    position: "relative",
    padding: "14px",
    background: colors.bgElevated,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    overflow: "hidden",
};

const cardHeaderRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: "6px",
    gap: "8px",
};

const avatarBadge = {
    width: "30px",
    height: "30px",
    borderRadius: `${radius.sm}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid",
    flexShrink: 0,
};

const userName = {
    color: colors.ink,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: fonts.display,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const cardMeta = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: fonts.mono,
    fontSize: "9.5px",
    color: colors.inkFaint,
    marginTop: "3px",
};

const cardDeleteButton = {
    width: "26px",
    height: "26px",
    flexShrink: 0,
    borderRadius: `${radius.sm}px`,
    background: "transparent",
    border: `1.5px solid ${colors.danger}66`,
    color: colors.danger,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 150ms ease",
};

const protectedNote = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "8px",
    fontSize: "9.5px",
    fontFamily: fonts.mono,
    color: colors.inkFaint,
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: colors.bgInset,
    border: `1.5px solid ${colors.border}`,
    borderRadius: `${radius.md}px`,
    color: colors.ink,
    fontSize: "13px",
    fontFamily: fonts.body,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 150ms ease",
};

const validationBad = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
    padding: "10px 12px",
    borderRadius: `${radius.sm}px`,
    color: colors.danger,
    border: `1.5px solid ${colors.danger}`,
    background: "rgba(255,107,107,0.1)",
    fontSize: "11px",
    fontFamily: fonts.mono,
};
