/**
 * src/pages/Login.test.jsx
 *
 * Covers the login flow end to end at the component level: entering
 * credentials, submitting, and both the success and failure paths —
 * plus the double-submit guard added for async-button consistency.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login.jsx";
import { ToastProvider } from "../components/ui/Toast.jsx";
import * as api from "../api/client.js";

vi.mock("../api/client.js", () => ({
  login: vi.fn(),
  bootstrapAdmin: vi.fn(),
  bootstrapRequired: vi.fn(),
  setToken: vi.fn(),
}));

function renderLogin() {
  return render(
    <ToastProvider>
      <Login />
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  // No admin bootstrap needed by default — plain login form.
  api.bootstrapRequired.mockResolvedValue({ required: false });
});

describe("Login", () => {
  it("logs in with valid credentials: stores the token, saves the session, and reloads", async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ access_token: "tok-1", username: "alice", role: "admin" });

    renderLogin();

    // Wait for the bootstrap-check effect to settle so we're on the plain
    // sign-in form (not a stale "Register Admin" state).
    await screen.findByRole("button", { name: /sign in/i });

    await user.type(screen.getByPlaceholderText(/enter your username/i), "alice");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "hunter2");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith("alice", "hunter2"));

    expect(api.setToken).toHaveBeenCalledWith("tok-1");
    expect(window.localStorage.getItem("username")).toBe("alice");
    expect(window.localStorage.getItem("role")).toBe("admin");
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("shows the backend error message on invalid credentials and does not store a token", async () => {
    const user = userEvent.setup();
    api.login.mockRejectedValue(new Error("Invalid username or password."));

    renderLogin();
    await screen.findByRole("button", { name: /sign in/i });

    await user.type(screen.getByPlaceholderText(/enter your username/i), "alice");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    expect(api.setToken).not.toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("disables the submit button and shows a pending label while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    api.login.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLogin();
    await screen.findByRole("button", { name: /sign in/i });

    await user.type(screen.getByPlaceholderText(/enter your username/i), "alice");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "hunter2");

    const button = screen.getByRole("button", { name: /sign in/i });
    await user.click(button);

    // Still pending: button is disabled and label reflects the in-flight state.
    expect(await screen.findByRole("button", { name: /signing in/i })).toBeDisabled();

    // A second click while pending must not fire a second request
    // (the submitting guard added to handleSubmit).
    await user.click(screen.getByRole("button", { name: /signing in/i }));
    expect(api.login).toHaveBeenCalledTimes(1);

    resolveLogin({ access_token: "tok-1", username: "alice", role: "admin" });
    await waitFor(() => expect(api.setToken).toHaveBeenCalled());
  });

  it("shows the admin bootstrap form when no admin account exists yet", async () => {
    api.bootstrapRequired.mockResolvedValue({ required: true });
    api.bootstrapAdmin.mockResolvedValue({ success: true });

    const user = userEvent.setup();
    renderLogin();

    expect(await screen.findByRole("button", { name: /register admin/i })).toBeInTheDocument();
    expect(screen.getByText(/no admin account detected/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/enter your username/i), "admin");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "adminpass");
    await user.click(screen.getByRole("button", { name: /register admin/i }));

    await waitFor(() => expect(api.bootstrapAdmin).toHaveBeenCalledWith("admin", "adminpass"));
    expect(api.login).not.toHaveBeenCalled();
  });
});
