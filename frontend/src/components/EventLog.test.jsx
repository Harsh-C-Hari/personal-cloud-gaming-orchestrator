/**
 * src/components/EventLog.test.jsx
 *
 * Regression coverage for the empty-feed crash (.ai/DECISIONS.md D-004):
 * `latest = events[0]` is `undefined` when `events` is `[]`, and
 * `latest.session_id` was previously read unguarded inside a `useEffect`
 * dependency array — which is evaluated on every render, not just inside
 * the effect body — throwing before React even runs the effect.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventLog } from "./EventLog.jsx";

describe("EventLog — empty feed", () => {
  it("renders without throwing when events is []", () => {
    expect(() => render(<EventLog events={[]} connected={true} />)).not.toThrow();
    expect(screen.getByText(/waiting for activity/i)).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders without throwing when events is [] and connected is false", () => {
    expect(() => render(<EventLog events={[]} connected={false} />)).not.toThrow();
  });
});

describe("EventLog — non-empty feed", () => {
  it("renders the latest event row and count", () => {
    const events = [
      { type: "session_status", session_id: "sess-1", status: "running", ts: "12:00:00 PM", date: "Aug 16" },
    ];

    render(<EventLog events={events} connected={true} />);

    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("sess-1")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
