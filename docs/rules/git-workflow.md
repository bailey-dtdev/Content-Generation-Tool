# Rule: Git workflow

## Branches

- `main` — always deployable. Merges to `main` trigger deploys (arch §12).
- Feature branches off `main`, one per phase or per focused slice of a
  phase. Suggested name: `phase-<n>-<short-slug>` (e.g. `phase-2-db`).
- Never commit directly to `main`.

## Commits

- Small, coherent commits. One logical change each.
- Imperative subject line under ~70 chars: "Add client CRUD router", not
  "Added..." or "client stuff".
- The body explains *why* when it isn't obvious. Don't restate the diff.
- Don't commit secrets, `.env` files, build output, or `.DS_Store` — the
  root `.gitignore` covers these; keep it current.
- Create new commits; don't amend or force-push shared history.

## Pull requests

- One PR per phase (or per focused slice). Don't bundle unrelated phases.
- PR description states: which build-plan phase, what changed, how it was
  verified against the phase's acceptance criteria.
- The PR that completes or starts a phase also updates
  `docs/build-plan.md` §3.
- CI must be green before merge (once CI exists — Phase 14).
- Run `/verify-rules` before opening the PR; run `/cleanup-docs` if the PR
  touches markdown.

## Don't

- Don't skip hooks (`--no-verify`) or bypass checks to make a failure go
  away — fix the cause.
- Don't run destructive git operations (`reset --hard`, force-push,
  branch deletion) without explicit human confirmation.
