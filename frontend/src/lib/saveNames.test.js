/**
 * src/lib/saveNames.test.js
 *
 * Covers the display-only parsing of real save names: valid names yield a
 * label, anything unreliable falls back to the actual name untouched.
 */

import { describe, it, expect } from "vitest";
import { describeSave, formatSaveDate, newestFirst, normalizeSaves } from "./saveNames.js";

describe("describeSave", () => {
  it("parses a backup name and keeps the real name", () => {
    const info = describeSave("backups", "v_20261003_204530_123456");
    expect(info.name).toBe("v_20261003_204530_123456");
    expect(info.date).toEqual(new Date(2026, 9, 3, 20, 45, 30, 123));
    expect(info.title).toBe(formatSaveDate(new Date(2026, 9, 3, 20, 45, 30, 123)));
    expect(info.sessionId).toBeNull();
  });

  it("parses an archive name and exposes the session id prefix verbatim", () => {
    const info = describeSave("archives", "session_7a81c2d1_20261003_204530_123456.zip");
    expect(info.date).toEqual(new Date(2026, 9, 3, 20, 45, 30, 123));
    expect(info.sessionId).toBe("session_7a81c2d1");
    expect(info.name).toBe("session_7a81c2d1_20261003_204530_123456.zip");
  });

  it("falls back to the real name when the format is unrecognised", () => {
    expect(describeSave("backups", "manual-copy").title).toBe("manual-copy");
    expect(describeSave("archives", "old-save.zip")).toMatchObject({
      title: "old-save.zip",
      date: null,
      sessionId: null,
    });
  });

  it("falls back instead of rolling impossible dates over", () => {
    expect(describeSave("backups", "v_20261340_204530_123456").title).toBe("v_20261340_204530_123456");
    expect(describeSave("backups", "v_20260231_204530_123456").date).toBeNull();
    expect(describeSave("backups", "v_20261003_246130_123456").date).toBeNull();
  });

  it("does not parse a backup-shaped name as an archive or vice versa", () => {
    expect(describeSave("archives", "v_20261003_204530_123456").date).toBeNull();
    expect(describeSave("backups", "session_a_20261003_204530_123456.zip").date).toBeNull();
  });
});

describe("newestFirst", () => {
  it("orders fixed-width timestamped names newest first without mutating input", () => {
    const input = ["v_20260101_000000_000001", "v_20261003_204530_123456", "v_20250101_000000_000000"];
    expect(newestFirst(input)).toEqual([
      "v_20261003_204530_123456",
      "v_20260101_000000_000001",
      "v_20250101_000000_000000",
    ]);
    expect(input[0]).toBe("v_20260101_000000_000001");
  });
});

describe("normalizeSaves", () => {
  it("maps the API shape and tolerates missing/invalid fields", () => {
    expect(normalizeSaves({ latest_exists: true, archives: ["a.zip", "", 5], backups: ["v_1"] })).toEqual({
      latestExists: true,
      archives: ["a.zip"],
      backups: ["v_1"],
    });
    expect(normalizeSaves(undefined)).toEqual({ latestExists: false, archives: [], backups: [] });
  });
});
