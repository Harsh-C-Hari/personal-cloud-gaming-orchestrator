/**
 * components/StartSessionForm.jsx
 *
 * Controlled form that maps directly to StartSessionRequest (pydantic model):
 *   game_id    : str           (required — chosen from GET /games/)
 *   duration   : int = 60
 *   warning    : int = 5
 *   load_save  : str | None    (optional archive path)
 *   skip_timer : bool = False
 *
 * Games are loaded once on mount from GET /games/.
 * The response is the raw game_configs dict, NOT a typed list.
 * Shape: { [game_id]: { name, exe_name, exe_path, save_path, process_name } }
 *
 * @param {{ onLaunched: () => void }} props
 *   onLaunched — called after a successful POST /sessions/start so
 *               Dashboard can trigger an immediate re-fetch.
 *
 * Messaging: the old single `formErr` box (which mixed pre-flight field
 * validation, the delete-save result, and the launch API result into one
 * inline message) was removed in favor of toast.warning/toast.error,
 * matching GameManager's convention for the same kind of one-off action
 * feedback. On success, toast.success("Session launched.") now fires
 * alongside — not instead of — the existing inline "Launched: <id>"
 * indicator below, since that indicator does something a toast can't: it
 * stays up for the session's actual lifecycle and shows the session id
 * for reference. `savesErr` / `gameValidationErr` are untouched — they
 * describe the current state of the saves list / game-config check
 * (like SaveBrowser's own error prop), not a one-off event, so they stay
 * inline next to the fields they describe.
 */

import { useEffect, useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Gamepad2,
  Clock,
  Bell,
  Rocket,
  Info,
} from "lucide-react";
import { deleteSave, fetchSaves, startSession, validateGame } from "../api/client.js";
import { SaveBrowser } from "./SaveBrowser.jsx";
import { GameLibrary } from "./GameLibrary.jsx";
import { useConfirm } from "./ui/ConfirmDialog.jsx";
import { useToast } from "./ui/Toast.jsx";
import { Button } from "./ui/primitives.jsx";
import { colors, fonts, radius, surface, typeScale } from "../dashboard/theme.js";

const DEFAULT_FORM = {
  game_id:    "",
  duration:   60,
  warning:    5,
  skip_timer: false,
  save_type: "latest",
  save_name: "",
};

export function StartSessionForm({ games, gamesLoading = false, onLaunched, hostStatus, activeSessions, blockActiveSessions = false }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting,  setSubmitting] = useState(false);
  const [launchedId,  setLaunchedId] = useState(null);
  const [launchedSeen, setLaunchedSeen] = useState(false);
  const [lastLaunchUserId, setLastLaunchUserId] = useState("");
  const [lastLaunchGameId, setLastLaunchGameId] = useState("");
  const [saves, setSaves] = useState({
    latest_exists: false,
    archives: [],
    backups: [],
  });
  const [savesLoading, setSavesLoading] = useState(false);
  const [savesErr, setSavesErr] = useState("");
  const [deletingSave, setDeletingSave] = useState(false);
  const [gameValidation, setGameValidation] = useState(null);
  const [gameValidationLoading, setGameValidationLoading] = useState(false);
  const [gameValidationErr, setGameValidationErr] = useState("");
  const [showGameDetails, setShowGameDetails] = useState(false);
  const gamesReady = !gamesLoading && Object.keys(games).length > 0;
  // ── Load game list ────────────────────────────────────────────────────

  const entries = Object.entries(games || {});

  useEffect(() => {
    const gameId = form.game_id;

    if (!gameId) {
      setSaves({
        latest_exists: false,
        archives: [],
        backups: [],
      });
      setSavesErr("");
      return;
    }

    let cancelled = false;

    async function loadSaves() {
      setSavesLoading(true);
      setSavesErr("");

      try {
        const data = await fetchSaves(
          gameId,
        );

        if (!cancelled) {
          setSaves(data);
        }
      } catch (err) {
        if (!cancelled) {
          setSavesErr(
            err.message || "Failed to load saves"
          );
        }
      } finally {
        if (!cancelled) {
          setSavesLoading(false);
        }
      }
    }


    loadSaves();

    return () => {
      cancelled = true;
    };
  }, [form.game_id]);

  useEffect(() => {
    if (!form.game_id) {
      setGameValidation(null);
      setGameValidationErr("");
      return;
    }

    let cancelled = false;

    async function runValidation() {
      setGameValidationLoading(true);
      setGameValidationErr("");

      try {
        const data = await validateGame(
          form.game_id
        );

        if (!cancelled) {
          setGameValidation(data);
        }
      } catch (err) {
        if (!cancelled) {
          setGameValidation(null);
          setGameValidationErr(
            err.message || "Failed to validate game"
          );
        }
      } finally {
        if (!cancelled) {
          setGameValidationLoading(false);
        }
      }
    }

    runValidation();

    return () => {
      cancelled = true;
    };
  }, [form.game_id]);

  useEffect(() => {
    if (!launchedId || !activeSessions) return;

    const stillActive = activeSessions.some(
      (session) => session.session_id === launchedId
    );

    if (stillActive) {
      setLaunchedSeen(true);
      return;
    }

    if (launchedSeen && !stillActive) {
      setLaunchedId(null);
      setLaunchedSeen(false);
      setLastLaunchUserId("");
      setLastLaunchGameId("");
    }
  }, [activeSessions, launchedId, launchedSeen]);

  useEffect(() => {
    if (
      !lastLaunchUserId ||
      !lastLaunchGameId ||
      !activeSessions
    ) {
      return;
    }

    const hasCleaningOrCompleted = activeSessions.some(
      (session) =>
        session.session_id === launchedId &&
        ["cleaning", "completed"].includes(session.status)
    );

    if (!hasCleaningOrCompleted) {
      return;
    }

    fetchSaves(
      lastLaunchUserId,
      lastLaunchGameId
    )
      .then(setSaves)
      .catch(() => {});
  }, [
    activeSessions,
    launchedId,
    lastLaunchUserId,
    lastLaunchGameId,
  ]);

  useEffect(() => {

      setSaves({
          latest_exists: false,
          archives: [],
          backups: [],
      });

      setSavesErr("");

  }, [form.game_id]);

  useEffect(() => {

      if (
          form.save_type === "archives" &&
          saves.archives.length === 0
      ) {
          set("save_type", "latest");
      }

      if (
          form.save_type === "backups" &&
          saves.backups.length === 0
      ) {
          set("save_type", "latest");
      }

  }, [saves]);

  // ── Field helpers ─────────────────────────────────────────────────────

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const hostState =
    hostStatus?.host_state;

  const sessionBlocked =
    !hostStatus?.host_ready ||
    hostState === "maintenance" ||
    hostState === "recovery" ||
    hostState === "starting";

  // ── Submit ────────────────────────────────────────────────────────────

  async function refreshSaves() {
    const gameId = form.game_id;

    if (!gameId) {
      return;
    }

    const data = await fetchSaves(
      gameId,
    );

    setSaves(data);
  }
  
  async function handleDeleteSave() {
    const gameId = form.game_id;

    if (
      form.save_type === "latest" ||
      !form.save_name.trim()
    ) {
      return;
    }

    const ok = await confirm(
      `Delete ${form.save_type === "archives" ? "archive" : "backup"} "${form.save_name}"?`,
      { danger: true, confirmLabel: "Delete" }
    );

    if (!ok) {
      return;
    }

    setDeletingSave(true);

    try {
      await deleteSave(
        gameId,
        form.save_type,
        form.save_name.trim()
      );

      set("save_name", "");
      await refreshSaves();
      toast.success("Save deleted.");

    } catch (err) {
      toast.error(
        err.message || "Failed to delete save"
      );
    } finally {
      setDeletingSave(false);
    }
  }

  async function handleLaunch() {
    if (submitting) return;

    setSubmitting(true);
    setLaunchedId(null);
    setLaunchedSeen(false);

    try {

      if (!form.game_id) {
        toast.warning("Select a game.");
        return;
      }

      if (gameValidationLoading) {
        toast.warning("Please wait: game config is still being checked.");
        return;
      }

      if (gameValidation && !gameValidation.valid) {
        toast.warning("Cannot launch: selected game config is invalid.");
        return;
      }

      if (!form.skip_timer) {
        const duration = Number(form.duration);
        const warning = Number(form.warning);

        if (!Number.isInteger(duration) || duration < 1) {
          toast.warning("Enter a valid duration in whole minutes.");
          return;
        }

        if (duration > 480) {
          toast.warning("Duration cannot be more than 480 minutes.");
          return;
        }

        if (!Number.isInteger(warning) || warning < 1) {
          toast.warning("Enter a valid warning time in whole minutes.");
          return;
        }

        if (warning > 60) {
          toast.warning("Warning time cannot be more than 60 minutes.");
          return;
        }

        if (warning >= duration) {
          toast.warning("Warning must be less than duration.");
          return;
        }
      }

      const validSaveTypes = new Set([
        "latest",
        "archives",
        "backups",
      ]);

      if (!validSaveTypes.has(form.save_type)) {
        toast.warning("Invalid save type selected.");
        return;
      }
      
      if (
        form.save_type !== "latest" &&
        !form.save_name.trim()
      ) {
        const saveLabel =
          form.save_type === "archives"
            ? "an archive"
            : "a backup";

        toast.warning(
          `Please select ${saveLabel} save.`
        );
        return;
      }

      const duration = form.skip_timer
        ? 0
        : Number(form.duration);

      const warning = form.skip_timer
        ? 0
        : Number(form.warning);
      
      const payload = {
        game_id: form.game_id,
        duration: duration,
        warning: warning,
        skip_timer: form.skip_timer,
        load_save_type: form.save_type,
        load_save_name:
          form.save_type === "latest"
            ? null
            : form.save_name.trim(),
      };
      
      const res = await startSession(payload);
      
      setLaunchedId(res.session_id);
      setLastLaunchGameId(form.game_id);
      setLaunchedSeen(false);

      setForm((f) => ({
        ...f,
        save_type: "latest",
        save_name: "",
      }));

      setSaves({
        latest_exists: false,
        archives: [],
        backups: [],
      });

      setSavesErr("");

      toast.success("Session launched.");

      onLaunched();
    } catch (err) {
      const cleanMessage = (err.message || "Failed to launch session.")
        .replace(/^400:\s*/, "")
        .replace(/^HTTP 400\s*/, "");

      toast.error(cleanMessage);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared style primitives ───────────────────────────────────────────

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    // D-009 literal alias: colors.bgInset -> surface.l1, same value,
    // zero visual change. Genuinely effective here (unlike cardSection
    // below): no feature-page.css rule sets background on
    // `.pcgo-launch-console__section input`/`select`, only border-color.
    background: surface.l1,
    border: `1px solid ${colors.border}`,
    borderRadius: `${radius.sm}px`,
    color: colors.ink,
    // Documented small elevation, not a silent alias: prior literal was
    // 13px/default-weight; typeScale.body is 13.5px/500/1.5/body — a
    // 0.5px size step plus an explicit weight, same order of change as
    // P4-T01's LoadingState 13px->13.5px adoption. Applies to this
    // form's <select>/<input type="number"> fields; no dynamic-content
    // corruption risk since typeScale.body doesn't force case or
    // letter-spacing.
    ...typeScale.body,
    boxSizing: "border-box",
    // P6-T12 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
    // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
    // original literal; no conversion.
    transition: "border-color 150ms ease",
  };

  const cardSection = {
    padding: "18px",
    borderRadius: `${radius.md}px`,
    border: `1px solid ${colors.borderSubtle}`,
    // D-009 literal alias: colors.bgCard -> surface.l3 (same value,
    // zero visual change by default rule). DISCOVERY, flagged rather
    // than silently worked around: `feature-page.css`'s
    // `.pcgo-launch-console__section` rule (and its `--game` modifier)
    // already force `background: var(--color-bg-inset) !important` on
    // every section this style is applied to (Game/Session Timer/Save
    // Data), so the actually-rendered background has been surface.l1
    // (bg-inset), not bg-card/l3, regardless of this inline value —
    // both before this change and after it. This is a pre-existing
    // inline/CSS mismatch, not introduced by this task. Per
    // CURRENT_TASK.md's instruction to stop and flag CSS-file
    // involvement rather than assume or silently resolve it, this is
    // surfaced in the task report/CHANGELOG rather than touched here;
    // `feature-page.css` is outside this task's allowed-files list.
    // The literal token swap below is still the correct D-009 mapping
    // for the inline value itself, even though it doesn't currently win
    // the cascade.
    background: surface.l3,
  };

  // Judgment call, this whole group (validationText/validationOk/
  // validationBad below, reused for the "Checking game config…" /
  // "Game config ready." / "Game validation unavailable." messages and
  // arbitrary-case backend validation error text via
  // gameValidation.errors.join(" ")): forcing typeScale.meta's uppercase
  // would garble real backend error strings — same reasoning
  // SessionCard/P4-T02 used for its own error captions. Left literal.
  const validationText = {
    marginTop: "9px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "10.5px",
    color: colors.inkFaint,
    fontFamily: fonts.mono,
  };

  const validationOk = { ...validationText, color: colors.success };
  const validationBad = { ...validationText, color: colors.danger };

  const focusBorder = (e) => {
    e.target.style.borderColor = colors.ink;
  };
  const blurBorder = (e) => {
    e.target.style.borderColor = colors.border;
  };

  function FieldLabel({ icon, children }) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: colors.inkFaint,
          // Clean fit within rounding: the prior literal (9.5px/700/
          // 0.13em/uppercase/mono) matches typeScale.meta (10px/700/
          // 0.12em/uppercase/mono) to within 0.5px/0.01em — the same
          // "clean fit" bar P4-T02's own microLabel used for
          // SessionCard. Adopted directly, not a judgment-call
          // exception.
          ...typeScale.meta,
          marginBottom: "8px",
        }}
      >
        {icon}
        {children}
      </span>
    );
  }

  function SectionHeading({ children }) {
    return (
      <div
        style={{
          color: colors.inkFaint,
          ...typeScale.meta,
          // Documented, not silent: letterSpacing widened from meta's
          // 0.12em default back to the section's prior 0.15em value,
          // preserved intentionally so this section-level heading keeps
          // slightly wider tracking than FieldLabel's field-level
          // eyebrow above (0.12em post-alias) — a two-tier hierarchy
          // that predates this pass, not something this task
          // introduces.
          letterSpacing: "0.15em",
          marginBottom: "12px",
        }}
      >
        {children}
      </div>
    );
  }

  const activeSessionBlocked = blockActiveSessions && activeSessions?.length > 0;
  const launchDisabled =
    submitting || gamesLoading || !gamesReady || gameValidationLoading || sessionBlocked || activeSessionBlocked;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="pcgo-launch-console"
      style={{
        border: `1.5px solid ${colors.border}`,
        borderRadius: `${radius.lg}px`,
        // D-009 literal alias: colors.bgCard -> surface.l3, same value.
        // feature-page.css's `.pcgo-launch-console` rule also forces
        // this exact same background (`var(--color-bg-card)
        // !important`), so this alias is confirmed zero-visual-change
        // either way.
        background: surface.l3,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="pcgo-launch-console__header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 20px",
          borderBottom: `1.5px solid ${colors.border}`,
          // D-009 literal alias: colors.bgElevated -> surface.l2, same
          // value; feature-page.css's `.pcgo-launch-console__header`
          // rule forces this exact same background too, so confirmed
          // zero-visual-change.
          background: surface.l2,
        }}
      >
        <div
          style={{
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
          }}
        >
          <Rocket size={14} strokeWidth={2} />
        </div>
        <div>
          {/* Documented elevation, not silent: prior literal was
              14.5px/700/display; typeScale.subheading is
              17px/600/-0.01em/display. This elevation also happens to
              match feature-page.css's own
              `.pcgo-launch-console__header > div:last-child >
              div:first-child` rule, which already forces `font-size:
              17px !important; letter-spacing: -.025em` on this exact
              element — so the 17px step taken here isn't a new visual
              change, it's the inline value catching up to what has
              already been rendering. fontWeight is kept at 700 (rather
              than subheading's 600 default) since CSS doesn't touch
              font-weight here and 700 is this card's existing
              established title weight — same "keep the heading's
              boldness" override pattern P4-T02 used for SessionCard's
              own title. letterSpacing from typeScale.subheading
              (-0.01em) is included for consistency with the spread, but
              is superseded by the CSS rule's -.025em !important
              either way. */}
          <div style={{ ...typeScale.subheading, fontWeight: 700, color: colors.ink }}>
            Launch a Session
          </div>
          {/* Judgment call: sentence-case caption ("Pick a game, set
              your timer, and go") — forcing typeScale.meta's uppercase
              would turn a natural sentence into a shouted label, a real
              content/tone change, not a style alias. Left literal.
              feature-page.css's sibling rule also forces this same 10px
              font-size !important, confirming no visual regression from
              leaving it as-is (marginTop is separately overridden to 4px
              by that same rule — a pre-existing, out-of-scope dead
              value, noted but not touched here). */}
          <div style={{ fontSize: "10px", color: colors.inkFaint, fontFamily: fonts.mono, marginTop: "1px" }}>
            Pick a game, set your timer, and go
          </div>
        </div>
      </div>

      <div className="pcgo-launch-console__body" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
        {/* Game */}
        <div className="pcgo-launch-console__section pcgo-launch-console__section--game" style={cardSection}>
          <FieldLabel icon={<Gamepad2 size={11} strokeWidth={2} />}>Game</FieldLabel>

          {gamesLoading ? (
            <div className="pcgo-game-manager-form-loading" role="status" aria-live="polite">
              <span className="pcgo-game-manager-form-loading__dot" />
              Loading configured launch targets…
            </div>
          ) : entries.length === 0 ? (
            // Judgment call, grouped with the other status/warning
            // banners in this file (hostStatus items, the save-picker
            // placeholder, the launched-session indicator, the
            // sessionBlocked footer note): all render short
            // sentence-style status text at a similar 10.5-11px/mono
            // size, and are kept literal as one consistent family rather
            // than forcing typeScale.meta's uppercase onto some of them
            // (which would corrupt the dynamic/sentence-case members)
            // while leaving others unstyled — same reasoning as
            // SessionCard/P4-T02's grouped captions.
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: `${radius.sm}px`,
                background: colors.accentYellowDim,
                border: `1.5px solid ${colors.warning}`,
                color: colors.warning,
                fontSize: "11px",
                fontFamily: fonts.mono,
              }}
            >
              <AlertTriangle size={12} strokeWidth={2} />
              No configured games
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* P7-T04 (CC-9) investigation: this <select> already carries a real
                  aria-label ("Select a game to launch"), pre-dating this task — it
                  already provides an accessible name distinct from FieldLabel's
                  "Game" span above it, so no fix is needed here. Confirmed this is
                  a plain <select>, not a custom combobox/listbox: the "BROWSE GAME
                  LIBRARY" toggle below opens a separate GameLibrary picker, which
                  is a distinct, already-interactive component outside CC-9's scope. */}
              <select
                style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "34px" }}
                value={form.game_id}
                disabled={!gamesReady}
                aria-label="Select a game to launch"
                onChange={(e) => set("game_id", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                <option value="">Select a game to play</option>

                {!gamesReady ? (
                  <option>No games found. Loading...</option>
                ) : (
                  Object.entries(games).map(([id, g]) => (
                    <option key={id} value={id}>
                      {g.name ?? id}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                size={12}
                strokeWidth={2}
                style={{
                  position: "absolute",
                  right: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.inkFaint,
                  pointerEvents: "none",
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGameDetails(!showGameDetails)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
              marginTop: "10px",
              border: `1.5px solid ${colors.borderStrong}`,
              background: "transparent",
              color: colors.inkDim,
              borderRadius: `${radius.sm}px`,
              padding: "7px",
              // Adopted typeScale.meta (10px/700/uppercase/mono — a
              // clean fit within rounding of the prior 9.5px/700/
              // uppercase/mono), with letterSpacing documented and kept
              // at its prior 0.08em rather than meta's 0.12em default:
              // this button's label text toggles between "BROWSE GAME
              // LIBRARY" and "HIDE GAME LIBRARY", the longest text in
              // this form, and widening its tracking risks the
              // wrap/clip behavior CURRENT_TASK.md flagged to watch for
              // at 360px — same button-label caution P4-T02 applied to
              // Restart/Stop.
              ...typeScale.meta,
              letterSpacing: "0.08em",
              cursor: "pointer",
              // P6-T12 motion audit: real `transition:` with two properties, both 150ms/`ease`.
              // 150ms does not exactly match any `motion` step (fast: 100ms, base: 160ms,
              // cardIn: 220ms, pill: 180ms cubic-bezier) for either property. Left as the
              // original literal; no conversion.
              transition: "background 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.ink;
              e.currentTarget.style.background = "rgba(237,235,227,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.inkDim;
              e.currentTarget.style.background = "transparent";
            }}
          >
            {showGameDetails ? "HIDE GAME LIBRARY" : "BROWSE GAME LIBRARY"}
            <ChevronDown
              size={11}
              strokeWidth={2}
              style={{
                transform: showGameDetails ? "rotate(180deg)" : "rotate(0deg)",
                // P6-T12 motion audit: real `transition:`, but 150ms does not exactly match any
                // `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms
                // cubic-bezier). Byte-identical original literal; no conversion.
                transition: "transform 150ms ease",
              }}
            />
          </button>

          {showGameDetails && (
            <div style={{ marginTop: "12px" }}>
              <GameLibrary games={games} selectedGameId={form.game_id} onSelectGame={(gameId) => set("game_id", gameId)} />
            </div>
          )}

          {gameValidationLoading && (
            <div style={validationText}>
              <Info size={11} strokeWidth={2} /> Checking game config…
            </div>
          )}

          {gameValidationErr && (
            <div style={validationBad}>
              <XCircle size={11} strokeWidth={2} /> Game validation unavailable.
            </div>
          )}

          {gameValidation && (
            <div style={gameValidation.valid ? validationOk : validationBad}>
              {gameValidation.valid ? <CheckCircle2 size={11} strokeWidth={2} /> : <XCircle size={11} strokeWidth={2} />}
              {gameValidation.valid ? "Game config ready." : gameValidation.errors.join(" ")}
            </div>
          )}
        </div>

        {/* Duration + Warning */}
        <div className="pcgo-launch-console__section pcgo-launch-console__section--timer" style={cardSection}>
          <SectionHeading>Session Timer</SectionHeading>
          <div className="pcgo-2col" style={{ gap: "12px" }}>
            <div>
              <FieldLabel icon={<Clock size={10} strokeWidth={2} />}>Duration (min)</FieldLabel>
              <input
                type="number"
                min={1}
                max={480}
                style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
                value={form.duration}
                disabled={form.skip_timer}
                aria-label="Duration (min)"
                onChange={(e) => set("duration", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
            <div>
              <FieldLabel icon={<Bell size={10} strokeWidth={2} />}>Warning (min)</FieldLabel>
              <input
                type="number"
                min={1}
                max={60}
                style={{ ...inputStyle, opacity: form.skip_timer ? 0.35 : 1 }}
                value={form.warning}
                disabled={form.skip_timer}
                aria-label="Warning (min)"
                onChange={(e) => set("warning", e.target.value)}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
          </div>

          {/* Skip Timer toggle */}
          <div
            role="checkbox"
            aria-checked={form.skip_timer}
            tabIndex={0}
            onClick={() => set("skip_timer", !form.skip_timer)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") set("skip_timer", !form.skip_timer);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
              marginTop: "14px",
              paddingTop: "14px",
              paddingBottom: "8px",
              minHeight: "44px",
              boxSizing: "border-box",
              borderTop: `1.5px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "20px",
                borderRadius: `${radius.full}px`,
                // D-009 literal alias: colors.bgInset -> surface.l1,
                // same value. Genuinely effective (no CSS rule targets
                // this nested toggle-track div).
                background: form.skip_timer ? colors.brandDim : surface.l1,
                border: `1.5px solid ${form.skip_timer ? colors.brand : colors.border}`,
                position: "relative",
                // P6-T12 motion audit: real `transition:` with two properties, both 150ms/
                // `ease`. 150ms does not exactly match any `motion` step (fast: 100ms, base:
                // 160ms, cardIn: 220ms, pill: 180ms cubic-bezier) for either property. Left as
                // the original literal; no conversion.
                transition: "background 150ms ease, border-color 150ms ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: form.skip_timer ? "16px" : "2px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: form.skip_timer ? colors.brand : colors.inkGhost,
                  // P6-T12 motion audit: real `transition:` with two properties, both 150ms/
                  // `ease`. 150ms does not exactly match any `motion` step (fast: 100ms, base:
                  // 160ms, cardIn: 220ms, pill: 180ms cubic-bezier) for either property. Left
                  // as the original literal; no conversion.
                  transition: "left 150ms ease, background 150ms ease",
                }}
              />
            </div>
            {/* Judgment call: no typeScale step fits without a real
                change — typeScale.bodySmall is the nearest 12px step but
                is fonts.body (this label is intentionally fonts.mono, to
                match the rest of this form's field-level mono aesthetic
                sitting right above it); typeScale.meta matches the mono
                family but is 10px/700/uppercase, which would both shrink
                and bold-caps a plain toggle caption for no layout
                reason. Left literal rather than force a family or case
                change. */}
            <span style={{ fontSize: "12px", color: colors.inkDim, fontFamily: fonts.mono }}>
              Skip Timer
            </span>
          </div>
        </div>

        {/* Load Save */}
        <div className="pcgo-launch-console__section pcgo-launch-console__section--saves" style={cardSection}>
          <SectionHeading>Save Data</SectionHeading>
          {form.game_id ? (
            <SaveBrowser
              type={form.save_type}
              name={form.save_name}
              saves={saves}
              loading={savesLoading}
              error={savesErr}
              deleting={deletingSave}
              onTypeChange={(value) => {
                set("save_type", value);
                set("save_name", "");
              }}
              onNameChange={(value) => set("save_name", value)}
              onDelete={handleDeleteSave}
            />
          ) : (
            // Judgment call (same status/warning-banner family as "No
            // configured games" above): sentence-case static text at
            // the same 10.5px/mono step used across the family. Left
            // literal for consistency, not forced into meta.
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px",
                border: `1.5px dashed ${colors.border}`,
                borderRadius: `${radius.sm}px`,
                color: colors.inkFaint,
                fontSize: "10.5px",
                fontFamily: fonts.mono,
              }}
            >
              <Info size={12} strokeWidth={2} />
              Select a game to load your saves.
            </div>
          )}
        </div>

        {/* Launch success */}
        {launchedId && (
          // Judgment call (same family, strongest case for it): renders
          // the actual launched session id — a case-sensitive backend
          // identifier — inline. Forcing typeScale.meta's uppercase here
          // would be a real content change to an id a user may need to
          // reference verbatim, not a style alias. Same reasoning
          // SessionCard/P4-T02 used for its own session-id display.
          // Left literal.
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "11px 14px",
              background: colors.accentGreenDim,
              border: `1.5px solid ${colors.success}`,
              borderRadius: `${radius.sm}px`,
              color: colors.success,
              fontSize: "11px",
              fontFamily: fonts.mono,
              letterSpacing: "0.03em",
              // P6-T12 motion audit: this `animation:` shares a 180ms duration with
              // `motion.pill`, but is not a conversion candidate for two independent reasons:
              // (1) it's a named-keyframe `animation:` reference, not a `transition:`
              // property-list — `motion`'s four exports are transition-timing value strings,
              // not `@keyframes` names, so there's no valid conversion target regardless of
              // duration; and (2) its easing is plain `ease`, not `pill`'s
              // `cubic-bezier(0.4,0,0.2,1)` — a second, independent disqualifier even if it
              // were a `transition:`. Left as the original literal; no conversion.
              animation: "card-in 180ms ease forwards",
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
            Launched: {launchedId}
          </div>
        )}

        {/* Judgment call (same family): four short warning sentences
            ("Sunshine is not running.", etc.) at the family's usual
            10.5px/mono step. Left literal, same reasoning as the rest
            of this group. */}
        {hostStatus &&
          (!hostStatus.sunshine_running ||
            !hostStatus.tailscale_running ||
            hostStatus.sunshine_api_reachable === false ||
            hostStatus.sunshine_apps_count === 0) && (
            <div
              style={{
                padding: "11px 14px",
                borderRadius: `${radius.sm}px`,
                background: colors.accentYellowDim,
                border: `1.5px solid ${colors.warning}`,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {!hostStatus.sunshine_running && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: colors.warning, fontFamily: fonts.mono }}>
                  <AlertTriangle size={11} strokeWidth={2} /> Sunshine is not running.
                </div>
              )}
              {!hostStatus.tailscale_running && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: colors.warning, fontFamily: fonts.mono }}>
                  <AlertTriangle size={11} strokeWidth={2} /> Tailscale is not running.
                </div>
              )}
              {hostStatus.sunshine_api_reachable === false && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: colors.warning, fontFamily: fonts.mono }}>
                  <AlertTriangle size={11} strokeWidth={2} /> Sunshine API is not reachable.
                </div>
              )}
              {hostStatus.sunshine_apps_count === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", color: colors.warning, fontFamily: fonts.mono }}>
                  <AlertTriangle size={11} strokeWidth={2} /> Sunshine has no configured apps.
                </div>
              )}
            </div>
          )}

        {/* Launch button. Adopted typeScale.meta (fontFamily/fontWeight/
            textTransform all match exactly), with two documented
            overrides:
              - fontSize kept at this CTA's existing 12px (a deliberate
                elevation over meta's 10px default — this is the form's
                single primary action, sized up from the label scale on
                purpose, not a corrupted alias).
              - letterSpacing corrected to 0.16em (from the prior
                0.14em). DISCOVERY: feature-page.css's
                `.pcgo-launch-console__body > .pcgo-button,
                > button:last-of-type` rule already forces
                `letter-spacing: .16em !important` on this exact button,
                so the previous 0.14em inline value never actually
                rendered — same "correct a misleading dead inline value"
                fix P4-T01 made for SessionSidebar's caption. Unlike the
                cardSection background discovery above, this one is
                harmless to correct in place since it only affects the
                (already-superseded) inline value, not feature-page.css
                itself. */}
        <Button
          variant="primary"
          onClick={handleLaunch}
          disabled={launchDisabled}
          style={{
            width: "100%",
            padding: "13px",
            ...typeScale.meta,
            fontSize: "12px",
            letterSpacing: "0.16em",
          }}
        >
          <Rocket size={13} strokeWidth={2} />
          {submitting ? "Checking / Launching..." : "Launch Session"}
        </Button>

        {activeSessionBlocked && (
          <div className="pcgo-game-manager-launch-note" role="status">
            <AlertTriangle size={11} strokeWidth={2} />
            An active session is already running or cleaning. Wait for it to finish before launching another.
          </div>
        )}

        {gamesLoading && (
          <div className="pcgo-game-manager-launch-note" role="status">
            <Info size={11} strokeWidth={2} />
            Waiting for the configured game list before launch can be evaluated.
          </div>
        )}

        {/* Judgment call (same family as above): the final branch
            interpolates a raw backend reason string
            (hostStatus?.host_ready_reason) — arbitrary case, forcing
            typeScale.meta's uppercase would garble it. Left literal for
            the whole conditional, including the three static branches,
            for consistency within this one message slot. */}
        {sessionBlocked && hostStatus?.host_ready_reason != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "10.5px",
              color: colors.warning,
              fontFamily: fonts.mono,
            }}
          >
            <AlertTriangle size={11} strokeWidth={2} />
            {hostState === "maintenance"
              ? "Host is in maintenance mode."
              : hostState === "recovery"
              ? "Host is in recovery mode."
              : hostState === "starting"
              ? "Host is still starting."
              : `Host not ready: ${hostStatus?.host_ready_reason ?? "Unknown reason"}`}
          </div>
        )}
      </div>
    </div>
  );
}
