/**
 * components/GameManager.jsx
 *
 * Same API calls / validation / business logic as before (addGame,
 * updateGame, deleteGame, validateGameConfig, selectFile, selectFolder) —
 * only the UI was redesigned to match the visual language already used by
 * StartSessionForm / RecoveryStats / RecoveryEvents / HostStatusPanel:
 *   - Card-shell header (icon badge + title + live count) instead of a
 *     bare toolbar row.
 *   - Game selector grid with icon-labeled meta rows instead of plain text.
 *   - The add/edit form is broken into labeled `cardSection` groups
 *     (Basic Info / Paths / Save Filters) using the same FieldLabel +
 *     focus-ring input pattern as StartSessionForm.
 *   - Status messaging now uses toast.success/toast.error for action
 *     results (save/delete/browse), matching the rest of the app and the
 *     validation warnings below. The old `successMessage`/`error` state
 *     boxes were removed: `closeForm()` -> `clearMessages()` ran in the
 *     same tick as `setSuccessMessage(...)` on add/update, so that box
 *     never actually rendered. The in-form "Game configuration is valid"
 *     validation report (from the VALIDATE button) stays inline, since
 *     it's a persistent check result the user may want to keep reading
 *     while still editing, not a one-off action outcome.
 *
 * No other functional change: every handler, state variable, validation
 * rule, and API call below is untouched from the previous implementation.
 */

import { useState } from "react";
import {
  FolderOpen,
  FileInput,
  Plus,
  RefreshCw,
  Trash2,
  ChevronLeft,
  Gamepad2,
  Hash,
  Cpu,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Save,
  X,
} from "lucide-react";
import {
  addGame,
  updateGame,
  deleteGame,
  validateGameConfig,
  selectFile,
  selectFolder,
} from "../api/client.js";
import { useToast } from "./ui/Toast.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { colors, fonts, radius } from "../dashboard/theme.js";

const DEFAULT_GAME = {
  id: "",
  name: "",
  exe_name: "",
  exe_path: "",
  save_path: "",
  process_name: "",
  save_filters: {
    mode: "or",
    prefix: [],
    contains: [],
    suffix: [],
  },
};

export function GameManager({ games, gamesLoading = false, refreshGames }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(null); // holds the gameId currently being deleted
  const [reloading, setReloading] = useState(false);
  const [originalGame, setOriginalGame] = useState(null);
  const [gameForm, setGameForm] = useState(DEFAULT_GAME);

  const entries = Object.entries(games || {});

  function clearMessages() {
    setValidation(null);
  }

  function setField(key, value) {
    clearMessages();
    setGameForm({ ...gameForm, [key]: value });
  }

  function updateSaveFilters(key, value) {
    clearMessages();
    setGameForm({
      ...gameForm,
      save_filters: { ...gameForm.save_filters, [key]: value },
    });
  }

  function openGameCard(gameId) {
    clearMessages();
    const selectedGame = { id: gameId, ...games[gameId] };
    setEditingGame(gameId);
    setOriginalGame(JSON.parse(JSON.stringify(selectedGame)));
    setGameForm(selectedGame);
    setShowForm(true);
  }

  function openAddForm() {
    clearMessages();
    setEditingGame(null);
    setOriginalGame(null);
    setGameForm(DEFAULT_GAME);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingGame(null);
    setOriginalGame(null);
    clearMessages();
  }

  async function handleReloadGames() {
    if (reloading) return;
    setReloading(true);
    try {
      await refreshGames();
    } catch (err) {
      toast.error(err.message || "Failed to reload games");
    } finally {
      setReloading(false);
    }
  }

  async function handleSaveGame() {
    if (saving) return;
    setSaving(true);
    try {
      const request = {
        name: gameForm.name,
        exe_name: gameForm.exe_name,
        exe_path: gameForm.exe_path,
        save_path: gameForm.save_path,
        process_name: gameForm.process_name,
        save_filters: gameForm.save_filters,
      };

      if (!gameForm.id.trim()) {
        toast.warning("Game ID required");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(gameForm.id)) {
        toast.warning("Game ID must contain only lowercase letters, numbers, and underscores.");
        return;
      }
      if (!gameForm.name.trim()) {
        toast.warning("Game name required");
        return;
      }
      if (!gameForm.exe_path.trim()) {
        toast.warning("Executable path required");
        return;
      }
      if (!gameForm.save_path.trim()) {
        toast.warning("Save path required");
        return;
      }
      if (!gameForm.process_name.trim()) {
        toast.warning("Process name required");
        return;
      }

      const validationResult = await validateGameConfig({
        exe_path: request.exe_path,
        save_path: request.save_path,
        process_name: request.process_name,
      });

      setValidation(validationResult);

      if (!validationResult.valid) {
        return;
      }

      if (editingGame) {
        await updateGame(editingGame, request);
        toast.success("Game updated successfully.");
      } else {
        await addGame({ id: gameForm.id, ...request });
        toast.success("Game added successfully.");
      }

      await refreshGames();
      closeForm();
    } catch (err) {
      toast.error(err.message || "Failed to save game");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGameId(gameId) {
    if (deleting) return;

    const label = games?.[gameId]?.name || gameId;
    if (!(await confirm(`Delete game "${label}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" }))) {
      return;
    }

    setDeleting(gameId);
    try {
      await deleteGame(gameId);
      toast.success("Game deleted successfully.");
      await refreshGames();

      if (editingGame === gameId) {
        closeForm();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete game");
    } finally {
      setDeleting(null);
    }
  }

  async function handleValidate() {
    setValidating(true);
    setValidation(null);
    try {
      const result = await validateGameConfig({
        exe_path: gameForm.exe_path,
        save_path: gameForm.save_path,
        process_name: gameForm.process_name,
      });
      setValidation(result);
    } catch (error) {
      setValidation({ valid: false, errors: [error.message || "Validation failed"] });
    } finally {
      setValidating(false);
    }
  }

  async function handleSelectExe() {
    try {
      const result = await selectFile();
      if (!result.selected) return;
      clearMessages();
      setGameForm({
        ...gameForm,
        exe_path: result.path,
        exe_name: result.name,
        process_name: result.name,
      });
    } catch (err) {
      toast.error(err.message || "Failed to select executable");
    }
  }

  async function handleSelectSaveFolder() {
    try {
      const result = await selectFolder();
      if (!result.selected) return;
      clearMessages();
      setGameForm({ ...gameForm, save_path: result.path });
    } catch (err) {
      toast.error(err.message || "Failed to select save folder");
    }
  }

  const hasChanges = !editingGame || JSON.stringify(gameForm) !== JSON.stringify(originalGame);
  const deletingCurrent = editingGame !== null && deleting === editingGame;

  // ── Shared style primitives (matches StartSessionForm / RecoveryStats) ──

  function FieldLabel({ icon, children }) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "9.5px",
          color: colors.inkFaint,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {icon}
        {children}
      </span>
    );
  }

  function SectionHeading({ icon, children }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "10px",
          color: colors.inkFaint,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: "12px",
        }}
      >
        {icon}
        {children}
      </div>
    );
  }

  const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
  };
  const blurBorder = (e) => {
    e.target.style.borderColor = colors.border;
  };

  return (
    <div className="pcgo-game-manager-config-panel" style={outerWrap}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={headerBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={headerIconBadge}>
            <Gamepad2 size={15} strokeWidth={2} />
          </div>
          <div>
            <div style={headerTitle}>Configuration Manager</div>
            <div style={headerSubtitle}>
              {entries.length} configured launch target{entries.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            title="Add game"
            aria-label="Add game"
            style={iconAddButton}
            onClick={openAddForm}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(110,231,176,0.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.accentGreenDim)}
          >
            <Plus size={13} strokeWidth={2} />
          </button>

          <button
            title="Reload games"
            aria-label="Reload games"
            disabled={reloading}
            style={{ ...iconGhostButton, opacity: reloading ? 0.5 : 1 }}
            onClick={handleReloadGames}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,235,227,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <RefreshCw size={13} strokeWidth={2} style={reloading ? { animation: "gm-spin 0.8s linear infinite" } : undefined} />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{ padding: "20px" }}>
        {/* Game selector grid (shown by default) */}
        {!showForm &&
          (gamesLoading ? (
            <div className="pcgo-game-manager-config-loading" role="status" aria-live="polite">
              <span className="pcgo-game-manager-config-loading__dot" />
              Loading configured launch targets…
            </div>
          ) : entries.length === 0 ? (
            <div style={emptyBox}>
              <Gamepad2 size={24} strokeWidth={1.5} style={{ color: colors.inkFaint, opacity: 0.7 }} />
              <div style={{ fontSize: "11px", color: colors.inkDim, fontFamily: fonts.mono }}>
                No configured launch targets
              </div>
              <div style={{ fontSize: "10px", color: colors.inkFaint, fontFamily: fonts.mono }}>
                Use <strong style={{ color: colors.success }}>+</strong> to add a target to the launch console.
              </div>
            </div>
          ) : (
            <div style={grid}>
              {entries.map(([gameId, game]) => (
                <div
                  key={gameId}
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit launch target ${game.name || gameId}`}
                  onClick={() => openGameCard(gameId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openGameCard(gameId);
                    }
                  }}
                  style={card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.borderStrong;
                    e.currentTarget.style.background = colors.bgCardHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.background = colors.bgCard;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={cardHeader}>
                    <div style={cardTitle}>{game.name || gameId}</div>
                    <button
                      title={`Delete ${game.name || gameId}`}
                      aria-label={`Delete ${game.name || gameId}`}
                      disabled={deleting === gameId}
                      style={{ ...cardDeleteButton, opacity: deleting === gameId ? 0.5 : 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGameId(gameId);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {deleting === gameId ? (
                        <RefreshCw size={11} strokeWidth={2} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                      ) : (
                        <Trash2 size={12} strokeWidth={2} />
                      )}
                    </button>
                  </div>

                  <div style={cardMeta}>
                    <Hash size={10} strokeWidth={2} style={{ opacity: 0.7 }} /> ID: {gameId}
                  </div>
                  <div style={cardMeta}>
                    <FileInput size={10} strokeWidth={2} style={{ opacity: 0.7 }} /> EXE: {game.exe_name || "unknown"}
                  </div>
                  <div style={cardMeta}>
                    <Cpu size={10} strokeWidth={2} style={{ opacity: 0.7 }} /> PROCESS: {game.process_name || "unknown"}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* ── Add / Edit form ───────────────────────────────────── */}
        {showForm && (
          <div>
            <button
              style={backButton}
              onClick={closeForm}
              onMouseEnter={(e) => (e.currentTarget.style.color = colors.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkDim)}
            >
              <ChevronLeft size={11} strokeWidth={2} /> Back to games
            </button>

            <h3 style={formHeading}>{editingGame ? "Edit Game" : "Add New Game"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Basic Info */}
              <div style={cardSection}>
                <SectionHeading icon={<Gamepad2 size={11} strokeWidth={2} />}>Basic Info</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel icon={<Hash size={10} strokeWidth={2} />}>Game ID</FieldLabel>
                    <input
                      style={{ ...inputStyle, opacity: editingGame ? 0.6 : 1 }}
                      placeholder="e.g. god_of_war_ragnarok"
                      value={gameForm.id}
                      disabled={editingGame !== null}
                      onChange={(e) => setField("id", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={<Gamepad2 size={10} strokeWidth={2} />}>Game Name</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="God of War Ragnarök"
                      value={gameForm.name}
                      onChange={(e) => setField("name", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={<FileInput size={10} strokeWidth={2} />}>Executable Name</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="GoWR.exe"
                      value={gameForm.exe_name}
                      onChange={(e) => setField("exe_name", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                </div>
              </div>

              {/* Paths */}
              <div style={cardSection}>
                <SectionHeading icon={<FolderOpen size={11} strokeWidth={2} />}>Paths</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel icon={<FileInput size={10} strokeWidth={2} />}>Executable Path</FieldLabel>
                    <div style={pathRow}>
                      <input
                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                        placeholder="Executable Path"
                        value={gameForm.exe_path}
                        onChange={(e) => setField("exe_path", e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <button
                        style={{
                          ...pickerButton,
                          opacity: saving || validating || deletingCurrent ? 0.5 : 1,
                        }}
                        disabled={saving || validating || deletingCurrent}
                        title="Select executable"
                        aria-label="Select executable"
                        onClick={handleSelectExe}
                        onMouseEnter={(e) => {
                          if (!saving && !validating && !deletingCurrent)
                            e.currentTarget.style.background = "rgba(237,235,227,0.08)";
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <FileInput size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel icon={<FolderOpen size={10} strokeWidth={2} />}>Save Path</FieldLabel>
                    <div style={pathRow}>
                      <input
                        style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                        placeholder="Save Path"
                        value={gameForm.save_path}
                        onChange={(e) => setField("save_path", e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <button
                        style={{
                          ...pickerButton,
                          opacity: saving || validating || deletingCurrent ? 0.5 : 1,
                        }}
                        disabled={saving || validating || deletingCurrent}
                        title="Select save folder"
                        aria-label="Select save folder"
                        onClick={handleSelectSaveFolder}
                        onMouseEnter={(e) => {
                          if (!saving && !validating && !deletingCurrent)
                            e.currentTarget.style.background = "rgba(237,235,227,0.08)";
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <FolderOpen size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel icon={<Cpu size={10} strokeWidth={2} />}>Process Name</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="Process Name"
                      value={gameForm.process_name}
                      onChange={(e) => setField("process_name", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                </div>
              </div>

              {/* Save Filters */}
              <div style={cardSection}>
                <SectionHeading icon={<SlidersHorizontal size={11} strokeWidth={2} />}>Save Filters</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel>Match Mode</FieldLabel>
                    <select
                      style={inputStyle}
                      value={gameForm.save_filters.mode}
                      onChange={(e) => updateSaveFilters("mode", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    >
                      <option value="or">OR - Match any filter</option>
                      <option value="and">AND - Match all filters</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel>Prefix Filters</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="Prefix filters (comma separated)"
                      value={gameForm.save_filters.prefix.join(",")}
                      onChange={(e) =>
                        updateSaveFilters(
                          "prefix",
                          e.target.value.split(",").map((v) => v.trim()).filter(Boolean)
                        )
                      }
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel>Contains Filters</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="Contains filters (comma separated)"
                      value={gameForm.save_filters.contains.join(",")}
                      onChange={(e) =>
                        updateSaveFilters(
                          "contains",
                          e.target.value.split(",").map((v) => v.trim()).filter(Boolean)
                        )
                      }
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel>Suffix Filters</FieldLabel>
                    <input
                      style={inputStyle}
                      placeholder="Suffix filters (.sav,.dat)"
                      value={gameForm.save_filters.suffix.join(",")}
                      onChange={(e) =>
                        updateSaveFilters(
                          "suffix",
                          e.target.value.split(",").map((v) => v.trim()).filter(Boolean)
                        )
                      }
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={formActions}>
                <button
                  style={{
                    ...validateButton,
                    opacity: validating || saving || deletingCurrent || !hasChanges ? 0.5 : 1,
                    cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                  }}
                  disabled={validating || saving || deletingCurrent || !hasChanges}
                  onClick={handleValidate}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,235,227,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {validating ? (
                    <RefreshCw size={12} strokeWidth={2} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                  ) : (
                    <CheckCircle2 size={12} strokeWidth={2} />
                  )}
                  {validating ? "CHECKING..." : "VALIDATE"}
                </button>

                <button
                  style={{
                    ...saveButton,
                    opacity: saving || (editingGame && !hasChanges) ? 0.5 : 1,
                    cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                  }}
                  disabled={saving || (editingGame && !hasChanges)}
                  onClick={handleSaveGame}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  {saving ? (
                    <RefreshCw size={12} strokeWidth={2} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                  ) : (
                    <Save size={12} strokeWidth={2} />
                  )}
                  {saving ? "SAVING..." : editingGame ? "SAVE CHANGES" : "ADD GAME"}
                </button>

                {editingGame && (
                  <button
                    style={{ ...deleteFormButton, opacity: deletingCurrent ? 0.5 : 1 }}
                    disabled={deletingCurrent}
                    onClick={() => handleDeleteGameId(editingGame)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.08)")}
                  >
                    <Trash2 size={12} strokeWidth={2} />
                    {deletingCurrent ? "DELETING..." : "DELETE"}
                  </button>
                )}

                <button
                  style={cancelButton}
                  onClick={closeForm}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,235,227,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <X size={12} strokeWidth={2} />
                  CANCEL
                </button>

                {validation && (
                  <div role={validation.valid ? "status" : "alert"} style={validation.valid ? validationOk : validationBad}>
                    {validation.valid ? <CheckCircle2 size={12} strokeWidth={2} /> : <XCircle size={12} strokeWidth={2} />}
                    {validation.valid ? "Game configuration is valid." : validation.errors.join(" ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes gm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Style primitives ───────────────────────────────────────────────────
// Plain objects/functions built from `dashboard/theme.js` tokens — same
// convention used by StartSessionForm.

const outerWrap = {
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
  background: colors.bgCard,
  overflow: "hidden",
};

const headerBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  rowGap: "8px",
  gap: "10px",
  padding: "16px 20px",
  borderBottom: `1px solid ${colors.border}`,
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
  fontSize: "14.5px",
  fontWeight: 700,
  color: colors.ink,
  fontFamily: fonts.display,
};

const headerSubtitle = {
  fontSize: "10px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
  marginTop: "1px",
  letterSpacing: "0.04em",
};

const iconAddButton = {
  width: "30px",
  height: "30px",
  borderRadius: `${radius.sm}px`,
  background: colors.accentGreenDim,
  border: `1.5px solid ${colors.success}`,
  color: colors.success,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 150ms ease",
};

const iconGhostButton = {
  width: "30px",
  height: "30px",
  borderRadius: `${radius.sm}px`,
  background: "transparent",
  border: `1.5px solid ${colors.border}`,
  color: colors.inkDim,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 150ms ease",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "14px",
};

const card = {
  position: "relative",
  textAlign: "left",
  padding: "18px",
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.md}px`,
  color: colors.ink,
  cursor: "pointer",
  overflow: "hidden",
  transition: "border-color 150ms ease, background 150ms ease, transform 150ms ease",
};

const cardHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap",
  rowGap: "6px",
  gap: "8px",
};

const cardTitle = {
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "10px",
  color: colors.ink,
  fontFamily: fonts.display,
};

const cardMeta = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: fonts.mono,
  fontSize: "10px",
  color: colors.inkFaint,
  marginTop: "5px",
};

const cardDeleteButton = {
  width: "24px",
  height: "24px",
  flexShrink: 0,
  borderRadius: `${radius.sm}px`,
  background: "transparent",
  border: `1.5px solid ${colors.danger}66`,
  color: colors.danger,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 150ms ease",
};

const backButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  border: "none",
  color: colors.inkDim,
  fontSize: "10px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  padding: 0,
  marginBottom: "10px",
  transition: "color 150ms ease",
};

const formHeading = {
  margin: "0 0 16px",
  fontSize: "15px",
  fontWeight: 700,
  color: colors.ink,
  fontFamily: fonts.display,
};

const cardSection = {
  padding: "18px",
  borderRadius: `${radius.md}px`,
  border: `1px solid ${colors.borderSubtle}`,
  background: colors.bgElevated,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
  borderRadius: `${radius.sm}px`,
  color: colors.ink,
  fontSize: "13px",
  fontFamily: fonts.body,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 150ms ease",
};

const pathRow = {
  display: "flex",
  gap: "6px",
};

const pickerButton = {
  width: "40px",
  flexShrink: 0,
  borderRadius: `${radius.md}px`,
  border: `1.5px solid ${colors.borderInk}`,
  background: "transparent",
  color: colors.ink,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 150ms ease",
};

const formActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "4px",
};

const buttonBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  flex: 1,
  minWidth: "120px",
  padding: "10px",
  borderRadius: `${radius.sm}px`,
  fontFamily: fonts.mono,
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  transition: "background 150ms ease, filter 150ms ease",
};

const validateButton = {
  ...buttonBase,
  border: `1.5px solid ${colors.borderInk}`,
  color: colors.ink,
  background: "transparent",
  cursor: "pointer",
};

const saveButton = {
  ...buttonBase,
  border: "1.5px solid transparent",
  color: colors.bg,
  background: colors.ink,
  cursor: "pointer",
};

const cancelButton = {
  ...buttonBase,
  border: "1.5px solid transparent",
  color: colors.inkDim,
  background: "transparent",
  cursor: "pointer",
};

const deleteFormButton = {
  ...buttonBase,
  border: `1.5px solid ${colors.danger}`,
  color: colors.danger,
  background: "rgba(255,107,107,0.08)",
  cursor: "pointer",
};

const messageBoxBase = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: `${radius.sm}px`,
  fontSize: "11px",
  fontFamily: fonts.mono,
  width: "100%",
};

const validationOk = {
  ...messageBoxBase,
  color: colors.success,
  border: `1.5px solid ${colors.success}`,
  background: colors.accentGreenDim,
};

const validationBad = {
  ...messageBoxBase,
  color: colors.danger,
  border: `1.5px solid ${colors.danger}`,
  background: "rgba(255,107,107,0.1)",
};

const emptyBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "48px 24px",
  border: `1.5px dashed ${colors.border}`,
  borderRadius: `${radius.md}px`,
  textAlign: "center",
};
