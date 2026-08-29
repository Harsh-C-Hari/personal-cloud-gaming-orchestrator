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
 *
 * P5-T08 token-elevation audit (typeScale/surface, per D-008/D-009):
 *
 * Backgrounds: all 8 `colors.bg*` references in this file were checked.
 * 7 are literal elevation-slot backgrounds, swapped for their
 * `surface.l*` alias (bgInset->l1, bgElevated->l2, bgCard->l3,
 * bgCardHover->l4) — same CSS custom properties, zero visual change.
 * This includes the 2 references inside the game-card
 * `onMouseEnter`/`onMouseLeave` handlers (~line 510-517) — a
 * `colors.bg*`-inside-an-event-handler pattern that hadn't appeared in
 * any prior P5 task. `saveButton`'s `color: colors.bg` (~line 1113) is
 * the 8th reference and is left un-swapped: a foreground text-color use
 * on a dark `colors.ink` button background, not a background/elevation
 * use — same judgment call P5-T06's `SunshineClientManager.jsx`
 * `saveButton` made for the identical pattern, re-verified fresh against
 * this file's own surrounding style object rather than assumed.
 *
 * Note on the dispatching prompt's breakdown: it described "6 in static
 * style-object definitions... incl. bgCardHover (x1, in a style
 * object)" plus "2 inside onMouseEnter/onMouseLeave." A fresh grep found
 * only 5 static background definitions (bgCard x2 in outerWrap/card,
 * bgElevated x2 in headerBar/cardSection, bgInset x1 in inputStyle) —
 * `bgCardHover` appears exactly once in this file, and it's inside the
 * `onMouseEnter` handler, not a separate static object. Total count (8)
 * matches; the static/handler split in the prompt does not. Flagged per
 * this project's standard of verifying prompt claims rather than
 * trusting them (see P5-T07's SessionAnalytics.jsx discrepancy).
 *
 * Typography: unlike Recovery (P5-T05) and Sunshine (P5-T06/T07), which
 * found zero clean `typeScale` matches and left everything literal, 3 of
 * this file's font-property groups are genuine matches — because this
 * file's own header comment above states it deliberately mirrors
 * StartSessionForm.jsx's "FieldLabel + focus-ring input pattern," and
 * these 3 groups are byte-identical (pre-conversion) to the exact
 * objects StartSessionForm already elevated in P4:
 *   - `FieldLabel` (9.5px/700/mono/0.13em/uppercase) — StartSessionForm
 *     called this a "clean fit within rounding" against `typeScale.meta`
 *     (10px/700/mono/0.12em/uppercase) and adopted it directly. Same
 *     values here, same call: converted to `...typeScale.meta`.
 *   - `SectionHeading` (10px/700/mono/0.15em/uppercase) — matches
 *     `typeScale.meta` exactly except letter-spacing, which
 *     StartSessionForm's own `SectionHeading` intentionally kept at
 *     0.15em (documented there as a deliberate two-tier hierarchy vs.
 *     FieldLabel's tighter tracking). Converted to `...typeScale.meta`
 *     with the same explicit 0.15em override, matching precedent.
 *   - `inputStyle`'s font group (13px/default-weight/body) — matches
 *     StartSessionForm's own pre-elevation `inputStyle` font group
 *     exactly (documented there as a "0.5px size step plus an explicit
 *     weight" onto `typeScale.body`). Converted the same way.
 * **Cross-file note, not fixed (out of this task's scope):** these same
 * literal values — a 9.5px/700/mono/0.13em FieldLabel and matching
 * sectionLabel — also appear in `SunshineClientManager.jsx` (P5-T06),
 * where they were checked against `typeScale.meta` and left as
 * documented literals ("neither matches on size or letter-spacing").
 * That file makes no claim to mirror StartSessionForm's pattern, so the
 * two outcomes aren't strictly inconsistent, but a future consistency
 * pass may want to revisit whether Sunshine's identical values should
 * also convert. Flagged for visibility, not touched — `SunshineClientManager.jsx`
 * is outside this task's allowed-files list.
 *
 * The remaining ~11 font-property groups were each checked against
 * `typeScale`'s six steps and found to have no clean fit — left as
 * documented literals:
 *   - `headerIconBadge`'s lone `fontSize: "13px"` (~line 885) sizes the
 *     icon glyph, not paired with any fontFamily/fontWeight — not a
 *     typographic group, nothing to map.
 *   - The empty-state body text (~line 412/415, 11px/10px mono, no
 *     weight) and `cardMeta` (10px mono, no weight, holds dynamic
 *     exe-name/path/id text) would need `typeScale.meta`'s forced
 *     uppercase+bold+letter-spacing to match — inappropriate for
 *     sentence-case or arbitrary dynamic content, same reasoning
 *     StartSessionForm's own `validationText` group used to justify
 *     staying literal.
 *   - `headerTitle` (14.5px/700/display) and `headerSubtitle`
 *     (10px/mono, no weight) sit between/below the `body`/`subheading`
 *     steps with no clean match.
 *   - `cardTitle`/`formHeading` (15px/700/display, two byte-identical-
 *     to-each-other groups) are closest to `subheading`
 *     (17px/600/-0.01em) but diverge on both size and weight — not a
 *     clean fit.
 *   - `backButton` (10px/700/mono/0.08em/uppercase) is close to
 *     `typeScale.meta` but its 0.08em vs. meta's 0.12em is a 0.04em
 *     gap — 4x the ~0.01em gap treated as "clean fit within rounding"
 *     for `FieldLabel` above — left literal.
 *   - `buttonBase` (10.5px/700/mono/0.06em, no `textTransform`) is
 *     close to `typeScale.meta` on weight/family but diverges on size,
 *     letter-spacing (0.06em vs. 0.12em), and lacks the uppercase
 *     transform `validateButton`/`saveButton`/`cancelButton`/
 *     `deleteFormButton` labels already rely on literal uppercase text
 *     for — forcing `typeScale.meta` here would add CSS-level uppercase
 *     behavior not currently present.
 *   - `messageBoxBase` (11px/mono, no weight, holds
 *     backend-validation-error text) — same "don't force-transform
 *     arbitrary text" reasoning as the empty-state/cardMeta groups
 *     above.
 * All ~11 are left as literal values, matching D-005's "refine, don't
 * flatten" instruction for groups with real existing character.
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
import { colors, fonts, radius, surface, typeScale } from "../dashboard/theme.js";

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
          color: colors.inkFaint,
          // Clean fit within rounding (prior literal was 9.5px/700/
          // 0.13em/uppercase/mono vs. typeScale.meta's 10px/700/0.12em/
          // uppercase/mono) — byte-identical to StartSessionForm.jsx's
          // own FieldLabel before its P4 elevation, so adopted directly
          // rather than left literal, matching that precedent exactly.
          ...typeScale.meta,
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
          color: colors.inkFaint,
          ...typeScale.meta,
          // Documented, not silent: letterSpacing widened from meta's
          // 0.12em default back to this section-heading's prior 0.15em
          // value, preserved intentionally so it keeps slightly wider
          // tracking than FieldLabel's field-level eyebrow above (0.12em
          // post-alias) — byte-identical to StartSessionForm.jsx's own
          // SectionHeading, which made the same override for the same
          // reason.
          letterSpacing: "0.15em",
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
            {/* P6-T11 motion audit: keyframe-based `animation:` (not `transition:`), same
                non-convertible category as SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08),
                LogPanel.jsx's `lp-spin 0.8s` (P6-T09), HostStatusPanel.jsx's `hsp-spin 0.8s`
                and SessionHistory.jsx's `sh-spin 0.8s` (P6-T10). `motion`'s four steps are
                transition-timing strings ("<duration> <easing>"), not @keyframes names, so
                there is no equivalent to alias to here regardless of the 0.8s duration. This
                is one of four independent `gm-spin` instances in this file (reload/delete/
                validate/save); each is documented separately. Left as the original literal;
                no conversion. */}
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
                    e.currentTarget.style.background = surface.l4;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.background = surface.l3;
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
                        /* P6-T11 motion audit: keyframe-based `animation:` (not `transition:`),
                           same non-convertible category as the "Reload games" spinner above in
                           this file and SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08) /
                           LogPanel.jsx's `lp-spin 0.8s` (P6-T09) / HostStatusPanel.jsx's
                           `hsp-spin 0.8s` / SessionHistory.jsx's `sh-spin 0.8s` (P6-T10). No
                           `motion` step is a @keyframes name, so no conversion applies here
                           either. Left as the original literal; no conversion. */
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
              onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkFaint)}
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
                      aria-label="Game ID"
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
                      aria-label="Game Name"
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
                      aria-label="Executable Name"
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
                        aria-label="Executable Path"
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
                        aria-label="Save Path"
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
                      aria-label="Process Name"
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
                      aria-label="Match Mode"
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
                      aria-label="Prefix Filters"
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
                      aria-label="Contains Filters"
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
                      aria-label="Suffix Filters"
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
                    /* P6-T11 motion audit: keyframe-based `animation:` (not `transition:`),
                       same non-convertible category as the reload/delete spinners above in
                       this file and SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08) /
                       LogPanel.jsx's `lp-spin 0.8s` (P6-T09) / HostStatusPanel.jsx's
                       `hsp-spin 0.8s` / SessionHistory.jsx's `sh-spin 0.8s` (P6-T10). No
                       `motion` step is a @keyframes name, so no conversion applies here
                       either. Left as the original literal; no conversion. */
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
                    /* P6-T11 motion audit: keyframe-based `animation:` (not `transition:`), same
                       non-convertible category as the reload/delete/validate spinners above in
                       this file and SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08) /
                       LogPanel.jsx's `lp-spin 0.8s` (P6-T09) / HostStatusPanel.jsx's
                       `hsp-spin 0.8s` / SessionHistory.jsx's `sh-spin 0.8s` (P6-T10). This is
                       the fourth and last independent `gm-spin` instance in this file. No
                       `motion` step is a @keyframes name, so no conversion applies here
                       either. Left as the original literal; no conversion. */
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
  // D-009 literal alias: colors.bgCard -> surface.l3, same value, zero
  // visual change.
  background: surface.l3,
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
  // D-009 literal alias: colors.bgElevated -> surface.l2, same value,
  // zero visual change.
  background: surface.l2,
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
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Byte-identical
  // string to `iconGhostButton`/`cardDeleteButton`/`pickerButton` below in this file, but
  // documented independently per this project's per-object convention. Left as the original
  // literal; no conversion.
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
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Byte-identical
  // string to `iconAddButton` above and `cardDeleteButton`/`pickerButton` below in this file,
  // but documented independently per this project's per-object convention. Left as the
  // original literal; no conversion.
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
  // D-009 literal alias: colors.bgCard -> surface.l3, same value, zero
  // visual change. The hover/leave handlers below swap this to
  // surface.l4/l3 directly (not via this static value), matching.
  background: surface.l3,
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.md}px`,
  color: colors.ink,
  cursor: "pointer",
  overflow: "hidden",
  // P6-T11 motion audit: real `transition:` with three properties, all 150ms/`ease`. 150ms
  // does not exactly match any `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms, pill:
  // 180ms cubic-bezier) for any of the three properties. Left as the original literal; no
  // conversion.
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
  // P7-T09 (CC-10): widened from 24px to 44px to clear WCAG 2.2 2.5.8 Target
  // Size (Minimum) AA comfortably, matching this app's own established
  // comfortable-target convention (StartSessionForm.jsx's Skip Timer
  // toggle wrapper, minHeight: "44px"). The Trash2 icon itself stays
  // size={12} at its usage site below — only this container grows.
  width: "44px",
  height: "44px",
  flexShrink: 0,
  borderRadius: `${radius.sm}px`,
  background: "transparent",
  border: `1.5px solid ${colors.danger}66`,
  color: colors.danger,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Byte-identical
  // string to `iconAddButton`/`iconGhostButton` above and `pickerButton` below in this file,
  // but documented independently per this project's per-object convention. Left as the
  // original literal; no conversion.
  transition: "background 150ms ease",
};

const backButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  border: "none",
  // P7.5-T04 ink-ladder audit: was colors.inkDim. This is the same UI role as
  // PageHeader.jsx's shared `onBack` control — a borderless, icon+text back-navigation
  // link that brightens to colors.ink on hover — which uses colors.inkFaint as its
  // default. Aligned here to match that established convention for this specific role
  // (borderless back-nav link), not a general inkDim->inkFaint sweep: this file's other
  // inkDim usages (iconGhostButton, cardMeta's sibling text, etc.) are untouched.
  // WCAG-AA safety independently computed (not assumed): inkFaint vs. surface-l3, the
  // hardest surface, is 4.51-4.96:1 across all 6 themes (amber is tightest at 4.51:1),
  // every one a real pass. (Main Claude review note: an earlier version of this comment
  // mis-cited App.jsx's inkGhost contrast comments as if they covered inkFaint — corrected.)
  color: colors.inkFaint,
  fontSize: "10px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  padding: 0,
  marginBottom: "10px",
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier) — same non-match
  // conclusion as every other 150ms value audited across this project. NOTE: this `color
  // 150ms ease` declaration on `backButton` was not enumerated in this task's dispatch (which
  // listed 8 `transition:` declarations); this file actually contains 9. Flagging the
  // correction here per this task's instructions. Left as the original literal; no
  // conversion.
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
  // D-009 literal alias: colors.bgElevated -> surface.l2, same value,
  // zero visual change. Not the same background level as
  // StartSessionForm.jsx's own `cardSection` (that one aliases
  // colors.bgCard -> surface.l3) — structurally similar (padding/
  // borderRadius/border match) but not a byte-identical duplicate, so
  // each keeps its own pre-existing background level.
  background: surface.l2,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  // D-009 literal alias: colors.bgInset -> surface.l1, same value, zero
  // visual change.
  background: surface.l1,
  border: `1.5px solid ${colors.border}`,
  borderRadius: `${radius.sm}px`,
  color: colors.ink,
  // Clean fit within rounding (prior literal was 13px/default-weight;
  // typeScale.body is 13.5px/500/1.5/body) — byte-identical to
  // StartSessionForm.jsx's own `inputStyle` font group before its P4
  // elevation, so adopted directly following that exact precedent.
  ...typeScale.body,
  boxSizing: "border-box",
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
  // original literal; no conversion.
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
  // P6-T11 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Byte-identical
  // string to `iconAddButton`/`iconGhostButton`/`cardDeleteButton` above in this file, but
  // documented independently per this project's per-object convention. Left as the original
  // literal; no conversion.
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
  // P6-T11 motion audit: real `transition:` with two properties, both 150ms/`ease`. 150ms
  // does not exactly match any `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms, pill:
  // 180ms cubic-bezier) for either property. Left as the original literal; no conversion.
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
  // Left un-swapped, documented: foreground text-color on a dark
  // colors.ink button background, not a background/elevation-slot use —
  // converting to a surface.l* value would mislabel a foreground color
  // as an elevation level, per D-009's actual wording (surface is
  // strictly a background elevation ladder). Same pattern, same call,
  // as P5-T06's SunshineClientManager.jsx `saveButton`.
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
