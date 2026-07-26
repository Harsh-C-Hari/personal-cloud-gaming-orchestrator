/**
 * src/components/SessionCard.test.jsx
 *
 * Covers the stop-session flow at the component level: the Stop button
 * calls stopSession() with the right id, schedules a refresh, disables
 * itself while the request is pending, and surfaces errors without
 * leaving the button stuck.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionCard } from "./SessionCard.jsx";
import * as api from "../api/client.js";

vi.mock("../api/client.js", () => ({
  stopSession: vi.fn(),
  restartSession: vi.fn(),
}));

function baseSession(overrides = {}) {
  return {
    session_id: "sess-1",
    user_id: "alice",
    game_id: "elden_ring",
    status: "running",
    remaining_minutes: 30,
    warning_sent: false,
    started_at: Date.now() / 1000 - 60,
    played_seconds: 60,
    skip_timer: false,
    restart_in_progress: false,
    restart_cooldown_remaining: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SessionCard — stop flow", () => {
  it("stops a running session and schedules a refresh", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    api.stopSession.mockResolvedValue({ success: true, message: "Session stopped." });
    const onRefresh = vi.fn();

    render(<SessionCard session={baseSession()} onRefresh={onRefresh} />);

    await user.click(screen.getByRole("button", { name: /stop session/i }));

    await waitFor(() => expect(api.stopSession).toHaveBeenCalledWith("sess-1"));

    // onRefresh fires 400ms later (no WS broadcast for "stopped").
    await vi.advanceTimersByTimeAsync(400);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("disables the button and shows a pending label while stopping", async () => {
    const user = userEvent.setup();
    let resolveStop;
    api.stopSession.mockReturnValue(
      new Promise((resolve) => {
        resolveStop = resolve;
      })
    );

    render(<SessionCard session={baseSession()} onRefresh={vi.fn()} />);

    const button = screen.getByRole("button", { name: /stop session/i });
    await user.click(button);

    expect(await screen.findByRole("button", { name: /stopping/i })).toBeDisabled();

    // A second click while pending must not fire a second request.
    await user.click(screen.getByRole("button", { name: /stopping/i }));
    expect(api.stopSession).toHaveBeenCalledTimes(1);

    resolveStop({ success: true, message: "Session stopped." });
    await waitFor(() => expect(screen.getByRole("button", { name: /stop session/i })).not.toBeDisabled());
  });

  it("shows the error message and re-enables the button when stopSession fails", async () => {
    const user = userEvent.setup();
    api.stopSession.mockRejectedValue(new Error("Host unreachable."));

    render(<SessionCard session={baseSession()} onRefresh={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /stop session/i }));

    expect(await screen.findByText(/host unreachable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stop session/i })).not.toBeDisabled();
  });

  it("hides the stop/restart controls entirely once a session has finished", () => {
    render(<SessionCard session={baseSession({ status: "completed" })} onRefresh={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /stop session/i })).not.toBeInTheDocument();
    expect(api.stopSession).not.toHaveBeenCalled();
  });
});
