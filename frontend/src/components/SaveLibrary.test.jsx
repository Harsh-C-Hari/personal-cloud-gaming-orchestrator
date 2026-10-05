/**
 * src/components/SaveLibrary.test.jsx
 *
 * Covers the Save Library at component level: user-less fetch, the
 * latest / backup / archive groups, delete (confirm -> DELETE call -> toast
 * -> resync), the absence of a delete action on latest, and the
 * loading-error-empty states.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SaveLibrary } from "./SaveLibrary.jsx";
import { ToastProvider } from "./ui/Toast.jsx";
import { ConfirmDialogProvider } from "./ui/ConfirmDialog.jsx";
import * as api from "../api/client.js";

vi.mock("../api/client.js", () => ({
  fetchSaves: vi.fn(),
  deleteSave: vi.fn(),
}));

const GAMES = {
  elden_ring: { name: "Elden Ring", exe_name: "eldenring.exe", process_name: "eldenring" },
  hades_2: { name: "Hades II", exe_name: "hades2.exe", process_name: "hades2" },
};

const BACKUP_OLD = "v_20260101_090000_000001";
const BACKUP_NEW = "v_20261003_204530_123456";
const ARCHIVE = "session_7a81c2d1_20261003_204530_123456.zip";

const FULL_SAVES = {
  user_id: "alice",
  game_id: "elden_ring",
  latest_exists: true,
  backups: [BACKUP_OLD, BACKUP_NEW],
  archives: [ARCHIVE],
};

function renderLibrary(props = {}) {
  return render(
    <ToastProvider>
      <ConfirmDialogProvider>
        <SaveLibrary games={GAMES} {...props} />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchSaves.mockResolvedValue(FULL_SAVES);
  api.deleteSave.mockResolvedValue({ success: true });
});

describe("SaveLibrary — loading and display", () => {
  it("loads the first game's saves using only the game id (no user id)", async () => {
    renderLibrary();

    expect(await screen.findByRole("heading", { name: "Backups" })).toBeInTheDocument();
    expect(api.fetchSaves).toHaveBeenCalledTimes(1);
    expect(api.fetchSaves).toHaveBeenCalledWith("elden_ring");
    expect(screen.getByRole("heading", { name: "Elden Ring saves" })).toBeInTheDocument();
  });

  it("shows latest, backups newest-first, and archives with real names preserved", async () => {
    renderLibrary();
    await screen.findByRole("heading", { name: "Backups" });

    expect(screen.getByText("Current save")).toBeInTheDocument();

    const backupItems = within(screen.getByRole("region", { name: "Backups" })).getAllByRole("listitem");
    expect(backupItems).toHaveLength(2);
    expect(within(backupItems[0]).getByText(BACKUP_NEW)).toBeInTheDocument();
    expect(within(backupItems[1]).getByText(BACKUP_OLD)).toBeInTheDocument();

    const archiveItem = within(screen.getByRole("region", { name: "Archives" })).getByRole("listitem");
    expect(within(archiveItem).getByText(ARCHIVE)).toBeInTheDocument();
    expect(within(archiveItem).getByText("session_7a81c2d1")).toBeInTheDocument();
  });

  it("offers delete for backups and archives but never for latest", async () => {
    renderLibrary();
    await screen.findByRole("heading", { name: "Backups" });

    expect(screen.getAllByRole("button", { name: /^Delete (backup|archive)/ })).toHaveLength(3);

    const latestItem = within(screen.getByRole("region", { name: "Latest" })).getByRole("listitem");
    expect(within(latestItem).queryByRole("button")).not.toBeInTheDocument();
  });

  it("fetches the other game's saves when switching games", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("heading", { name: "Backups" });

    api.fetchSaves.mockResolvedValue({ latest_exists: false, backups: [], archives: [] });
    await user.click(screen.getByRole("button", { name: /Hades II/ }));

    await waitFor(() => expect(api.fetchSaves).toHaveBeenLastCalledWith("hades_2"));
    expect(await screen.findByText("No saves for Hades II yet")).toBeInTheDocument();
  });

  it("re-fetches when refreshKey changes (a session ended)", async () => {
    const { rerender } = renderLibrary({ refreshKey: 0 });
    await screen.findByRole("heading", { name: "Backups" });
    expect(api.fetchSaves).toHaveBeenCalledTimes(1);

    rerender(
      <ToastProvider>
        <ConfirmDialogProvider>
          <SaveLibrary games={GAMES} refreshKey={1} />
        </ConfirmDialogProvider>
      </ToastProvider>
    );

    await waitFor(() => expect(api.fetchSaves).toHaveBeenCalledTimes(2));
  });
});

describe("SaveLibrary — delete", () => {
  it("confirms, calls DELETE with the real save name, toasts, and re-syncs", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("heading", { name: "Backups" });

    const backupItems = within(screen.getByRole("region", { name: "Backups" })).getAllByRole("listitem");
    await user.click(within(backupItems[0]).getByRole("button", { name: /^Delete backup/ }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(BACKUP_NEW);

    api.fetchSaves.mockResolvedValue({ ...FULL_SAVES, backups: [BACKUP_OLD] });
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(api.deleteSave).toHaveBeenCalledWith("elden_ring", "backups", BACKUP_NEW));
    expect(await screen.findByText("Backup deleted.")).toBeInTheDocument();
    await waitFor(() => expect(api.fetchSaves).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Backups" })).getAllByRole("listitem")).toHaveLength(1)
    );
  });

  it("deletes archives through the archives type", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("heading", { name: "Archives" });

    await user.click(screen.getByRole("button", { name: /^Delete archive/ }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(api.deleteSave).toHaveBeenCalledWith("elden_ring", "archives", ARCHIVE));
    expect(await screen.findByText("Archive deleted.")).toBeInTheDocument();
  });

  it("does nothing when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await screen.findByRole("heading", { name: "Archives" });

    await user.click(screen.getByRole("button", { name: /^Delete archive/ }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }));

    expect(api.deleteSave).not.toHaveBeenCalled();
    expect(api.fetchSaves).toHaveBeenCalledTimes(1);
  });

  it("shows the backend error in a toast and still re-syncs when delete fails", async () => {
    const user = userEvent.setup();
    api.deleteSave.mockRejectedValue(new Error("Archive not found: gone.zip"));
    renderLibrary();
    await screen.findByRole("heading", { name: "Archives" });

    await user.click(screen.getByRole("button", { name: /^Delete archive/ }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Archive not found: gone.zip")).toBeInTheDocument();
    await waitFor(() => expect(api.fetchSaves).toHaveBeenCalledTimes(2));
  });
});

describe("SaveLibrary — states", () => {
  it("shows an empty state when the game has no saves at all", async () => {
    api.fetchSaves.mockResolvedValue({ latest_exists: false, backups: [], archives: [] });
    renderLibrary();

    expect(await screen.findByText("No saves for Elden Ring yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Backups" })).not.toBeInTheDocument();
  });

  it("shows inline empty notes for groups that are empty while others are not", async () => {
    api.fetchSaves.mockResolvedValue({ latest_exists: true, backups: [], archives: [] });
    renderLibrary();

    expect(await screen.findByText("No backups for this game yet.")).toBeInTheDocument();
    expect(screen.getByText("No archives for this game yet.")).toBeInTheDocument();
  });

  it("shows a loading state first", async () => {
    api.fetchSaves.mockReturnValue(new Promise(() => {}));
    renderLibrary();

    expect(await screen.findByText("Loading saves…")).toBeInTheDocument();
  });

  it("shows an error with a retry that recovers", async () => {
    const user = userEvent.setup();
    api.fetchSaves.mockRejectedValueOnce(new Error("Unknown game_id: elden_ring"));
    renderLibrary();

    expect(await screen.findByRole("alert")).toHaveTextContent("Unknown game_id: elden_ring");

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Backups" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no games", () => {
    renderLibrary({ games: {} });

    expect(screen.getByText("No games available")).toBeInTheDocument();
    expect(api.fetchSaves).not.toHaveBeenCalled();
  });

  it("shows a loading state while games are loading", () => {
    renderLibrary({ games: {}, gamesLoading: true });

    expect(screen.getByText("Loading games…")).toBeInTheDocument();
    expect(screen.queryByText("No games available")).not.toBeInTheDocument();
  });
});
