# CURRENT_TASK.md

## TASK ID
P9-T01

## TASK NAME
Final full-repo validation pass + documentation finalization — last
task of the project

## PHASE
P9

## OBJECTIVE
P7, P7.5, and P8 are all fully closed, with clean `lint`/`build`/`test`
confirmed at every single acceptance along the way. P9's job is to do
one final, independent confirmation that nothing has drifted since the
last accepted state (P8-T01 made no code changes, so this should be a
formality — but per this project's own established standard, verify
rather than assume), then finalize the project's documentation so
`.ai/HANDOFF.md`/`CHANGELOG.md` accurately reflect a closed, complete
project.

## WHY THIS TASK MATTERS
This is a low-risk, mostly-mechanical task by design — P9 exists to
close the loop, not to do new work. The one thing worth being careful
about: confirming validation is genuinely re-run and genuinely green,
not assumed green because everything upstream was green.

## EXACT SCOPE
1. Run a full, fresh `npm install`/`npm run lint`/`npm run build`/
   `npm run test` on the delivered `frontend/` tree. Confirm: 0 lint
   errors (pre-existing warnings are expected and fine — this project
   has carried the same handful since early phases, documented in
   `CHANGELOG.md`), a successful build, and all tests passing.
2. If Chromium/network is reachable this session (this project has
   repeatedly hit `cdn.playwright.dev` outside its network allowlist —
   don't be surprised if it fails again), do a final visual sanity
   check via `qa/render.mjs` on 2-3 representative pages (e.g. Login,
   a themed dashboard page, Settings). If not reachable, note that
   explicitly rather than skip silently — same standard this project
   has held throughout.
3. Read `CHANGELOG.md` in full, start to finish. Confirm it reads as a
   coherent, accurate project history — this is the project's
   permanent record. Do not rewrite prior entries; if you spot an
   actual inaccuracy in a past entry that was never corrected, flag it
   in a new entry rather than editing history (matching this project's
   established convention of correcting-in-place-going-forward, never
   silently erasing).
4. Write a final `CHANGELOG.md` entry summarizing the whole project's
   closure: phases completed, findings fixed, findings correctly
   deferred to `host-agent` maintainers (out of scope), and final
   validation results from step 1.
5. Update `.ai/HANDOFF.md` to reflect the project is complete — no
   dangling "next task," a clear closing summary, and pointers to
   where the 2 flagged backend issues (`host_monitor.py`'s platform
   guard; `SessionStatusResponse`/`TailscaleController`'s
   field-presence gaps) are documented for whoever picks up
   `host-agent` work separately.
6. Update `.ai/STATE.md` and `.ai/PLAN.md` with final DONE markers if
   any are still showing stale status.
7. Do not make any `frontend/src/` code changes in this task — if
   step 1's validation somehow fails, stop and report it rather than
   attempting a fix (that would need its own properly-scoped task,
   consistent with this project's whole review methodology).

## FILES/AREAS TO INSPECT
`frontend/` (for validation only, no inspection needed beyond running
the standard commands), `.ai/CHANGELOG.md` in full, `.ai/PLAN.md`,
`.ai/STATE.md`.

## FILES/AREAS ALLOWED TO CHANGE
`.ai/CHANGELOG.md`, `.ai/HANDOFF.md`, `.ai/STATE.md`, `.ai/PLAN.md`.
No `frontend/` or `host-agent/` file changes.

## DO NOT TOUCH
`frontend/src/`, `host-agent/` entirely, `.ai/RULES.md`,
`.ai/ARCHITECTURE.md`, `.ai/DECISIONS.md`, `.ai/P7_AUDIT_FINDINGS.md`,
the 3 design-reference docs — none of these need changes for project
closure.

## FUNCTIONALITY TO PRESERVE
Everything — this is a verification-only task with documentation
updates, zero functional risk if scope is respected.

## DESIGN REQUIREMENTS
N/A.

## RESPONSIVE REQUIREMENTS
N/A.

## ACCESSIBILITY REQUIREMENTS
N/A — all accessibility work (P7) is already closed.

## VALIDATION REQUIREMENTS
This task's entire substance IS validation — see Exact Scope steps 1-2.

## ACCEPTANCE CRITERIA
1. Fresh lint/build/test genuinely re-run, results reported honestly
   (including if anything unexpectedly fails — that would be a real,
   important finding, not a task failure).
2. `CHANGELOG.md` has a final closing entry.
3. `HANDOFF.md` reflects project completion, no dangling next-task.
4. `STATE.md`/`PLAN.md` show accurate final status.
5. No `frontend/src/`/`host-agent/` changes.

## DELIVERABLE
`.ai/*` only (no `frontend/src/` or `host-agent/` changes expected).
Full-repo delivery per D-010 is unnecessary here since nothing in
`frontend/`/`host-agent/` changes — but do include the full `.ai/`
folder in the delivery zip (all files, not just the changed ones —
per this project's established convention, which the previous P8-T01
delivery deviated from).
1. Summary: validation results (genuinely fresh, not copy-pasted from
   memory of prior runs).
2. Confirmation `CHANGELOG.md`/`HANDOFF.md`/`STATE.md`/`PLAN.md` are
   all finalized.

## STATUS
**DISPATCHED — awaiting Worker delivery.**
