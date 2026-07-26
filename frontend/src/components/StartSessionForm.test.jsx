/**
 * src/components/StartSessionForm.test.jsx
 *
 * Covers the start-session flow at the component level: selecting a game
 * (which triggers the saves-lookup and game-validation effects), then
 * launching, calls startSession() with the expected payload and reports
 * success back via onLaunched.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartSessionForm } from "./StartSessionForm.jsx";
import { ToastProvider } from "./ui/Toast.jsx";
import { ConfirmDialogProvider } from "./ui/ConfirmDialog.jsx";
import * as api from "../api/client.js";

vi.mock("../api/client.js", () => ({
  fetchSaves: vi.fn(),
  validateGame: vi.fn(),
  startSession: vi.fn(),
  deleteSave: vi.fn(),
}));

const GAMES = {
  elden_ring: { name: "Elden Ring", exe_name: "eldenring.exe", process_name: "eldenring" },
};

const READY_HOST_STATUS = {
  host_ready: true,
  host_state: "ready",
  sunshine_running: true,
  tailscale_running: true,
  sunshine_api_reachable: true,
  sunshine_apps_count: 1,
};

function renderForm(props = {}) {
  return render(
    <ToastProvider>
      <ConfirmDialogProvider>
        <StartSessionForm
          games={GAMES}
          onLaunched={vi.fn()}
          hostStatus={READY_HOST_STATUS}
          activeSessions={[]}
          {...props}
        />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchSaves.mockResolvedValue({ latest_exists: false, archives: [], backups: [] });
  api.validateGame.mockResolvedValue({ valid: true });
});

describe("StartSessionForm — launch flow", () => {
  it("launches a session for the selected game with the default duration/warning", async () => {
    const user = userEvent.setup();
    const onLaunched = vi.fn();
    api.startSession.mockResolvedValue({ success: true, session_id: "sess-999", message: "Session launched." });

    renderForm({ onLaunched });

    await user.selectOptions(screen.getByRole("combobox"), "elden_ring");
    await waitFor(() => expect(api.validateGame).toHaveBeenCalledWith("elden_ring"));

    const launchButton = screen.getByRole("button", { name: /launch session/i });
    await waitFor(() => expect(launchButton).not.toBeDisabled());

    await user.click(launchButton);

    await waitFor(() =>
      expect(api.startSession).toHaveBeenCalledWith({
        game_id: "elden_ring",
        duration: 60,
        warning: 5,
        skip_timer: false,
        load_save_type: "latest",
        load_save_name: null,
      })
    );

    expect(onLaunched).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Launched: sess-999/i)).toBeInTheDocument();
  });

  it("does not launch when no game is selected", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /launch session/i }));

    expect(api.startSession).not.toHaveBeenCalled();
  });

  it("does not launch when the selected game fails validation", async () => {
    const user = userEvent.setup();
    api.validateGame.mockResolvedValue({ valid: false, errors: ["Executable not found."] });

    renderForm();

    await user.selectOptions(screen.getByRole("combobox"), "elden_ring");
    await waitFor(() => expect(api.validateGame).toHaveBeenCalledWith("elden_ring"));

    const launchButton = await screen.findByRole("button", { name: /launch session/i });
    await waitFor(() => expect(launchButton).not.toBeDisabled());
    await user.click(launchButton);

    expect(api.startSession).not.toHaveBeenCalled();
  });

  it("disables the launch button while the host is not ready", () => {
    renderForm({ hostStatus: { ...READY_HOST_STATUS, host_ready: false } });

    expect(screen.getByRole("button", { name: /launch session/i })).toBeDisabled();
  });
});
