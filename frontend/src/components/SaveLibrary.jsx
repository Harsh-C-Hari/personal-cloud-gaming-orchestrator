/**
 * components/SaveLibrary.jsx
 *
 * Dedicated save-management view shared by the Admin and User dashboards.
 *
 * Ownership: GET /saves/{game_id} and DELETE /saves/{game_id}/{type}/{name}
 * are scoped to the authenticated JWT on the backend, so this component
 * never sends or selects a user — an admin sees only their own saves,
 * exactly like a normal user.
 *
 * This is NOT the compact selector inside StartSessionForm (SaveBrowser),
 * which stays as the launch-time picker. Real save names are passed to the
 * API untouched; formatted timestamps are display labels only
 * (see lib/saveNames.js).
 */

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  DatabaseBackup,
  Gamepad2,
  Inbox,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { deleteSave, fetchSaves } from "../api/client.js";
import { useConfirm } from "../hooks/useConfirm.js";
import { useToast } from "../hooks/useToast.js";
import { SectionCard } from "../dashboard/components/SectionCard.jsx";
import { LoadingState } from "../dashboard/components/LoadingState.jsx";
import { Button, Chip, EmptyState, IconButton } from "./ui/primitives.jsx";
import { describeSave, newestFirst, normalizeSaves } from "../lib/saveNames.js";

const TYPE_LABEL = { backups: "backup", archives: "archive" };

function GroupHeading({ id, icon, title, count, description }) {
  return (
    <div className="pcgo-save-library__group-head">
      <div className="pcgo-save-library__group-title-row">
        <span className="pcgo-save-library__group-icon" aria-hidden="true">{icon}</span>
        <h3 id={id} className="pcgo-save-library__group-title">{title}</h3>
        {count != null && <span className="pcgo-save-library__count">{count}</span>}
      </div>
      <p className="pcgo-save-library__group-desc">{description}</p>
    </div>
  );
}

function GroupEmpty({ children }) {
  return (
    <div className="pcgo-save-library__empty">
      <Inbox size={16} strokeWidth={1.75} aria-hidden="true" />
      {children}
    </div>
  );
}

// Identifiers are long unbroken tokens. <wbr> after each underscore gives the
// browser natural break points (so "…123456.zip" stays whole); the CSS
// overflow-wrap is only the last resort. No characters are added or changed.
function breakable(value) {
  return value.split(/(?<=_)/).map((part, index) => (
    <Fragment key={index}>
      {part}
      <wbr />
    </Fragment>
  ));
}

function MetaRow({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd translate="no">{breakable(value)}</dd>
    </div>
  );
}

function LatestCard() {
  return (
    <ul className="pcgo-save-library__grid" role="list">
      <li className="pcgo-save-library__card pcgo-save-library__card--latest">
        <div className="pcgo-save-library__card-top">
          <Chip tone="success" icon={<CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" />}>Latest</Chip>
        </div>
        <p className="pcgo-save-library__card-title">Current save</p>
        <dl className="pcgo-save-library__meta">
          <MetaRow label="Name" value="latest" />
        </dl>
      </li>
    </ul>
  );
}

function SaveCard({ type, name, deletingKey, onDelete }) {
  const info = describeSave(type, name);
  const label = TYPE_LABEL[type];
  const key = `${type}:${name}`;
  const deleting = deletingKey === key;
  const parsed = info.title !== name;

  return (
    <li className="pcgo-save-library__card">
      <div className="pcgo-save-library__card-top">
        {type === "backups" ? (
          <Chip tone="info" icon={<DatabaseBackup size={12} strokeWidth={2} aria-hidden="true" />}>Backup</Chip>
        ) : (
          <Chip tone="neutral" icon={<Archive size={12} strokeWidth={2} aria-hidden="true" />}>Archive</Chip>
        )}
        <IconButton
          aria-label={parsed ? `Delete ${label} from ${info.title}` : `Delete ${label} ${name}`}
          variant="danger"
          size="sm"
          disabled={Boolean(deletingKey)}
          onClick={() => onDelete(type, name)}
        >
          {deleting ? (
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" style={{ animation: "spin 0.8s linear infinite" }} />
          ) : (
            <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
          )}
        </IconButton>
      </div>

      <p className="pcgo-save-library__card-title">{info.title}</p>

      <dl className="pcgo-save-library__meta">
        {info.sessionId && <MetaRow label="Session" value={info.sessionId} />}
        {parsed && <MetaRow label={type === "archives" ? "File" : "Name"} value={name} />}
      </dl>
    </li>
  );
}

function SaveGroup({ type, names, deletingKey, onDelete, icon, title, description, emptyText }) {
  const headingId = useId();
  return (
    <section className="pcgo-save-library__group" aria-labelledby={headingId}>
      <GroupHeading id={headingId} icon={icon} title={title} count={names.length} description={description} />
      {names.length === 0 ? (
        <GroupEmpty>{emptyText}</GroupEmpty>
      ) : (
        <ul className="pcgo-save-library__grid" role="list">
          {names.map((name) => (
            <SaveCard key={name} type={type} name={name} deletingKey={deletingKey} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GamePicker({ entries, activeGameId, onSelect }) {
  return (
    <div className="pcgo-save-library__games" role="group" aria-label="Choose a game">
      {entries.map(([gameId, game]) => {
        const selected = gameId === activeGameId;
        const name = game?.name || gameId;
        return (
          <button
            key={gameId}
            type="button"
            className="pcgo-save-library__game"
            aria-pressed={selected}
            onClick={() => onSelect(gameId)}
          >
            <span className="pcgo-save-library__game-name" title={name}>{name}</span>
            <span className="pcgo-save-library__game-id" translate="no">{gameId}</span>
            {selected && (
              <CheckCircle2 className="pcgo-save-library__game-check" size={14} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * @param {{
 *   games: Record<string, { name?: string }>,
 *   gamesLoading?: boolean,
 *   refreshKey?: number,  // bumps when a session ends -> saves are re-fetched
 * }} props
 */
export function SaveLibrary({ games, gamesLoading = false, refreshKey = 0 }) {
  const confirm = useConfirm();
  const toast = useToast();
  const latestHeadingId = useId();

  const entries = useMemo(() => Object.entries(games || {}), [games]);
  const [selectedId, setSelectedId] = useState("");

  // Derived, not synced via an effect: falls back to the first game when
  // nothing is chosen yet or the chosen game was removed from the list.
  const activeGameId = selectedId && games?.[selectedId] ? selectedId : (entries[0]?.[0] ?? "");
  const activeGame = activeGameId ? games[activeGameId] : null;
  const gameName = activeGame?.name || activeGameId;

  const [loaded, setLoaded] = useState(null); // { gameId, saves }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingKey, setDeletingKey] = useState("");

  // Only the newest request may write state, so a slow response for a
  // previous game can never show under the current one.
  const requestRef = useRef(0);
  const activeGameRef = useRef(activeGameId);
  activeGameRef.current = activeGameId;
  const lastRefreshKeyRef = useRef(refreshKey);

  const load = useCallback(async (gameId, { silent = false } = {}) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    if (!silent) setError("");

    try {
      const data = await fetchSaves(gameId);
      if (requestId !== requestRef.current) return;
      setLoaded({ gameId, saves: normalizeSaves(data) });
      setError("");
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err?.message || "Failed to load saves.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeGameId) return undefined;
    load(activeGameId);
    return () => {
      requestRef.current += 1;
    };
  }, [activeGameId, load]);

  useEffect(() => {
    if (refreshKey === lastRefreshKeyRef.current) return;
    lastRefreshKeyRef.current = refreshKey;
    if (activeGameId) load(activeGameId, { silent: true });
  }, [refreshKey, activeGameId, load]);

  async function handleDelete(type, name) {
    if (deletingKey || !activeGameId) return;

    const gameId = activeGameId;
    const label = TYPE_LABEL[type];
    const info = describeSave(type, name);
    const message =
      info.title !== name
        ? `Delete the ${label} from ${info.title}? ${name} will be permanently removed.`
        : `Delete ${label} “${name}”? It will be permanently removed.`;

    if (!(await confirm(message, { danger: true, confirmLabel: "Delete" }))) return;

    setDeletingKey(`${type}:${name}`);
    try {
      await deleteSave(gameId, type, name);
      toast.success(`${label[0].toUpperCase()}${label.slice(1)} deleted.`);
    } catch (err) {
      toast.error(err?.message || `Failed to delete ${label}.`);
    } finally {
      setDeletingKey("");
      // Re-sync either way (a 404 means it was already gone), but only if
      // the user is still looking at the same game — otherwise this would
      // supersede the new game's in-flight request.
      if (activeGameRef.current === gameId) load(gameId, { silent: true });
    }
  }

  // ── Games panel ───────────────────────────────────────────────────────
  let gamesBody;
  if (gamesLoading) {
    gamesBody = <div role="status" aria-live="polite"><LoadingState label="Loading games…" /></div>;
  } else if (entries.length === 0) {
    gamesBody = (
      <EmptyState
        icon={Gamepad2}
        message="No games available"
        subtext="Games appear here once they’re configured."
      />
    );
  } else {
    gamesBody = <GamePicker entries={entries} activeGameId={activeGameId} onSelect={setSelectedId} />;
  }

  // ── Saves panel ───────────────────────────────────────────────────────
  const saves = loaded && loaded.gameId === activeGameId ? loaded.saves : null;
  const hasAnySaves = saves && (saves.latestExists || saves.backups.length > 0 || saves.archives.length > 0);

  return (
    <div className="pcgo-save-library">
      <SectionCard title="Games" count={gamesLoading ? undefined : entries.length}>
        {gamesBody}
      </SectionCard>

      {activeGameId && !gamesLoading && (
        <SectionCard
          title={`${gameName} saves`}
          onRefresh={() => load(activeGameId, { silent: true })}
        >
          <div aria-busy={loading}>
            <p className="pcgo-save-library__hint">
              To play from a backup or archive, choose it under Save Data when you start a session.
            </p>

            {error && (
              <div className="pcgo-save-library__error" role="alert">
                <span className="pcgo-save-library__error-text">
                  <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
                  {error}
                </span>
                <Button variant="secondary" size="sm" onClick={() => load(activeGameId)}>Try again</Button>
              </div>
            )}

            {!saves && !error && (
              <div role="status" aria-live="polite"><LoadingState label="Loading saves…" /></div>
            )}

            {saves && !hasAnySaves && (
              <EmptyState
                icon={Save}
                message={`No saves for ${gameName} yet`}
                subtext="Saves appear here after you play a session."
              />
            )}

            {saves && hasAnySaves && (
              <div className="pcgo-save-library__groups">
                <section className="pcgo-save-library__group" aria-labelledby={latestHeadingId}>
                  <GroupHeading
                    id={latestHeadingId}
                    icon={<Save size={15} strokeWidth={2} />}
                    title="Latest"
                    description="Loaded by default when you start a session."
                  />
                  {saves.latestExists ? (
                    <LatestCard />
                  ) : (
                    <GroupEmpty>No latest save for this game yet.</GroupEmpty>
                  )}
                </section>

                <SaveGroup
                  type="backups"
                  names={newestFirst(saves.backups)}
                  deletingKey={deletingKey}
                  onDelete={handleDelete}
                  icon={<DatabaseBackup size={15} strokeWidth={2} />}
                  title="Backups"
                  description="Versioned copies of your save."
                  emptyText="No backups for this game yet."
                />

                <SaveGroup
                  type="archives"
                  names={saves.archives}
                  deletingKey={deletingKey}
                  onDelete={handleDelete}
                  icon={<Archive size={15} strokeWidth={2} />}
                  title="Archives"
                  description="Zipped copies named after the session that created them."
                  emptyText="No archives for this game yet."
                />
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
