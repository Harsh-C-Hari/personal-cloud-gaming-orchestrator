/**
 * src/lib/saveNames.js
 *
 * Presentation-only helpers for the save identifiers returned by
 * GET /saves/{game_id}. The real name is a filesystem identifier and is
 * always passed back to the API untouched — anything produced here is a
 * display label only.
 *
 * Name formats (host-agent/host_agent/save_manager.py):
 *   backup  -> v_<stamp>                (folder)
 *   archive -> <session_id>_<stamp>.zip (file)
 * where <stamp> = datetime.now().strftime("%Y%m%d_%H%M%S_%f") — the host's
 * *local* wall-clock time, with no timezone. We therefore build the Date
 * from those exact components and never convert zones, so the digits the
 * user sees match the digits in the filename.
 */

const STAMP = "(\\d{4})(\\d{2})(\\d{2})_(\\d{2})(\\d{2})(\\d{2})_(\\d{6})";
const BACKUP_RE = new RegExp(`^v_${STAMP}$`);
const ARCHIVE_RE = new RegExp(`^(.+)_${STAMP}\\.zip$`, "i");

function dateFromStamp(parts) {
  const [year, month, day, hour, minute, second, micro] = parts.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second, Math.floor(micro / 1000));

  // Reject impossible values (e.g. month 13, Feb 31) that Date would
  // silently roll over into a different, wrong date.
  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;

  return roundTrips ? date : null;
}

let formatter;

/** e.g. "Oct 3, 2026, 8:45:30 PM" (locale-aware via Intl). */
export function formatSaveDate(date) {
  formatter ??= new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });
  return formatter.format(date);
}

/**
 * @param {"backups"|"archives"} type
 * @param {string} name  real save name from the API
 * @returns {{ name: string, title: string, date: Date|null, sessionId: string|null }}
 *   `title` is the formatted timestamp when the name parses, otherwise the
 *   real name itself (never invented metadata).
 */
export function describeSave(type, name) {
  let date = null;
  let sessionId = null;

  if (type === "backups") {
    const match = BACKUP_RE.exec(name);
    if (match) date = dateFromStamp(match.slice(1, 8));
  } else if (type === "archives") {
    const match = ARCHIVE_RE.exec(name);
    if (match) {
      date = dateFromStamp(match.slice(2, 9));
      if (date) sessionId = match[1];
    }
  }

  return { name, title: date ? formatSaveDate(date) : name, date, sessionId };
}

/**
 * The API lists backups oldest-first (sorted by name) but archives
 * newest-first (by mtime). Backup names embed a fixed-width timestamp, so a
 * descending name sort puts the newest backup first.
 */
export function newestFirst(names) {
  return [...names].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/** Coerces an API response into a predictable shape. */
export function normalizeSaves(data) {
  const names = (list) => (Array.isArray(list) ? list.filter((n) => typeof n === "string" && n) : []);
  return {
    latestExists: Boolean(data?.latest_exists),
    backups: names(data?.backups),
    archives: names(data?.archives),
  };
}
