---
name: verify-rules
description: Check the current uncommitted changes (or a given diff) against the repo's rules suite in docs/rules/ — coding standards, scope discipline, git workflow, documentation hygiene. Use before committing or opening a PR.
---

# verify-rules

Check the working changes against `docs/rules/` before they are committed.

## Steps

1. **Get the diff.** Run `git status` and `git diff HEAD` (include staged
   and unstaged). If the user named a specific branch or commit range,
   diff that instead.

2. **Read the rules.** Load `docs/rules/coding-standards.md`,
   `documentation.md`, `git-workflow.md`, `build-process.md`. Also the
   relevant `CLAUDE.md` for any folder the diff touches.

3. **Check the diff against each rule.** In particular:
   - **Scope:** does the change build only what the current build-plan
     phase needs? Flag speculative abstraction, backwards-compat shims,
     unrequested features, or anything drifting into MVP scope §3
     non-goals.
   - **Quality:** typed, no stray `any`, no unexplained suppressions, no
     hardcoded secrets, no secrets in log statements, error handling only
     at boundaries.
   - **Comments:** no what-comments, no task/PR references; stub
     placeholder lines removed from files that are now real.
   - **Docs:** if the diff completes or starts a phase, is
     `docs/build-plan.md` §3 updated? Are docs in the right place?
   - **Git:** no secrets, `.env`, build output, or `.DS_Store` staged.

4. **Run the mechanical checks** if the toolchain exists yet: backend
   `ruff check` + `mypy app/`; frontend `eslint` + `tsc --noEmit`. Skip
   gracefully (note it) if a phase hasn't created that toolchain.

## Output

A pass/fail verdict per rule area (scope, quality, comments, docs, git),
each with specific file:line references for any violation. If everything
passes, say so plainly. Do **not** auto-fix — report so the author
decides. End with: ready to commit, or the blocking items.
