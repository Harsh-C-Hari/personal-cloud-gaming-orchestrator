import { useState } from "react";
import { FaFolderOpen, FaFileImport } from "react-icons/fa";
import {
  addGame,
  updateGame,
  deleteGame,
  validateGameConfig,
  selectFile,
  selectFolder,
} from "../api/client.js";
export function GameManager({
    games,
    refreshGames,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState(null);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [reloading, setReloading] = useState(false);
  const [originalGame, setOriginalGame] = useState(null);
  const [error, setError] = useState("");
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

  const [gameForm, setGameForm] = useState(DEFAULT_GAME);

  const entries = Object.entries(games || {});
  
  function setField(
    key,
    value,
  ) {
    clearMessages();
    setGameForm({
      ...gameForm,
      [key]: value,
    });
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

      const validationResult =
        await validateGameConfig({
            exe_path: request.exe_path,
            save_path: request.save_path,
            process_name: request.process_name,
        });

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
      
      setValidation(validationResult);


      if (!validationResult.valid) {
          return;
      }
      
      if (editingGame) {

        await updateGame(
          editingGame,
          request,
        );
        setSuccessMessage(
          "✓ Game updated successfully."
        );

      }
      else {

        await addGame({
          id: gameForm.id,
          ...request,
        });
        setSuccessMessage(
          "✓ Game added successfully."
        );

      }



      await refreshGames();


      setShowForm(false);
      setEditingGame(null);
      setOriginalGame(null);
      setGameForm(DEFAULT_GAME);
      setValidation(null);

    }
    

    catch (err) {

      alert(
        err.message ||
        "Failed to save game"
      );

    }
    finally {
      setSaving(false);
    }

  }

  async function handleReloadGames() {

    if (reloading) {
      return;
    }

    setReloading(true);

    try {

      await refreshGames();

    } catch (err) {

      alert(
        err.message ||
        "Failed to reload games"
      );

    } finally {

      setReloading(false);

    }
  }

  async function handleDeleteGame() {

    if (deleting || !editingGame) {
      return;
    }

    const confirmDelete = window.confirm(
      `Delete game "${editingGame}"?`
    );

    if (!confirmDelete) {
      return;
    }

    setDeleting(true);

    try {

      await deleteGame(editingGame);
      setSuccessMessage(
        "✓ Game deleted successfully."
      );

      await refreshGames();

      setEditingGame(null);
      setOriginalGame(null);
      setGameForm(DEFAULT_GAME);
      setShowForm(false);

    }

    catch (err) {

      alert(
        err.message ||
        "Failed to delete game"
      );

    } finally {
      setDeleting(false);
    }
  }

  async function handleValidate() {
    setValidating(true);
    setValidation(null);

    try {
      const result =
        await validateGameConfig({
          exe_path: gameForm.exe_path,
          save_path: gameForm.save_path,
          process_name: gameForm.process_name,
        });

      setValidation(result);

    } catch (error) {

      setValidation({
        valid: false,
        errors: [
          error.message ||
          "Validation failed",
        ],
      });

    } finally {
      setValidating(false);
    }
  }
  function updateSaveFilters(
    key,
    value,
  ) {
    clearMessages();

    setGameForm({
      ...gameForm,
      save_filters: {
        ...gameForm.save_filters,
        [key]: value,
      },
    });
  }
  async function handleSelectExe() {

    try {

      const result = await selectFile();

      if (!result.selected) {
        return;
      }

      clearMessages();

      setGameForm({
        ...gameForm,

        exe_path: result.path,

        exe_name: result.name,

        process_name: result.name,
      });

    } catch (err) {

      setError(
        err.message ||
        "Failed to select executable"
      );
    }
  }
  async function handleSelectSaveFolder() {

    try {

      const result = await selectFolder();

      if (!result.selected) {
        return;
      }

      clearMessages();

      setGameForm({
        ...gameForm,

        save_path: result.path,
      });

    } catch (err) {

      setError(
        err.message ||
        "Failed to select save folder"
      );
    }
  }

  function clearMessages() {
    setValidation(null);
    setSuccessMessage("");
  }
  const hasChanges =
    !editingGame ||
    JSON.stringify(gameForm) !==
      JSON.stringify(originalGame);
  return (
    <div>
      <div style={toolbar}>
      <button
        style={addButton}
        onClick={() => {
          setEditingGame(null);
          setGameForm(DEFAULT_GAME);
          clearMessages();
          setShowForm(true);
          setOriginalGame(null);
        }}
        onMouseEnter={(e) =>
          e.currentTarget.style.background =
            "rgba(16,217,138,0.15)"
        }

        onMouseLeave={(e) =>
          e.currentTarget.style.background =
            "rgba(16,217,138,0.08)"
        }
      >
        + ADD GAME
      </button>

      <button
        style={{
          ...reloadButton,
          opacity: reloading ? 0.5 : 1,
        }}
        disabled={reloading}
        onClick={handleReloadGames}
        onMouseEnter={(e) =>
          e.currentTarget.style.background =
            "rgba(56,189,248,0.15)"
        }

        onMouseLeave={(e) =>
          e.currentTarget.style.background =
            "rgba(56,189,248,0.08)"
        }
      >
        {
          reloading
            ? "RELOADING..."
            : "↻ RELOAD"
        }
      </button>
    </div>

      {entries.length != 0 && (
        <div style={dropdownRow}>
          <select
            style={{
              ...input,
              flex: 1,
            }}
            value={editingGame || ""}
            onChange={(e) => {
              const gameId = e.target.value;

              if (!gameId) {
                setShowForm(false);
                setEditingGame(null);
                return;
              }

              setEditingGame(gameId);

              const selectedGame = {
                id: gameId,
                ...games[gameId],
              };

              setOriginalGame(
                JSON.parse(JSON.stringify(selectedGame))
              );

              setGameForm(selectedGame);

              clearMessages();
              setShowForm(true)
            }}
          >
            <option value="">
              Select game to edit
            </option>

            {Object.entries(games ?? {}).map(
              ([id, game]) => (
                <option
                  key={id}
                  value={id}
                >
                  {game.name || id}
                </option>
              )
            )}
          </select>

          {editingGame && (
            <button
              style={deleteButton}
              onClick={handleDeleteGame}
              disabled={deleting}
              onMouseEnter={(e) =>
                e.currentTarget.style.background =
                  "rgba(225, 44, 44, 0.15)"
              }

              onMouseLeave={(e) =>
                e.currentTarget.style.background =
                  "rgba(225, 44, 44, 0)"
              }
            >
              {
                deleting
                  ? "..."
                  : "🗑"
              }
            </button>
          )}
        </div>
      )}
      
      {
        showForm && (
          <div style={formBox}>

          <h3>
            {
              editingGame
                ? "Edit Game"
                : "Add New Game"
            }
          </h3>

          <div style={formGrid}>
            
            <input
              style={{
                ...input,
                opacity: editingGame ? 0.6 : 1,
              }}
              placeholder="Game ID"
              value={gameForm.id}
              disabled={editingGame !== null}
              onChange={(e) =>
                setField("id", e.target.value)
              }
            />

            <input
              style={input}
              placeholder="Game Name"
              value={gameForm.name}
              onChange={(e) =>
                setField("name", e.target.value)
              }
            />

            <input
              style={input}
              placeholder="Executable Name (GoWR.exe)"
              value={gameForm.exe_name}
              onChange={(e) =>
                setField("exe_name", e.target.value)
              }
            />

            <div style={pathRow}>

            <input
              style={pathInput}
              placeholder="Executable Path"
              value={gameForm.exe_path}
              onChange={(e) =>
                setField(
                  "exe_path",
                  e.target.value
                )
              }
            />


            <button
              style={{
                ...pickerButton,
                opacity:
                  saving ||
                  validating ||
                  deleting
                    ? 0.5
                    : 1,
              }}
              disabled={
                saving ||
                validating ||
                deleting
              }
              title="Select executable"
              onClick={handleSelectExe}
              onMouseEnter={(e) => {
                if (!saving && !validating && !deleting) {
                  e.currentTarget.style.background =
                    "rgba(56,189,248,0.15)";
                }
              }}

              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "transparent";
              }}
            >
              <FaFileImport />
            </button>

            </div>

            <div style={pathRow}>

            <input
              style={pathInput}
              placeholder="Save Path"
              value={gameForm.save_path}
              onChange={(e) =>
                setField(
                  "save_path",
                  e.target.value
                )
              }
            />


            <button
              style={{
                ...pickerButton,
                opacity:
                  saving ||
                  validating ||
                  deleting
                    ? 0.5
                    : 1,
              }}
              disabled={
                saving ||
                validating ||
                deleting
              }
              title="Select save folder"
              onClick={handleSelectSaveFolder}
              onMouseEnter={(e) => {
                if (!saving && !validating && !deleting) {
                  e.currentTarget.style.background =
                    "rgba(56,189,248,0.15)";
                }
              }}

              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "transparent";
              }}
            >
              <FaFolderOpen />
            </button>

            </div>

            <input
              style={input}
              placeholder="Process Name"
              value={gameForm.process_name}
              onChange={(e) =>
                setField("process_name", e.target.value)
              }
            />

          

            <h4 style={subTitle}>
              Save Filters
            </h4>

            <select
              style={input}
              value={gameForm.save_filters.mode}
              onChange={(e) =>
                updateSaveFilters(
                  "mode",
                  e.target.value
                )
              }
            >
              <option value="or">
                OR - Match any filter
              </option>

              <option value="and">
                AND - Match all filters
              </option>
            </select>


            <input
              style={input}
              placeholder="Prefix filters (comma separated)"
              value={gameForm.save_filters.prefix.join(",")}
              onChange={(e) =>
                updateSaveFilters(
                  "prefix",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                )
              }
            />


            <input
              style={input}
              placeholder="Contains filters (comma separated)"
              value={gameForm.save_filters.contains.join(",")}
              onChange={(e) =>
                updateSaveFilters(
                  "contains",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                )
              }
            />


            <input
              style={input}
              placeholder="Suffix filters (.sav,.dat)"
              value={gameForm.save_filters.suffix.join(",")}
              onChange={(e) =>
                updateSaveFilters(
                  "suffix",
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
          <div style={formActions}>

          <button
            style={{
              ...validateButton,
              opacity:
                validating || saving || deleting || !hasChanges
                  ? 0.5
                  : 1,
              cursor:
                saving ||
                !hasChanges
                    ? "not-allowed"
                    : "pointer",
            }}
            disabled={
              validating || saving || deleting || !hasChanges
            }
            onClick={handleValidate}
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                "rgba(56,189,248,0.15)"
            }

            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                "rgba(56, 191, 248, 0)"
            }
          >
            {
              validating
                ? "CHECKING..."
                : "VALIDATE"
            }
          </button>
          
          <button
            style={{
              ...saveButton,
              opacity:
                saving ||
                (
                  editingGame &&
                  !hasChanges
                )
                  ? 0.5
                  : 1,

              cursor:
                saving ||
                !hasChanges
                    ? "not-allowed"
                    : "pointer",
            }}
            disabled={
              saving ||
              (
                editingGame &&
                !hasChanges
              )
            }
            onClick={handleSaveGame}
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                "rgba(56,189,248,0.15)"
            }

            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                "rgba(56, 191, 248, 0.08)"
            }
          >
            {
              saving
                ? "SAVING..."
                : editingGame
                ? "SAVE CHANGES"
                : "ADD GAME"
            }
          </button>


          <button
            style={{
              ...cancelButton,
              opacity:
                saving || deleting || validating
                  ? 0.5
                  : 1,
            }}
            disabled={
              saving || deleting || validating
            }
            onClick={() => {
              setShowForm(false);
              setEditingGame(null);
              setOriginalGame(null);
              clearMessages();
            }}
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                "rgba(105, 99, 138, 0.23)"
            }

            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                "rgba(105, 99, 138, 0)"
            }
          >
            CANCEL
          </button>

          {
            validation && (
              <div
                style={
                  validation.valid
                    ? validationOk
                    : validationBad
                }
              >
                {
                  validation.valid
                    ? "✓ Game configuration is valid."
                    : validation.errors.join(" ")
                }
              </div>
            )
          }

          {
            successMessage && (
              <div style={successBox}>
                {successMessage}
              </div>
            )
          }

          {error && (
            <div style={errorBox}>
              {error}
            </div>
          )}

          </div>

          </div>
        )
      }
    </div>
  );
}


const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "12px",
};

const dropdownRow = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
  alignItems: "center",
};

const card = {
  padding: "16px",
  background: "#080a0f",
  border: "1px solid #1c2130",
  borderRadius: "8px",
  color: "#e2e8f0",
};


const formBox = {
  marginTop: "14px",
  padding: "16px",
  background: "#080a0f",
  border: "1px solid #1c2130",
  borderRadius: "8px",
};

const formGrid = {
  display: "grid",
  gap: "10px",
};

const input = {
  width: "100%",
  padding: "9px 12px",
  background: "#05070b",
  border: "1px solid #1c2130",
  borderRadius: "6px",
  color: "#e2e8f0",
  boxSizing: "border-box",
};

const subTitle = {
  marginTop: "16px",
  color: "#94a3b8",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.1em",
};

const formActions = {
  display: "flex",
  gap: "8px",
  marginTop: "16px",
};

const saveButton = {
  flex: 1,
  padding: "10px",
  background: "rgba(56,189,248,0.08)",
  border: "1px solid #38bdf8",
  color: "#38bdf8",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "'JetBrains Mono', monospace",
};

const cancelButton = {
  flex: 1,
  padding: "10px",
  background: "transparent",
  border: "1px solid #475569",
  color: "#94a3b8",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "'JetBrains Mono', monospace",
};


const title = {
  fontSize: "17px",
  fontWeight: 700,
  marginBottom: "10px",
};


const meta = {
  fontFamily:
    "'JetBrains Mono', monospace",
  fontSize: "10px",
  color: "#64748b",
  marginTop: "5px",
};


const actions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "14px",
};


const iconButton = {
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  background: "transparent",
  cursor: "pointer",
  fontSize: "14px",
};


const editButton = {
  ...iconButton,
  border: "1px solid #38bdf8",
  color: "#38bdf8",
};

const toolbar = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
};

const reloadButton = {
  flex: 1,
  padding: "10px",
  background: "rgba(56,189,248,0.08)",
  border: "1px solid #38bdf8",
  borderRadius: "6px",
  color: "#38bdf8",
  cursor: "pointer",
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


const addButton = {
  width: "100%",
  padding: "10px",
  background: "rgba(16,217,138,0.08)",
  border: "1px solid #10d98a",
  borderRadius: "6px",
  color: "#10d98a",
  cursor: "pointer",
  fontFamily:
    "'JetBrains Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.12em",
};


const emptyBox = {
  padding: "24px",
  border: "1px dashed #1c2130",
  borderRadius: "8px",
  color: "#475569",
  textAlign: "center",
};


const errorBox = {
  padding: "14px",
  border: "1px solid #ef4444",
  borderRadius: "8px",
  color: "#ef4444",
};

const selectRow = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const validateButton = {
  border: "1px solid #38bdf8",
  color: "#38bdf8",
  background: "transparent",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};


const validationOk = {
  marginTop: "10px",
  color: "#10d98a",
  fontSize: "11px",
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

const successBox = {
  marginTop: "10px",
  padding: "10px",
  border: "1px solid #10d98a",
  borderRadius: "6px",
  color: "#10d98a",
  background: "rgba(16,217,138,0.08)",
  fontSize: "11px",
  fontFamily:
    "'JetBrains Mono', monospace",
};

const pathRow = {

  display: "flex",

  gap: "6px",

};


const pathInput = {

  ...input,

  flex: 1,

};


const pickerButton = {
  width: "40px",
  borderRadius: "6px",
  border: "1px solid #38bdf8",
  background: "transparent",
  color: "#38bdf8",
  cursor: "pointer",
  fontSize: "16px",
  transition: "0.2s",
};