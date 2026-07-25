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
 *   - Status messaging (validation / success / error) now uses the same
 *     icon + colored-mono-text treatment as the rest of the app.
 *
 * No functional change: every handler, state variable, validation rule,
 * and API call below is untouched from the previous implementation.
 */

import { useState } from "react";
import {
  FaFolderOpen,
  FaFileImport,
  FaPlus,
  FaSyncAlt,
  FaTrashAlt,
  FaChevronLeft,
  FaGamepad,
  FaHashtag,
  FaMicrochip,
  FaSlidersH,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import {
  addGame,
  updateGame,
  deleteGame,
  validateGameConfig,
  selectFile,
  selectFolder,
} from "../api/client.js";

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

export function GameManager({ games, refreshGames }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(null); // holds the gameId currently being deleted
  const [successMessage, setSuccessMessage] = useState("");
  const [reloading, setReloading] = useState(false);
  const [originalGame, setOriginalGame] = useState(null);
  const [error, setError] = useState("");
  const [gameForm, setGameForm] = useState(DEFAULT_GAME);

  const entries = Object.entries(games || {});

  function clearMessages() {
    setValidation(null);
    setSuccessMessage("");
    setError("");
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
      alert(err.message || "Failed to reload games");
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
        alert("Game ID required");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(gameForm.id)) {
        alert("Game ID must contain only lowercase letters, numbers, and underscores.");
        return;
      }
      if (!gameForm.name.trim()) {
        alert("Game name required");
        return;
      }
      if (!gameForm.exe_path.trim()) {
        alert("Executable path required");
        return;
      }
      if (!gameForm.save_path.trim()) {
        alert("Save path required");
        return;
      }
      if (!gameForm.process_name.trim()) {
        alert("Process name required");
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
        setSuccessMessage("✓ Game updated successfully.");
      } else {
        await addGame({ id: gameForm.id, ...request });
        setSuccessMessage("✓ Game added successfully.");
      }

      await refreshGames();
      closeForm();
    } catch (err) {
      alert(err.message || "Failed to save game");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGameId(gameId) {
    if (deleting) return;

    const label = games?.[gameId]?.name || gameId;
    if (!window.confirm(`Delete game "${label}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(gameId);
    try {
      await deleteGame(gameId);
      setSuccessMessage("✓ Game deleted successfully.");
      await refreshGames();

      if (editingGame === gameId) {
        closeForm();
      }
    } catch (err) {
      alert(err.message || "Failed to delete game");
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
      setError(err.message || "Failed to select executable");
    }
  }

  async function handleSelectSaveFolder() {
    try {
      const result = await selectFolder();
      if (!result.selected) return;
      clearMessages();
      setGameForm({ ...gameForm, save_path: result.path });
    } catch (err) {
      setError(err.message || "Failed to select save folder");
    }
  }

  const hasChanges = !editingGame || JSON.stringify(gameForm) !== JSON.stringify(originalGame);
  const deletingCurrent = deleting === editingGame;

  // ── Shared style primitives (matches StartSessionForm / RecoveryStats) ──

  const palette = {
    bg: "#000000",
    card: "rgba(0, 0, 0, 0.65)",
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
  };

  function FieldLabel({ icon, children }) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "9.5px",
          color: palette.muted,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontFamily: palette.mono,
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
          color: palette.faint,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: palette.mono,
          marginBottom: "12px",
        }}
      >
        {icon}
        {children}
      </div>
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

  return (
    <div style={outerWrap(palette)}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={headerBar(palette)}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={headerIconBadge(palette)}>
            <FaGamepad size={13} />
          </div>
          <div>
            <div style={headerTitle(palette)}>Game Library</div>
            <div style={headerSubtitle(palette)}>
              {entries.length} game{entries.length === 1 ? "" : "s"} configured
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            title="Add game"
            aria-label="Add game"
            style={iconAddButton(palette)}
            onClick={openAddForm}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,217,138,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(16,217,138,0.1)")}
          >
            <FaPlus size={12} />
          </button>

          <button
            title="Reload games"
            aria-label="Reload games"
            disabled={reloading}
            style={{ ...iconGhostButton(palette), opacity: reloading ? 0.5 : 1 }}
            onClick={handleReloadGames}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FaSyncAlt size={12} style={reloading ? { animation: "gm-spin 0.8s linear infinite" } : undefined} />
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div style={{ padding: "20px" }}>
        {/* Game selector grid (shown by default) */}
        {!showForm &&
          (entries.length === 0 ? (
            <div style={emptyBox(palette)}>
              <FaGamepad size={22} style={{ color: palette.muted, opacity: 0.6 }} />
              <div style={{ fontSize: "11px", color: palette.dim, fontFamily: palette.mono }}>
                No games configured yet
              </div>
              <div style={{ fontSize: "10px", color: palette.faint, fontFamily: palette.mono }}>
                Click <strong style={{ color: palette.success }}>+</strong> to add your first game
              </div>
            </div>
          ) : (
            <div style={grid}>
              {entries.map(([gameId, game]) => (
                <div
                  key={gameId}
                  role="button"
                  tabIndex={0}
                  onClick={() => openGameCard(gameId)}
                  onKeyDown={(e) => e.key === "Enter" && openGameCard(gameId)}
                  style={card(palette)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)";
                    e.currentTarget.style.background = "rgba(56,189,248,0.05)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = palette.border;
                    e.currentTarget.style.background = palette.bg;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={cardTopAccent} />

                  <div style={cardHeader}>
                    <div style={cardTitle(palette)}>{game.name || gameId}</div>
                    <button
                      title={`Delete ${game.name || gameId}`}
                      aria-label={`Delete ${game.name || gameId}`}
                      disabled={deleting === gameId}
                      style={{ ...cardDeleteButton(palette), opacity: deleting === gameId ? 0.5 : 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGameId(gameId);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {deleting === gameId ? (
                        <FaSyncAlt size={10} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                      ) : (
                        <FaTrashAlt size={11} />
                      )}
                    </button>
                  </div>

                  <div style={cardMeta(palette)}>
                    <FaHashtag size={9} style={{ opacity: 0.7 }} /> {gameId}
                  </div>
                  <div style={cardMeta(palette)}>
                    <FaFileImport size={9} style={{ opacity: 0.7 }} /> {game.exe_name || "unknown"}
                  </div>
                  <div style={cardMeta(palette)}>
                    <FaMicrochip size={9} style={{ opacity: 0.7 }} /> {game.process_name || "unknown"}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {successMessage && !showForm && (
          <div style={successBox(palette)}>
            <FaCheckCircle size={11} /> {successMessage.replace(/^✓\s*/, "")}
          </div>
        )}

        {/* ── Add / Edit form ───────────────────────────────────── */}
        {showForm && (
          <div>
            <button
              style={backButton(palette)}
              onClick={closeForm}
              onMouseEnter={(e) => (e.currentTarget.style.color = palette.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.color = palette.dim)}
            >
              <FaChevronLeft size={10} /> Back to games
            </button>

            <h3 style={formHeading(palette)}>{editingGame ? "Edit Game" : "Add New Game"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Basic Info */}
              <div style={cardSection(palette)}>
                <SectionHeading icon={<FaGamepad size={10} />}>Basic Info</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel icon={<FaHashtag size={9} />}>Game ID</FieldLabel>
                    <input
                      style={{ ...inputStyle(palette), opacity: editingGame ? 0.6 : 1 }}
                      placeholder="e.g. god_of_war_ragnarok"
                      value={gameForm.id}
                      disabled={editingGame !== null}
                      onChange={(e) => setField("id", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={<FaGamepad size={9} />}>Game Name</FieldLabel>
                    <input
                      style={inputStyle(palette)}
                      placeholder="God of War Ragnarök"
                      value={gameForm.name}
                      onChange={(e) => setField("name", e.target.value)}
                      onFocus={focusBorder}
                      onBlur={blurBorder}
                    />
                  </div>

                  <div>
                    <FieldLabel icon={<FaFileImport size={9} />}>Executable Name</FieldLabel>
                    <input
                      style={inputStyle(palette)}
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
              <div style={cardSection(palette)}>
                <SectionHeading icon={<FaFolderOpen size={10} />}>Paths</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel icon={<FaFileImport size={9} />}>Executable Path</FieldLabel>
                    <div style={pathRow}>
                      <input
                        style={{ ...inputStyle(palette), flex: 1 }}
                        placeholder="Executable Path"
                        value={gameForm.exe_path}
                        onChange={(e) => setField("exe_path", e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <button
                        style={{
                          ...pickerButton(palette),
                          opacity: saving || validating || deletingCurrent ? 0.5 : 1,
                        }}
                        disabled={saving || validating || deletingCurrent}
                        title="Select executable"
                        onClick={handleSelectExe}
                        onMouseEnter={(e) => {
                          if (!saving && !validating && !deletingCurrent)
                            e.currentTarget.style.background = "rgba(56,189,248,0.15)";
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <FaFileImport size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel icon={<FaFolderOpen size={9} />}>Save Path</FieldLabel>
                    <div style={pathRow}>
                      <input
                        style={{ ...inputStyle(palette), flex: 1 }}
                        placeholder="Save Path"
                        value={gameForm.save_path}
                        onChange={(e) => setField("save_path", e.target.value)}
                        onFocus={focusBorder}
                        onBlur={blurBorder}
                      />
                      <button
                        style={{
                          ...pickerButton(palette),
                          opacity: saving || validating || deletingCurrent ? 0.5 : 1,
                        }}
                        disabled={saving || validating || deletingCurrent}
                        title="Select save folder"
                        onClick={handleSelectSaveFolder}
                        onMouseEnter={(e) => {
                          if (!saving && !validating && !deletingCurrent)
                            e.currentTarget.style.background = "rgba(56,189,248,0.15)";
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <FaFolderOpen size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <FieldLabel icon={<FaMicrochip size={9} />}>Process Name</FieldLabel>
                    <input
                      style={inputStyle(palette)}
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
              <div style={cardSection(palette)}>
                <SectionHeading icon={<FaSlidersH size={10} />}>Save Filters</SectionHeading>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <FieldLabel>Match Mode</FieldLabel>
                    <select
                      style={inputStyle(palette)}
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
                      style={inputStyle(palette)}
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
                      style={inputStyle(palette)}
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
                      style={inputStyle(palette)}
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
                    ...validateButton(palette),
                    opacity: validating || saving || deletingCurrent || !hasChanges ? 0.5 : 1,
                    cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                  }}
                  disabled={validating || saving || deletingCurrent || !hasChanges}
                  onClick={handleValidate}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0)")}
                >
                  {validating ? (
                    <FaSyncAlt size={11} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                  ) : (
                    <FaCheckCircle size={11} />
                  )}
                  {validating ? "CHECKING..." : "VALIDATE"}
                </button>

                <button
                  style={{
                    ...saveButton(palette),
                    opacity: saving || (editingGame && !hasChanges) ? 0.5 : 1,
                    cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                  }}
                  disabled={saving || (editingGame && !hasChanges)}
                  onClick={handleSaveGame}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.08)")}
                >
                  {saving ? (
                    <FaSyncAlt size={11} style={{ animation: "gm-spin 0.8s linear infinite" }} />
                  ) : (
                    <FaSave size={11} />
                  )}
                  {saving ? "SAVING..." : editingGame ? "SAVE CHANGES" : "ADD GAME"}
                </button>

                {editingGame && (
                  <button
                    style={{ ...deleteFormButton(palette), opacity: deletingCurrent ? 0.5 : 1 }}
                    disabled={deletingCurrent}
                    onClick={() => handleDeleteGameId(editingGame)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  >
                    <FaTrashAlt size={11} />
                    {deletingCurrent ? "DELETING..." : "DELETE"}
                  </button>
                )}

                <button
                  style={cancelButton(palette)}
                  onClick={closeForm}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148,163,184,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FaTimes size={11} />
                  CANCEL
                </button>

                {validation && (
                  <div style={validation.valid ? validationOk(palette) : validationBad(palette)}>
                    {validation.valid ? <FaCheckCircle size={11} /> : <FaTimesCircle size={11} />}
                    {validation.valid ? "Game configuration is valid." : validation.errors.join(" ")}
                  </div>
                )}

                {successMessage && (
                  <div style={successBox(palette)}>
                    <FaCheckCircle size={11} /> {successMessage.replace(/^✓\s*/, "")}
                  </div>
                )}

                {error && (
                  <div style={errorBox(palette)}>
                    <FaExclamationTriangle size={11} /> {error}
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
// Kept as functions of `palette` so every value traces back to the single
// palette object above — same convention used by StartSessionForm.

const outerWrap = (p) => ({
  border: `1px solid ${p.border}`,
  borderRadius: "12px",
  background: "rgba(0, 0, 0, 0.5)",
  overflow: "hidden",
});

const headerBar = (p) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "16px 20px",
  borderBottom: `1px solid ${p.border}`,
  background: "rgba(0, 0, 0, 0.64)",
});

const headerIconBadge = (p) => ({
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(56,189,248,0.12)",
  border: "1px solid rgba(56,189,248,0.3)",
  color: p.accent,
  fontSize: "13px",
  flexShrink: 0,
});

const headerTitle = (p) => ({
  fontSize: "13.5px",
  fontWeight: 700,
  color: p.text,
  fontFamily: "'Rajdhani', sans-serif",
  letterSpacing: "0.02em",
});

const headerSubtitle = (p) => ({
  fontSize: "10px",
  color: p.faint,
  fontFamily: p.mono,
  marginTop: "1px",
  letterSpacing: "0.04em",
});

const iconAddButton = (p) => ({
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  background: "rgba(16,217,138,0.1)",
  border: `1px solid ${p.success}`,
  color: p.success,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
});

const iconGhostButton = (p) => ({
  width: "30px",
  height: "30px",
  borderRadius: "6px",
  background: "transparent",
  border: `1px solid ${p.border}`,
  color: p.accent,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
});

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "14px",
};

const card = (p) => ({
  position: "relative",
  textAlign: "left",
  padding: "16px",
  background: p.bg,
  border: `1px solid ${p.border}`,
  borderRadius: "10px",
  color: p.text,
  cursor: "pointer",
  overflow: "hidden",
  transition: "border-color 0.15s, background 0.15s, transform 0.15s",
});

const cardTopAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "2px",
  background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
  opacity: 0.8,
};

const cardHeader = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px",
};

const cardTitle = (p) => ({
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "10px",
  color: p.text,
  fontFamily: "'Rajdhani', sans-serif",
});

const cardMeta = (p) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: p.mono,
  fontSize: "10px",
  color: p.faint,
  marginTop: "5px",
});

const cardDeleteButton = (p) => ({
  width: "24px",
  height: "24px",
  flexShrink: 0,
  borderRadius: "5px",
  background: "transparent",
  border: "1px solid rgba(239,68,68,0.4)",
  color: p.danger,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.15s",
});

const backButton = (p) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  border: "none",
  color: p.dim,
  fontSize: "10px",
  fontFamily: p.mono,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  padding: 0,
  marginBottom: "10px",
  transition: "color 0.15s",
});

const formHeading = (p) => ({
  margin: "0 0 16px",
  fontSize: "15px",
  fontWeight: 700,
  color: p.text,
  fontFamily: "'Rajdhani', sans-serif",
  letterSpacing: "0.02em",
});

const cardSection = (p) => ({
  padding: "16px",
  borderRadius: "10px",
  border: `1px solid ${p.border}`,
  background: p.card,
});

const inputStyle = (p) => ({
  width: "100%",
  padding: "10px 12px",
  background: p.bg,
  border: `1px solid ${p.border}`,
  borderRadius: "7px",
  color: p.text,
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
});

const pathRow = {
  display: "flex",
  gap: "6px",
};

const pickerButton = (p) => ({
  width: "40px",
  flexShrink: 0,
  borderRadius: "7px",
  border: `1px solid ${p.accent}`,
  background: "transparent",
  color: p.accent,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s",
});

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
  borderRadius: "7px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10.5px",
  letterSpacing: "0.06em",
  transition: "background 0.15s",
};

const validateButton = (p) => ({
  ...buttonBase,
  border: `1px solid ${p.accent}`,
  color: p.accent,
  background: "rgba(56,189,248,0)",
  cursor: "pointer",
});

const saveButton = (p) => ({
  ...buttonBase,
  border: `1px solid ${p.accent}`,
  color: p.accent,
  background: "rgba(56,189,248,0.08)",
  cursor: "pointer",
});

const cancelButton = (p) => ({
  ...buttonBase,
  border: `1px solid ${p.muted}`,
  color: p.dim,
  background: "transparent",
  cursor: "pointer",
});

const deleteFormButton = (p) => ({
  ...buttonBase,
  border: `1px solid ${p.danger}`,
  color: p.danger,
  background: "rgba(239,68,68,0.08)",
  cursor: "pointer",
});

const messageBoxBase = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "7px",
  fontSize: "11px",
  fontFamily: "'JetBrains Mono', monospace",
  width: "100%",
};

const validationOk = (p) => ({
  ...messageBoxBase,
  color: p.success,
  border: `1px solid ${p.success}`,
  background: "rgba(16,217,138,0.08)",
});

const validationBad = (p) => ({
  ...messageBoxBase,
  color: p.danger,
  border: `1px solid ${p.danger}`,
  background: "rgba(244,63,94,0.08)",
});

const successBox = (p) => ({
  ...messageBoxBase,
  color: p.success,
  border: `1px solid ${p.success}`,
  background: "rgba(16,217,138,0.08)",
});

const errorBox = (p) => ({
  ...messageBoxBase,
  color: p.danger,
  border: `1px solid ${p.danger}`,
  background: "rgba(244,63,94,0.08)",
});

const emptyBox = (p) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "48px 24px",
  border: `1px dashed ${p.border}`,
  borderRadius: "10px",
  textAlign: "center",
});
