# Rule: Documentation hygiene

Markdown rots fast. These rules keep it from rotting. The `/cleanup-docs`
skill enforces them; run it before any PR that touches markdown.

## Where docs live

- **All project docs live in `docs/`.** No stray `.md` files scattered
  across source folders.
- **`CLAUDE.md` files are the exception** — they live at the repo root and
  in `backend/` and `frontend/`. There are exactly three. Don't add more.
- **`SKILL.md` files** live inside their skill folder under
  `.claude/skills/<name>/`. That is their only home.
- **One `README.md` per top-level area** at most (repo root, `docs/rules/`).
  Don't create README files inside source folders.

## The canonical docs

These four are the project's backbone. Keep them consistent with each other:

- `docs/content-generation-platform-mvp-scope.md` — functional scope (rarely
  changes; changing it is a scope decision).
- `docs/architecture-design.md` — technical decisions (changing it is an
  architecture decision — note it explicitly in the PR).
- `docs/build-plan.md` — phased plan. Its **§3 checklist is live state** —
  update it in the same PR that completes or starts a phase.
- `docs/runbook.md` — operational notes; grows as we deploy.

## Writing rules

- **No duplication.** State a fact once, in the doc that owns it, and link
  to it. If you find yourself copying a paragraph, link instead.
- **Don't restate the architecture in CLAUDE.md or rules files.** Summarise
  and point. The architecture doc is the authority.
- **Reference by section number** (e.g. "arch §6.7"), not by quoting.
- **Keep headings shallow** — three levels max.
- **No dead links.** If you move or rename a doc, grep for references and
  fix them in the same change.
- **No emojis** in docs unless a doc already uses them intentionally.

## Cleanup as we go

- When a phase completes, tick it in `docs/build-plan.md` §3.
- When a decision changes, update the owning doc — don't leave a stale
  statement and a contradicting newer one.
- When a stub file is filled in, remove the "Stub:" placeholder comment.
- Delete docs that no longer describe reality. A wrong doc is worse than no
  doc. Don't keep "just in case" markdown.
- If a TODO/placeholder is resolved, delete it. If it's still open, make
  sure it's tracked in the build plan or the relevant doc's open-items
  section.

## Before merging markdown

Run `/cleanup-docs`. It checks: doc location, the §3 checklist freshness,
dead links, leftover stub placeholders, and duplication.
