import {
    useEffect,
    useState,
} from "react";

import {
    fetchUsers,
    createUser,
    deleteUser,
    deleteAllUsers,
} from "../api/client";

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

        if (password.length < 6) {
            return "Password must be at least 6 characters.";
        }

        return "";
    }

    return (
        <div style={formBox}>

            <h2>
                User Management
            </h2>

            <div style={cardStyle}>

                <h3>
                    Existing Users
                </h3>

                {
                    loading
                        ? (
                            <div>
                                Loading...
                            </div>
                        )
                        : users.map(
                            (
                                user,
                            ) => (
                                <div
                                    key={
                                        user.username
                                    }
                                    style={
                                        userRow
                                    }
                                >

                                    <div>

                                        <div style={userName}>
                                            {
                                                user.username
                                            }
                                        </div>

                                        <div style={meta}>
                                            {
                                                user.role.toUpperCase()
                                            }
                                            {" • "}
                                            {
                                                new Date(
                                                    user.created_at * 1000
                                                ).toLocaleDateString()
                                            }
                                        </div>

                                    </div>

                                    <button
                                        style={{
                                            ...deleteButton,
                                            opacity:
                                                (
                                                    user.role === "admin" &&
                                                    onlyOneAdminExists
                                                )
                                                    ? 0.4
                                                    : 1,

                                            cursor:
                                                (
                                                    user.role === "admin" &&
                                                    onlyOneAdminExists
                                                )
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}

                                        disabled={
                                            user.role === "admin" &&
                                            onlyOneAdminExists
                                        }

                                        onClick={() =>
                                            handleDelete(
                                                user.username
                                            )
                                        }

                                        onMouseEnter={(e) => {

                                            if (
                                                !(
                                                    user.role === "admin" &&
                                                    onlyOneAdminExists
                                                )
                                            ) {

                                                e.currentTarget.style.background =
                                                    "rgba(239,68,68,0.15)";
                                            }
                                        }}

                                        onMouseLeave={(e) => {

                                            e.currentTarget.style.background =
                                                "transparent";
                                        }}
                                    >
                                        🗑
                                    </button>

                                </div>
                            )
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
                    DELETE ALL EXCEPT OLDEST ADMIN
                </button>

            </div>

            <div style={cardStyle}>

                <h3>
                    Create User
                </h3>

                <input
                    style={input}
                    placeholder="Username"
                    value={username}
                    onChange={(e) =>
                        setUsername(
                            e.target.value
                        )
                    }
                />

                <input
                    type="password"
                    style={input}
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(
                            e.target.value
                        )
                    }
                />

                <select
                    style={input}
                    value={userRole}
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

                {
                    validationError && (
                        <div style={validationBad}>
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
                    }}
                    disabled={!canCreate}
                    onClick={
                        handleCreate
                    }
                    onMouseEnter={(e) => {

                        if (canCreate) {

                            e.currentTarget.style.background =
                                "rgba(56,189,248,0.15)";
                        }
                    }}

                    onMouseLeave={(e) => {

                        e.currentTarget.style.background =
                            "rgba(56,189,248,0.08)";
                    }}
                >
                    {
                        creating
                            ? "CREATING..."
                            : "CREATE USER"
                    }
                </button>

            </div>

        </div>
    );
}

const formBox = {
    marginTop: "14px",
    padding: "16px",
    background: "#080a0f",
    border: "1px solid #1c2130",
    borderRadius: "8px",
};

const cardStyle = {
    border: "1px solid #263041",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#080a0f",
};

const input = {
    width: "100%",
    padding: "9px 12px",
    background: "#05070b",
    border: "1px solid #1c2130",
    borderRadius: "6px",
    color: "#e2e8f0",
    marginBottom: "10px",
};

const saveButton = {
    width: "100%",
    padding: "10px",
    background: "rgba(56,189,248,0.08)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const userRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    marginBottom: "8px",
    border: "1px solid #1c2130",
    borderRadius: "6px",
};

const userName = {
    color: "#e2e8f0",
    fontSize: "12px",
};

const meta = {
    color: "#64748b",
    fontSize: "10px",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const deleteButton = {
  width: "38px",
  height: "36px",
  background: "transparent",
  border: "1px solid #ef4444",
  borderRadius: "6px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "16px",
};

const deleteAllButton = {
    width: "100%",
    marginTop: "10px",
    padding: "10px",
    border: "1px solid #ef4444",
    background:
        "rgba(239,68,68,0.08)",
    color: "#ef4444",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const validationBad = {
  marginTop: "10px",
  color: "#ef4444",
  fontSize: "11px",
  fontFamily:
    "'JetBrains Mono', monospace",
};