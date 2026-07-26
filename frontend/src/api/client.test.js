/**
 * src/api/client.test.js
 *
 * Covers the request/response contract for the three critical flows
 * (login, start session, stop session) at the network layer: correct
 * method/URL/body/auth-header on the way out, and correct success/error
 * handling on the way back. Component-level tests (Login.test.jsx,
 * SessionCard.test.jsx, StartSessionForm.test.jsx) cover the UI wired on
 * top of these.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, startSession, stopSession, getToken, setToken, clearToken, isLoggedIn } from "./client.js";

const BASE_URL = "http://127.0.0.1:8100";

function mockFetchOnce(status, body) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  window.localStorage.clear();
  globalThis.fetch = vi.fn();
});

describe("token helpers", () => {
  it("round-trips a token through localStorage", () => {
    expect(isLoggedIn()).toBe(false);
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(isLoggedIn()).toBe(true);
    clearToken();
    expect(getToken()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});

describe("login()", () => {
  it("POSTs credentials to /auth/login and returns the parsed response", async () => {
    mockFetchOnce(200, { access_token: "tok-1", username: "alice", role: "admin" });

    const result = await login("alice", "hunter2");

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/auth/login`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ username: "alice", password: "hunter2" });
    expect(result).toEqual({ access_token: "tok-1", username: "alice", role: "admin" });
  });

  it("throws with the backend detail message on invalid credentials, and does not redirect", async () => {
    mockFetchOnce(401, { detail: "Invalid username or password." });

    await expect(login("alice", "wrong")).rejects.toThrow("Invalid username or password.");

    // /auth/login is explicitly exempted from the global 401 -> clear
    // token + redirect behavior (it wouldn't make sense to redirect a
    // failed login attempt back to the login page it's already on).
    expect(window.location.href).not.toBe("/login");
  });

  it("does not attach an Authorization header (no token yet)", async () => {
    mockFetchOnce(200, { access_token: "tok-1", username: "alice", role: "admin" });

    await login("alice", "hunter2");

    const [, init] = globalThis.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });
});

describe("startSession()", () => {
  it("POSTs the session payload to /sessions/start with the auth header attached", async () => {
    setToken("tok-1");
    mockFetchOnce(200, { success: true, session_id: "sess-1", message: "Session launched." });

    const payload = {
      game_id: "elden_ring",
      duration: 60,
      warning: 5,
      skip_timer: false,
      load_save_type: "latest",
      load_save_name: null,
    };

    const result = await startSession(payload);

    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/sessions/start`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(JSON.parse(init.body)).toEqual(payload);
    expect(result).toEqual({ success: true, session_id: "sess-1", message: "Session launched." });
  });

  it("surfaces the backend validation message when the request is rejected", async () => {
    setToken("tok-1");
    mockFetchOnce(400, { detail: "Another session is already active for this user." });

    await expect(
      startSession({
        game_id: "elden_ring",
        duration: 60,
        warning: 5,
        skip_timer: false,
        load_save_type: "latest",
        load_save_name: null,
      })
    ).rejects.toThrow("Another session is already active for this user.");
  });
});

describe("stopSession()", () => {
  it("POSTs to /sessions/:id/stop with no body, auth header attached", async () => {
    setToken("tok-1");
    mockFetchOnce(200, { success: true, message: "Session stopped." });

    const result = await stopSession("sess-1");

    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/sessions/sess-1/stop`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(init.headers["Content-Type"]).toBeUndefined(); // no body => no Content-Type
    expect(result).toEqual({ success: true, message: "Session stopped." });
  });

  it("clears the token and redirects to /login on a 401 (expired session)", async () => {
    setToken("tok-expired");
    mockFetchOnce(401, { detail: "Not authenticated." });

    await expect(stopSession("sess-1")).rejects.toThrow("Not authenticated.");

    expect(getToken()).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("surfaces a generic error when the backend returns no JSON body", async () => {
    setToken("tok-1");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(stopSession("sess-1")).rejects.toThrow("Request failed with status 500");
  });
});
