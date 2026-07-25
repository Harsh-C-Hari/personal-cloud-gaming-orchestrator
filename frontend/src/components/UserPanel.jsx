/**
 * components/UserPanel.jsx
 *
 * Same API calls / validation / business logic as before (fetchUsers,
 * createUser, deleteUser, deleteAllUsers, validateUserForm, admin/oldest-admin
 * guard rails) — only the UI was redesigned to match the visual language
 * already used by GameManager / SettingsPanel / StartSessionForm / RecoveryStats:
 *   - Card-shell header (icon badge + title + live count) instead of a
 *     bare "User Management" heading.
 *   - Existing users rendered as an icon-labeled card grid instead of
 *     plain flex rows.
 *   - The create-user form uses the same FieldLabel + focus-ring input
 *     pattern as the rest of the app, inside a labeled cardSection.
 *   - Status / validation messaging now uses the same icon + colored-mono
 *     alert-box treatment as the rest of the app.
 *
 * No functional change: every handler, state variable, validation rule,
 * and API call below is untouched from the previous implementation.
 */

import {
    useEffect,
    useState,
} from "react";

import {
    FaUsersCog,
    FaUserPlus,
    FaUserShield,
    FaUser,
    FaSyncAlt,
    FaTrashAlt,
    FaCalendarAlt,
    FaChevronDown,
    FaExclamationTriangle,
    FaBan,
} from "react-icons/fa";

import {
    fetchUsers,
    createUser,
    deleteUser,
    deleteAllUsers,
} from "../api/client";

// ── Shared design tokens (matches GameManager / SettingsPanel /
// StartSessionForm / RecoveryStats / HostMonitor) ───────────────────────

const palette = {
    bg: "#000000",
    card: "rgba(0, 0, 0, 0.55)",
    cardAlt: "rgba(2,6,23,0.45)",
    border: "#1c2130",
    borderStrong: "rgba(148,163,184,0.18)",
    text: "#e2e8f0",
    dim: "#94a3b8",
    faint: "#64748b",
    muted: "#475569",
    accent: "#38bdf8",
    success: "#10d98a",
    warning: "#f5a524",
    danger: "#f43f5e",
    mono: "'JetBrains Mono', monospace",
    display: "'Rajdhani', sans-serif",
};

export function UserPanel() {

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

            alert(
                err.message
            );

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

            alert(
                err.message
            );

        } finally {

            setCreating(false);

        }
    }

    async function handleDelete(
        target,
    ) {

        if (
            !window.confirm(
                `Delete ${target}?`
            )
        ) {
            return;
        }

        try {

            await deleteUser(
                target
            );

            await loadUsers();

        } catch (err) {

            alert(
                err.message
            );

        }
    }

    async function handleDeleteAll() {

        if (
            !window.confirm(
                "Delete all users except oldest admin?"
            )
        ) {
            return;
        }

        try {

            await deleteAllUsers();

            await loadUsers();

        } catch (err) {

            alert(
                err.message
            );

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

        if (password.length < 8) {
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
                        <FaUsersCog size={13} />
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <FaSyncAlt size={12} style={loading ? { animation: "up-spin 0.8s linear infinite" } : undefined} />
                </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Existing users */}
                <div style={cardSection}>

                    <div style={sectionHeadRow}>
                        <span style={sectionLabel}>Existing Users</span>
                        <span style={countBadge}>{users.length}</span>
                    </div>

                    {
                        loading
                            ? (
                                <div style={loadingRow}>
                                    <span style={pulseDot} />
                                    Loading users...
                                </div>
                            )
                            : users.length === 0
                                ? (
                                    <div style={emptyBox}>
                                        <FaUsersCog size={22} style={{ color: palette.muted, opacity: 0.6 }} />
                                        <div style={{ fontSize: "11px", color: palette.dim, fontFamily: palette.mono }}>
                                            No users found
                                        </div>
                                    </div>
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
                                                            <div style={cardTopAccent} />

                                                            <div style={cardHeaderRow}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                                                                    <div
                                                                        style={{
                                                                            ...avatarBadge,
                                                                            background:
                                                                                user.role === "admin"
                                                                                    ? "rgba(245,165,36,0.12)"
                                                                                    : "rgba(56,189,248,0.12)",
                                                                            borderColor:
                                                                                user.role === "admin"
                                                                                    ? "rgba(245,165,36,0.35)"
                                                                                    : "rgba(56,189,248,0.3)",
                                                                            color:
                                                                                user.role === "admin"
                                                                                    ? palette.warning
                                                                                    : palette.accent,
                                                                        }}
                                                                    >
                                                                        {user.role === "admin" ? <FaUserShield size={12} /> : <FaUser size={12} />}
                                                                    </div>

                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={userName} title={user.username}>
                                                                            {user.username}
                                                                        </div>
                                                                        <div style={cardMeta}>
                                                                            <FaCalendarAlt size={9} style={{ opacity: 0.7, flexShrink: 0 }} />
                                                                            {new Date(user.created_at * 1000).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    title={isProtectedAdmin ? "Last remaining admin cannot be deleted" : `Delete ${user.username}`}
                                                                    aria-label={`Delete ${user.username}`}
                                                                    style={{
                                                                        ...cardDeleteButton,
                                                                        opacity: isProtectedAdmin ? 0.4 : 1,
                                                                        cursor: isProtectedAdmin ? "not-allowed" : "pointer",
                                                                    }}
                                                                    disabled={isProtectedAdmin}
                                                                    onClick={() => handleDelete(user.username)}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isProtectedAdmin) {
                                                                            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "transparent";
                                                                    }}
                                                                >
                                                                    <FaTrashAlt size={11} />
                                                                </button>
                                                            </div>

                                                            <span
                                                                style={{
                                                                    ...roleBadge,
                                                                    color: user.role === "admin" ? palette.warning : palette.accent,
                                                                    borderColor: user.role === "admin" ? "rgba(245,165,36,0.4)" : "rgba(56,189,248,0.35)",
                                                                    background: user.role === "admin" ? "rgba(245,165,36,0.08)" : "rgba(56,189,248,0.08)",
                                                                }}
                                                            >
                                                                {user.role.toUpperCase()}
                                                            </span>

                                                            {isProtectedAdmin && (
                                                                <div style={protectedNote}>
                                                                    <FaBan size={9} style={{ flexShrink: 0 }} />
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

                    <button
                        style={{
                            ...deleteAllButton,

                            opacity:
                                noUserExists
                                    ? 0.4
                                    : 1,

                            cursor:
                                noUserExists
                                    ? "not-allowed"
                                    : "pointer",
                        }}

                        disabled={
                            noUserExists
                        }

                        onClick={
                            handleDeleteAll
                        }

                        onMouseEnter={(e) => {

                            if (!noUserExists) {

                                e.currentTarget.style.background =
                                    "rgba(239,68,68,0.15)";
                            }
                        }}

                        onMouseLeave={(e) => {

                            e.currentTarget.style.background =
                                "rgba(239,68,68,0.08)";
                        }}
                    >
                        <FaTrashAlt size={11} />
                        DELETE ALL EXCEPT OLDEST ADMIN
                    </button>

                </div>

                {/* Create user */}
                <div style={cardSection}>

                    <div style={sectionHeadRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={sectionIconBadge}>
                                <FaUserPlus size={12} />
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
                        <FaChevronDown
                            size={10}
                            style={{
                                position: "absolute",
                                right: "13px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: palette.muted,
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    {
                        validationError && (
                            <div style={validationBad}>
                                <FaExclamationTriangle size={11} style={{ flexShrink: 0 }} />
                                {validationError}
                            </div>
                        )
                    }

                    <button
                        style={{
                            ...saveButton,

                            opacity:
                                canCreate
                                    ? 1
                                    : 0.5,

                            cursor:
                                canCreate
                                    ? "pointer"
                                    : "not-allowed",

                            marginTop: validationError ? "12px" : "16px",
                        }}
                        disabled={!canCreate}
                        onClick={
                            handleCreate
                        }
                        onMouseEnter={(e) => {

                            if (canCreate) {

                                e.currentTarget.style.background =
                                    "linear-gradient(180deg, rgba(56,189,248,0.24), rgba(56,189,248,0.12))";
                            }
                        }}

                        onMouseLeave={(e) => {

                            e.currentTarget.style.background =
                                "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))";
                        }}
                    >
                        <FaUserPlus size={12} />
                        {
                            creating
                                ? "CREATING..."
                                : "CREATE USER"
                        }
                    </button>

                </div>

            </div>

            <style>{`@keyframes up-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes up-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        </div>
    );
}

function FieldLabel({ children }) {
    return (
        <label
            style={{
                display: "block",
                fontSize: "9.5px",
                color: palette.muted,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: palette.mono,
                marginBottom: "7px",
                marginTop: "14px",
            }}
        >
            {children}
        </label>
    );
}

const focusBorder = (e) => {
    e.target.style.borderColor = "rgba(56,189,248,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)";
};
const blurBorder = (e) => {
    e.target.style.borderColor = palette.border;
    e.target.style.boxShadow = "none";
};

// ── Style primitives (matches GameManager / SettingsPanel) ─────────────

const outerWrap = {
    border: `1px solid ${palette.border}`,
    borderRadius: "12px",
    background: "rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
    marginTop: "14px",
};

const headerBar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "16px 20px",
    borderBottom: `1px solid ${palette.border}`,
    background: "rgb(0, 5, 6)",
};

const headerIconBadge = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.3)",
    color: palette.accent,
    fontSize: "13px",
    flexShrink: 0,
};

const headerTitle = {
    fontSize: "13.5px",
    fontWeight: 700,
    color: palette.text,
    fontFamily: palette.display,
    letterSpacing: "0.02em",
};

const headerSubtitle = {
    fontSize: "10px",
    color: palette.faint,
    fontFamily: palette.mono,
    marginTop: "1px",
    letterSpacing: "0.02em",
};

const iconGhostButton = {
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    background: "transparent",
    border: `1px solid ${palette.border}`,
    color: palette.accent,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
    flexShrink: 0,
};

const cardSection = {
    padding: "16px",
    borderRadius: "10px",
    border: `1px solid ${palette.border}`,
    background: palette.card,
};

const sectionHeadRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
};

const sectionLabel = {
    fontSize: "9.5px",
    color: palette.muted,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontFamily: palette.mono,
};

const sectionIconBadge = {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.28)",
    color: palette.accent,
    flexShrink: 0,
};

const countBadge = {
    fontSize: "9px",
    color: palette.textGhost || palette.muted,
    fontFamily: palette.mono,
    padding: "1px 7px",
    border: `1px solid ${palette.border}`,
    borderRadius: "10px",
};

const loadingRow = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "16px 4px",
    color: palette.dim,
    fontFamily: palette.mono,
    fontSize: "11.5px",
};

const pulseDot = {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: palette.accent,
    animation: "up-pulse 1.4s ease-in-out infinite",
    flexShrink: 0,
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px 24px",
    border: `1px dashed ${palette.border}`,
    borderRadius: "10px",
    textAlign: "center",
};

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
};

const userCard = {
    position: "relative",
    padding: "14px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: "10px",
    overflow: "hidden",
};

const cardTopAccent = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
    opacity: 0.8,
};

const cardHeaderRow = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
};

const avatarBadge = {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    flexShrink: 0,
};

const userName = {
    color: palette.text,
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: palette.display,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const cardMeta = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: palette.mono,
    fontSize: "9.5px",
    color: palette.faint,
    marginTop: "3px",
};

const cardDeleteButton = {
    width: "26px",
    height: "26px",
    flexShrink: 0,
    borderRadius: "6px",
    background: "transparent",
    border: "1px solid rgba(239,68,68,0.4)",
    color: palette.danger,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
};

const roleBadge = {
    display: "inline-block",
    marginTop: "11px",
    fontSize: "9px",
    fontFamily: palette.mono,
    letterSpacing: "0.1em",
    padding: "3px 9px",
    borderRadius: "10px",
    border: "1px solid",
};

const protectedNote = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "8px",
    fontSize: "9.5px",
    fontFamily: palette.mono,
    color: palette.muted,
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: "7px",
    color: palette.text,
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

const saveButton = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "12px",
    background: "linear-gradient(180deg, rgba(56,189,248,0.16), rgba(56,189,248,0.08))",
    border: "1px solid rgba(56,189,248,0.4)",
    borderRadius: "8px",
    color: palette.accent,
    fontSize: "11.5px",
    fontFamily: palette.mono,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textShadow: "0 0 14px rgba(56,189,248,0.4)",
    transition: "background 0.2s",
};

const deleteAllButton = {
    width: "100%",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    border: `1px solid ${palette.danger}`,
    background: "rgba(239,68,68,0.08)",
    color: palette.danger,
    borderRadius: "7px",
    cursor: "pointer",
    fontFamily: palette.mono,
    fontSize: "10.5px",
    letterSpacing: "0.08em",
    transition: "background 0.15s",
};

const validationBad = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
    padding: "10px 12px",
    borderRadius: "7px",
    color: palette.danger,
    border: `1px solid ${palette.danger}`,
    background: "rgba(244,63,94,0.08)",
    fontSize: "11px",
    fontFamily: palette.mono,
};
