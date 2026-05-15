---
name: cleanup-docs
description: Audit and tidy the repo's markdown documentation — enforce doc location, check the build-plan checklist is current, find dead links, stale stub placeholders, and duplication. Use before any PR that touches markdown, or when docs feel out of sync.
---

# cleanup-docs

Enforce `docs/rules/documentation.md`. Audit the repo's markdown, report
issues, and fix the safe ones.

## Steps

1. **Locate all markdown.** List every `.md` file in the repo (exclude
   `.git/` and dependency folders like `node_modules/`).

2. **Check doc location.** Per `docs/rules/documentation.md`:
   - Project docs belong in `docs/`. Flag any stray `.md` outside `docs/`,
     `.claude/skills/*/`, or the three allowed `CLAUDE.md` locations.
   - There must be exactly three `CLAUDE.md` files (root, `backend/`,
     `frontend/`). Flag extras or a missing one.
   - Each `.claude/skills/<name>/` should contain exactly one `SKILL.md`.

3. **Check the build plan is current.** Open `docs/build-plan.md` §3.
   Cross-check the `[ ]` / `[~]` / `[x]` states against reality (does the
   code for a phase actually exist and meet its acceptance criteria?).
   Flag any checklist entry that disagrees with the codebase.

4. **Find dead links.** For every relative link and section reference in
   markdown, verify the target file exists. Flag broken links.

5. **Find stale stub placeholders.** Grep for `Stub:` placeholder comments.
   For each, check whether the file is actually still a stub. If a stub
   file now has real content, the placeholder line should be gone — flag
   it.

6. **Find duplication.** Look for the same fact/paragraph stated in more
   than one doc. Flag it; the fact should live in one owning doc with
   links from elsewhere.

7. **Check hygiene basics.** Heading depth ≤ 3, no emojis (unless the doc
   already uses them intentionally), no leftover resolved TODOs.

## Output

Report findings grouped as **Fix automatically** vs **Needs a human
decision**:

- **Fix automatically** — dead links from a rename, leftover stub
  comments, heading depth, formatting. Apply these fixes directly.
- **Needs a human decision** — a stale checklist entry, duplicated
  content, a doc that contradicts a source doc, a misplaced file whose
  correct home is ambiguous. List them; don't guess.

Close with a one-line summary: how many issues found, how many fixed, how
many need a decision.
