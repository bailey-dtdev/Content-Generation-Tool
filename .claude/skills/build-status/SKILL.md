---
name: build-status
description: Report progress against docs/build-plan.md — which phases are done, in progress, or blocked — and name the next actionable phase with its dependencies and acceptance criteria. Use to orient at the start of a session or to decide what to work on next.
---

# build-status

Orient the work against `docs/build-plan.md`.

## Steps

1. **Read the plan.** Open `docs/build-plan.md` — the §3 checklist and the
   per-phase detail in §4.

2. **Verify the checklist against reality.** For each phase marked `[x]`
   or `[~]`, sanity-check that the corresponding code/files actually
   exist. Note any phase whose checklist state looks wrong (flag it — fix
   it via `/cleanup-docs` or directly, with the user's nod).

3. **Find the next actionable phase.** The lowest-numbered phase that is
   not `[x]` and whose **Depends on** phases are all `[x]`. If the lowest
   incomplete phase is blocked, look for a later phase whose dependencies
   *are* met (phases 5–13 have parallelism).

4. **Check for blockers.** Look at §6 (open items) — e.g. the GCP project
   for Phase 3, verified pricing for Phase 13. Flag any that block the
   next phase.

## Output

A concise status report:

- **Done:** phases marked `[x]`.
- **In progress:** phases marked `[~]`.
- **Next up:** the next actionable phase — its goal, deliverables,
  acceptance criteria, and any blocker from §6.
- **Blocked:** phases that can't start yet and why.

Keep it short — a snapshot, not a recap of the whole plan.
