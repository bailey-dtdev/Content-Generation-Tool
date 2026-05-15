# Rule: Build process

How a phase from `docs/build-plan.md` moves from start to done.

## Pick up a phase

1. Open `docs/build-plan.md`. Find the lowest-numbered phase still `[ ]`
   in the §3 checklist.
2. Check its **Depends on** line. If a dependency phase isn't `[x]`, do
   that one first — or pick a phase whose dependencies *are* met (phases
   5–13 have some parallelism).
3. Read the phase's **Governing docs** sections in the scope and
   architecture docs. They are the authority for the work.
4. Mark the phase `[~]` in §3 and commit that change.

## Do the work

- Build only what the phase's **Deliverables** list. Don't pull work
  forward from later phases.
- Follow `coding-standards.md` and the relevant `CLAUDE.md`.
- If the architecture doc is silent or seems wrong on something the phase
  needs, **stop and raise it** — don't invent an architectural decision.
- If you discover a phase's scope is wrong, fix `build-plan.md` in the
  same PR and explain why.

## Finish a phase

A phase is done only when **every acceptance criterion is met** — not when
the code merely exists. Before marking `[x]`:

- All acceptance criteria for the phase verified.
- `coding-standards.md` definition of done satisfied (lint, types, tests).
- Docs updated per `documentation.md` — including the §3 checklist flipped
  to `[x]`, and any stub placeholder comments removed for files now real.
- `/verify-rules` run clean; `/cleanup-docs` run if markdown changed.

## One phase, one focus

Don't bundle unrelated phases into a single PR. A phase may span multiple
PRs if large, but each PR should be coherent and independently reviewable.
