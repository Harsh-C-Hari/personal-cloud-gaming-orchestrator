/**
 * src/lib/pluralize.js
 *
 * Minimal plural helper — avoids hard-coding "s" on every count display.
 *
 * @param {number} n         - The count
 * @param {string} singular  - Singular form ("session")
 * @param {string} [plural]  - Plural form; defaults to singular + "s" ("sessions")
 * @returns {string}         - e.g. "1 session" or "3 sessions"
 *
 * Usage:
 *   pluralize(1, "session")          → "1 session"
 *   pluralize(2, "session")          → "2 sessions"
 *   pluralize(0, "game")             → "0 games"
 *   pluralize(1, "entry", "entries") → "1 entry"
 *   pluralize(2, "entry", "entries") → "2 entries"
 */
export function pluralize(n, singular, plural) {
  const form = n === 1 ? singular : (plural ?? `${singular}s`);
  return `${n} ${form}`;
}
